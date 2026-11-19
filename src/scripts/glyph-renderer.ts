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
  type Grid,
} from "./glyphs/cells";
import { measureQuiet, renderField, sizeField } from "./glyphs/field";
import { drawSteps, setBand, setReducedMotion } from "./glyphs/scene";

export interface GlyphScene {
  draw(sceneTime: number): void;
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

function mountScene(box: HTMLElement): ((t: number) => void) | null {
  const canvas = box.querySelector<HTMLCanvasElement>("[data-scene-canvas]");
  const grid = canvas && makeGrid(canvas);
  if (!canvas || !grid) return null;
  const labels = [
    box.querySelector("[data-scene-label]"),
    box.querySelector("[data-scene-caption]"),
  ];
  let sceneTime = 0;

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
    box.dataset["drawn"] = "";
  };

  if (!size()) return null;
  new ResizeObserver(() => {
    if (size()) draw(sceneTime);
  }).observe(box);
  addEventListener("glyphs:redraw", () => {
    grid.full = true;
    draw(sceneTime);
  });
  return draw;
}

export async function mountGlyphLayers(
  instrument: HTMLElement | null,
  reducedMotion: MediaQueryList,
): Promise<GlyphScene | null> {
  await gridFontReady();
  await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
  measureFont();
  measureCells();
  setReducedMotion(reducedMotion.matches);
  await slice();
  buildAtlas();
  await slice();

  // The scene first: it is the part in view, and the run may already be playing.
  const sceneBox = instrument?.querySelector<HTMLElement>("[data-scene]");
  const drawScene = sceneBox ? mountScene(sceneBox) : null;
  await slice();

  const fieldCanvas = document.querySelector<HTMLCanvasElement>(
    "canvas[data-glyph-field]",
  );
  const field: Grid | null = fieldCanvas && makeGrid(fieldCanvas);
  if (field) {
    sizeField(field);
    await slice();
    measureQuiet();
    await slice();
    renderField(field);
    wireField(field);
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
  new MutationObserver(onThemeChange).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  matchMedia("(prefers-color-scheme: dark)").addEventListener(
    "change",
    onThemeChange,
  );
  reducedMotion.addEventListener("change", (event) => {
    setReducedMotion(event.matches);
    redrawAll();
  });

  let resizeTimer = 0;
  addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (measureCells()) buildAtlas();
      if (field) sizeField(field);
      measureQuiet();
      redrawAll();
    }, 120);
  });

  return drawScene ? { draw: drawScene } : null;
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

function wireField(field: Grid): void {
  fieldGrid = field;
  addEventListener("scroll", requestFieldFrame, { passive: true });
  document.addEventListener("visibilitychange", requestFieldFrame);

  let layoutFrame = 0;
  const relayout = (): void => {
    if (layoutFrame) return;
    layoutFrame = requestAnimationFrame(() => {
      layoutFrame = 0;
      measureQuiet();
      requestFieldFrame();
    });
  };
  new ResizeObserver(relayout).observe(document.body);
  // A section content-visibility starts or stops rendering needs its text measured again.
  for (const section of document.querySelectorAll("main > section")) {
    section.addEventListener("contentvisibilityautostatechange", relayout);
  }
  void document.fonts.ready.then(relayout);
}
