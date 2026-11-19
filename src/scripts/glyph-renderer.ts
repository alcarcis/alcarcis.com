/*
 * The glyph layers: the page's quiet grain and the instrument's scene, on two small canvases
 * that share one glyph atlas. Loaded once the page has painted and gone idle. Nothing loops:
 * the grain redraws when the page scrolls or changes, and the scene draws when the instrument's
 * run asks it to. No dependencies.
 */
import {
  blit,
  buildAtlas,
  ch,
  currentTheme,
  cw,
  makeGrid,
  measureCells,
  measureFont,
  quietRect,
  resetLayers,
  sizeGrid,
  unsizeGrid,
  type Grid,
} from "./glyphs/cells";
import { measureQuiet, renderField, sizeField } from "./glyphs/field";
import { drawSteps, setBand, setReducedMotion } from "./glyphs/scene";

export interface GlyphScene {
  draw(sceneTime: number): void;
}

interface SceneLayer extends GlyphScene {
  /** Fits the grid and its canvas to the box at the current cell size, then redraws the run's frame. */
  resize(): void;
}

/* Boot in short idle slices so no single task blocks input for long. */
const slice = (): Promise<void> =>
  new Promise((resolve) => {
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => resolve(), { timeout: 400 });
    } else {
      setTimeout(resolve, 16);
    }
  });

/* Wait briefly for the grid font, so cells are measured in the right face. */
function gridFontReady(): Promise<unknown> {
  const fontLoad = document.fonts
    .load("400 16px 'Geist Mono'")
    .catch(() => undefined);
  return Promise.race([fontLoad, new Promise((r) => setTimeout(r, 1500))]);
}

/* Undoes one step of the mount if the mount is called off (it failed, or its first draw did). */
const onAbort = (signal: AbortSignal, undo: () => void): void =>
  signal.addEventListener("abort", undo, { once: true });

/* The pixel ratio changes when the window moves to another screen or the page zooms, and a
   resize event need not come with it. The query matches one ratio, so each change re-arms it. */
function onPixelRatioChange(callback: () => void, signal: AbortSignal): void {
  matchMedia(`(resolution: ${devicePixelRatio}dppx)`).addEventListener(
    "change",
    () => {
      callback();
      onPixelRatioChange(callback, signal);
    },
    { once: true, signal },
  );
}

function mountScene(box: HTMLElement, signal: AbortSignal): SceneLayer | null {
  const canvas = box.querySelector<HTMLCanvasElement>("[data-scene-canvas]");
  const grid = canvas && makeGrid(canvas);
  if (!canvas || !grid) return null;
  const labels = [
    box.querySelector("[data-scene-label]"),
    box.querySelector("[data-scene-caption]"),
  ];
  /* The scene time of the frame on the canvas; none until the run draws its first, so the text
     frame shows until then. A resize or a redraw only repeats a frame the run asked for. */
  let sceneTime: number | null = null;

  const size = (): boolean => {
    const w = box.clientWidth;
    const h = box.clientHeight;
    if (!w || !h) return false;
    sizeGrid(grid, Math.floor(w / cw), Math.floor(h / ch), 0x5ce7e);
    const ox = Math.floor((w - grid.cols * cw) / 2);
    const oy = Math.floor((h - grid.rows * ch) / 2);
    canvas.style.left = `${ox}px`;
    canvas.style.top = `${oy}px`;
    // The label and the caption sit on clear ground; the steps draw in the rows between them.
    const b = box.getBoundingClientRect();
    let top = 1;
    let bottom = grid.rows - 2;
    labels.forEach((label, index) => {
      if (!label) return;
      const l = label.getBoundingClientRect();
      const y0 = l.top - b.top - oy - 2;
      const y1 = l.bottom - b.top - oy + 2;
      quietRect(
        grid,
        l.left - b.left - ox - 4,
        y0,
        l.right - b.left - ox + 4,
        y1,
        true,
      );
      if (index === 0) top = Math.floor(y1 / ch) + 1;
      else bottom = Math.floor(y0 / ch) - 1;
    });
    setBand(top, bottom);
    return true;
  };

  const draw = (t: number): void => {
    sceneTime = t;
    if (!grid.N) return;
    resetLayers(grid);
    drawSteps(grid, t);
    blit(grid);
    box.dataset["drawn"] = String(t);
  };

  const redraw = (): void => {
    if (sceneTime !== null) draw(sceneTime);
  };

  const resize = (): void => {
    if (size()) redraw();
  };

  if (!size()) return null;
  const observer = new ResizeObserver(resize);
  observer.observe(box);
  addEventListener(
    "glyphs:redraw",
    () => {
      grid.full = true;
      redraw();
    },
    { signal },
  );
  onAbort(signal, () => {
    observer.disconnect();
    unsizeGrid(grid);
    canvas.style.left = "";
    canvas.style.top = "";
    delete box.dataset["drawn"];
  });
  return { draw, resize };
}

