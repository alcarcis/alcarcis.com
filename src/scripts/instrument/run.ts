/*
 * The instrument's run: quality.spec.ts types itself once the page is idle and the instrument
 * is in view, then the scene and the five stage rows play in sync (see timeline.ts) and the
 * run ends Passed. Skip, a click on the card or a key press shows the finished run at once;
 * Rerun replays it. The run pauses while the instrument is off-screen or the tab is hidden.
 * Under reduced motion the final frame stays put, with no typing.
 *
 * A replay is the presentation only: the COMMIT, BUILT, TESTS and BUDGET rows never change.
 */
import type { GlyphScene } from "../glyph-renderer";
import { whenIdle } from "../when-idle";
import {
  runFrameAt,
  sceneEnd,
  type RunFrame,
  type StageState,
} from "./timeline";

interface RunCopy {
  readonly captions: readonly string[];
  readonly fixCaption: string;
  readonly states: Readonly<Record<StageState, string>>;
  readonly passed: string;
}

/**
 * final: nothing plays. waiting: primed, until idle and in view. paused: off-screen or hidden.
 * holding: a replay under reduced motion, Running for a moment without typing.
 */
type RunState = "final" | "waiting" | "playing" | "paused" | "holding";

const firstLeadMs = 300;
const rerunLeadMs = 250;
const reducedRerunMs = 700;
/*
 * The first run starts once the visitor is looking at it: when 40% of the instrument is in view,
 * or when it covers three quarters of the viewport, whichever comes first. The second only
 * decides for an instrument taller than 1.875 viewports, on a short screen: above 2.5, 40% of it
 * never fits in view, while its visible part can always cover three quarters of the viewport.
 */
const startShare = 0.4;
const startCover = 0.75;
const interactive =
  "a[href], button, input, select, textarea, summary, [contenteditable]";

const root = document.documentElement;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const instrument = document.querySelector<HTMLElement>("[data-instrument]");

if (instrument) setUpRun(instrument);
root.classList.remove("run-pending");

function setUpRun(instrument: HTMLElement): void {
  const find = <T extends Element>(selector: string): T | null =>
    instrument.querySelector<T>(selector);
  const code = find<HTMLElement>("[data-spec]");
  const status = find<HTMLElement>("[data-run-status]");
  const skip = find<HTMLButtonElement>("[data-skip]");
  const rerun = find<HTMLButtonElement>("[data-rerun]");
  const live = find<HTMLElement>("[data-run-live]");
  const rows = find<HTMLElement>("[data-rows]");
  const caption = find<HTMLElement>("[data-scene-caption]");
  const captionParts = [
    ".caption-number",
    ".caption-stage",
    ".caption-action",
  ].map((selector) => caption?.querySelector<HTMLElement>(selector) ?? null);
  const stages = [...instrument.querySelectorAll<HTMLElement>("[data-stage]")];
  if (!code || !status || !skip || !rerun || !live || !rows || !caption) return;
  const el = { code, status, skip, rerun, live, rows, caption };
  const copy = JSON.parse(instrument.dataset["runCopy"] ?? "{}") as RunCopy;

  /* The spec's text nodes and their full text; typing reveals them in order. */
  const texts: [Text, string][] = [];
  const walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    texts.push([node, node.data]);
  }
  const specLength = texts.reduce((sum, [, full]) => sum + full.length, 0);
  const caret = document.createElement("span");
  caret.className = "caret";

  let state: RunState = "final";
  let firstRun = false;
  let leadMs = firstLeadMs;
  let elapsedBefore = 0;
  let playingSince = 0;
  let frameRequest = 0;
  let idle = false;
  let inView = false;
  let startAllowed = false;
  let sceneTime = sceneEnd;
  let scene: GlyphScene | null = null;

  const setState = (next: RunState): void => {
    state = next;
    instrument.dataset["runState"] = next;
  };
  const elapsed = (): number =>
    elapsedBefore +
    (state === "playing" ? performance.now() - playingSince : 0);

  function showTyped(count: number): void {
    let offset = 0;
    for (const [node, full] of texts) {
      const shown = full.slice(0, Math.max(0, count - offset));
      if (node.data !== shown) node.data = shown;
      offset += full.length;
    }
  }

  function setStage(index: number, stageState: StageState): void {
    const stage = stages[index];
    if (!stage) return;
    stage.dataset["state"] = stageState;
    const label = stage.querySelector("[data-stage-state]");
    if (label) label.textContent = copy.states[stageState];
  }

  function showCaption(frame: RunFrame["caption"]): void {
    el.caption.style.visibility = frame ? "" : "hidden";
    if (!frame) return;
    const [number, stageName, action] = captionParts;
    if (number) number.textContent = `0${frame.stage + 1}`;
    if (stageName) {
      stageName.textContent =
        stages[frame.stage]?.querySelector(".stage-name")?.textContent ?? "";
    }
    if (action) {
      action.textContent = frame.fixed
        ? copy.fixCaption
        : (copy.captions[frame.stage] ?? "");
    }
  }

  function drawScene(time: number): void {
    sceneTime = time;
    scene?.draw(time);
  }

  function apply(frame: RunFrame): void {
    showTyped(frame.typed);
    if (frame.typing) el.code.append(caret);
    else caret.remove();
    frame.stages.forEach((stageState, index) => setStage(index, stageState));
    showCaption(frame.caption);
    el.rows.toggleAttribute("data-pending", firstRun && !frame.rowsRevealed);
    drawScene(frame.sceneTime);
  }

  function frame(): void {
    frameRequest = 0;
    if (state !== "playing") return;
    const current = runFrameAt(elapsed(), specLength, leadMs);
    apply(current);
    if (current.done) finish();
    else frameRequest = requestAnimationFrame(frame);
  }

  function play(): void {
    playingSince = performance.now();
    setState("playing");
    frameRequest ||= requestAnimationFrame(frame);
  }

  function pause(): void {
    elapsedBefore = elapsed();
    setState("paused");
    cancelAnimationFrame(frameRequest);
    frameRequest = 0;
  }

  /* Plays while the page is idle, the tab visible and the instrument on screen. */
  function update(): void {
    const canPlay = idle && inView && !document.hidden;
    if (state === "playing" && !canPlay) pause();
    else if (state === "paused" && canPlay) play();
    else if (state === "waiting" && canPlay && startAllowed) play();
  }

  function setRunning(running: boolean): void {
    el.status.textContent = running ? "Running" : "Passed";
    el.rerun.setAttribute("aria-disabled", String(running));
  }

  function finish(): void {
    if (state === "final") return;
    cancelAnimationFrame(frameRequest);
    frameRequest = 0;
    showTyped(specLength);
    caret.remove();
    stages.forEach((_, index) => setStage(index, "passed"));
    showCaption({ stage: stages.length - 1, fixed: false });
    el.rows.removeAttribute("data-pending");
    drawScene(sceneEnd);
    setRunning(false);
    const skipHadFocus = document.activeElement === el.skip;
    el.skip.hidden = true;
    if (skipHadFocus) el.rerun.focus();
    instrument.removeEventListener("click", onCardClick);
    document.removeEventListener("keydown", onKey);
    setState("final");
    if (!firstRun) el.live.textContent = copy.passed;
  }

  /* A click on the card skips the run, except on Rerun itself. */
  function onCardClick(event: Event): void {
    if (!(event.target as Element).closest("[data-rerun]")) finish();
  }

  /* Any key skips the run, unless focus is on a control, a link or a field. */
  function onKey(event: KeyboardEvent): void {
    if ((event.target as Element | null)?.closest?.(interactive)) return;
    finish();
  }

  /* The run's opening state: empty spec, every stage pending, the scene's empty field. */
  function prime(first: boolean): void {
    firstRun = first;
    leadMs = first ? firstLeadMs : rerunLeadMs;
    elapsedBefore = 0;
    startAllowed = !first;
    el.live.textContent = "";
    setRunning(true);
    el.skip.hidden = false;
    setState("waiting");
    apply(runFrameAt(0, specLength, leadMs));
    instrument.addEventListener("click", onCardClick);
    document.addEventListener("keydown", onKey);
    update();
  }

  rerun.addEventListener("click", () => {
    if (state !== "final") return;
    if (!reducedMotion.matches) {
      prime(false);
      return;
    }
    // Reduced motion: Running for a moment, then the final frame, with no typing.
    firstRun = false;
    live.textContent = "";
    setRunning(true);
    setState("holding");
    setTimeout(finish, reducedRerunMs);
  });

  setRunning(false);
  setState("final");
  if (!reducedMotion.matches) prime(true);

  /* The share of the instrument in view that starts the first run, for its height and the
     viewport's (see startShare). */
  function startRatio(): number {
    const height = instrument.getBoundingClientRect().height;
    const view = root.clientHeight;
    return height > 0 && view > 0
      ? Math.min(startShare, (startCover * view) / height)
      : startShare;
  }

  /* Watches the instrument come into view; observed again whenever its start ratio changes. */
  let viewObserver: IntersectionObserver | null = null;
  let watchedRatio = 0;
  function watchView(): void {
    const ratio = startRatio();
    if (ratio === watchedRatio) return;
    watchedRatio = ratio;
    viewObserver?.disconnect();
    viewObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        inView = entry.isIntersecting;
        if (entry.intersectionRatio >= ratio) startAllowed = true;
        update();
      },
      { threshold: [0, ratio] },
    );
    viewObserver.observe(instrument);
  }

  watchView();
  new ResizeObserver(watchView).observe(instrument);
  addEventListener("resize", watchView);
  document.addEventListener("visibilitychange", update);

  /* The glyph renderer (grain and scene) loads only after the page has painted and gone idle.
     If it cannot load or mount, the text frame stays and the run plays on without the scene. */
  async function loadScene(): Promise<void> {
    try {
      const { mountGlyphLayers } = await import("../glyph-renderer");
      scene = await mountGlyphLayers(instrument, reducedMotion);
      drawScene(sceneTime);
    } catch {
      scene = null;
    }
  }

  whenIdle(() => {
    idle = true;
    update();
    void loadScene();
  });
}