/**
 * Mounts the scene and the grain. Aborting the signal takes down everything the mount put up,
 * however far it got: listeners, observers, timers and both canvases, and the text frame shows.
 */
export async function mountGlyphLayers(
  instrument: HTMLElement | null,
  reducedMotion: MediaQueryList,
  signal: AbortSignal,
): Promise<GlyphScene | null> {
  await gridFontReady();
  await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
  measureFont();
  measureCells();
  const measuredRatio = devicePixelRatio;
  setReducedMotion(reducedMotion.matches);
  await slice();
  buildAtlas();
  await slice();

  // The scene first: it is the part in view, and the run may already be playing.
  const sceneBox = instrument?.querySelector<HTMLElement>("[data-scene]");
  const scene = sceneBox ? mountScene(sceneBox, signal) : null;
  await slice();

  const fieldCanvas = document.querySelector<HTMLCanvasElement>(
    "canvas[data-glyph-field]",
  );
  const field: Grid | null = fieldCanvas && makeGrid(fieldCanvas);
  if (field) {
    onAbort(signal, () => unsizeGrid(field));
    sizeField(field);
    await slice();
    measureQuiet();
    await slice();
    renderField(field);
    wireField(field, signal);
  }

  const redrawAll = (): void => {
    if (field) field.full = true;
    dispatchEvent(new Event("glyphs:redraw"));
    requestFieldFrame();
  };

  let theme = currentTheme();
  const onThemeChange = (): void => {
    const next = currentTheme();
    if (next === theme) return;
    theme = next;
    buildAtlas();
    redrawAll();
  };
  const themeObserver = new MutationObserver(onThemeChange);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  onAbort(signal, () => themeObserver.disconnect());
  matchMedia("(prefers-color-scheme: dark)").addEventListener(
    "change",
    onThemeChange,
    { signal },
  );
  reducedMotion.addEventListener(
    "change",
    (event) => {
      setReducedMotion(event.matches);
      redrawAll();
    },
    { signal },
  );

  /* A new pixel ratio changes the device cell: the atlas and both grids follow, the scene's too,
     whose own observer sees only CSS size changes. A plain resize changes the grain's grid. */
  let relayoutTimer = 0;
  const relayout = (): void => {
    clearTimeout(relayoutTimer);
    relayoutTimer = window.setTimeout(() => {
      if (measureCells()) {
        buildAtlas();
        scene?.resize();
      }
      if (field) sizeField(field);
      measureQuiet();
      redrawAll();
    }, 120);
  };
  onAbort(signal, () => clearTimeout(relayoutTimer));
  addEventListener("resize", relayout, { signal });
  onPixelRatioChange(relayout, signal);
  // A ratio change during the idle slices above came before the watcher: catch up on it.
  if (devicePixelRatio !== measuredRatio) relayout();

  return scene;
}

/* ---------- the grain: redrawn only when the page scrolls or its layout changes ---------- */

let fieldFrame = 0;
let fieldGrid: Grid | null = null;

function requestFieldFrame(): void {
  if (fieldFrame || document.hidden) return;
  fieldFrame = requestAnimationFrame(() => {
    fieldFrame = 0;
    if (fieldGrid && !document.hidden) renderField(fieldGrid);
  });
}

function wireField(field: Grid, signal: AbortSignal): void {
  fieldGrid = field;
  addEventListener("scroll", requestFieldFrame, { passive: true, signal });
  document.addEventListener("visibilitychange", requestFieldFrame, { signal });

  let layoutFrame = 0;
  const relayout = (): void => {
    if (layoutFrame || signal.aborted) return;
    layoutFrame = requestAnimationFrame(() => {
      layoutFrame = 0;
      measureQuiet();
      requestFieldFrame();
    });
  };
  const observer = new ResizeObserver(relayout);
  observer.observe(document.body);
  // A section content-visibility starts or stops rendering needs its text measured again.
  for (const section of document.querySelectorAll("main > section")) {
    section.addEventListener("contentvisibilityautostatechange", relayout, {
      signal,
    });
  }
  void document.fonts.ready.then(relayout);
  onAbort(signal, () => {
    observer.disconnect();
    cancelAnimationFrame(layoutFrame);
    cancelAnimationFrame(fieldFrame);
    fieldFrame = 0;
    fieldGrid = null;
  });
}
