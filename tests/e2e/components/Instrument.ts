import { expect, type Clock, type Locator } from "@playwright/test";
import { runStatus, specSource, stageNames } from "../data/instrument";
import type { InstrumentCopy, StageStateNames } from "../data/locales";
import type { CanvasBuffer } from "./GlyphField";

export type StageState = keyof StageStateNames;

/** Either status the bar shows, matched whole. */
const anyRunStatus = new RegExp(`^(${Object.values(runStatus).join("|")})$`);

/** What the run shows at one moment, read in a single pass. */
export interface RunSnapshot {
  readonly stages: readonly (StageState | undefined)[];
  readonly caption: string;
  readonly captionShown: boolean;
}

/** Backing-store pixels per CSS pixel of a canvas, across and down. */
export interface CanvasScale {
  readonly across: number;
  readonly down: number;
}

/** Where the renderer put the scene canvas: its inline size and offset, "" when unset. */
export interface CanvasPlacement {
  readonly width: string;
  readonly height: string;
  readonly left: string;
  readonly top: string;
}

/** A canvas the renderer never sized, or took back down. */
export const unplacedCanvas: CanvasPlacement = {
  width: "",
  height: "",
  left: "",
  top: "",
};

/** How often the clock moves on while waiting for the renderer. */
const rendererStepMs = 100;
/**
 * Shorter than one of the renderer's idle slices, 50 ms on the test's clock while timers are
 * pending, so the clock stops between two steps of its boot.
 */
const bootStepMs = 10;

export class Instrument {
  readonly region: Locator;
  /** The bar's title: the suite and the spec it runs. */
  readonly barTitle: Locator;
  readonly status: Locator;
  readonly stages: Locator;
  readonly specText: Locator;
  readonly sceneLabel: Locator;
  readonly sceneCaption: Locator;
  readonly skip: Locator;
  readonly rerun: Locator;
  readonly announcement: Locator;
  /**
   * The visible, typed code. It is hidden from assistive technology (specText carries it), so
   * it has no role to find it by.
   */
  readonly typedCode: Locator;
  /** The scene's box; the renderer marks it with the scene time of the run's frame it drew. */
  readonly scene: Locator;
  /** The scene's last frame in text: it shows between runs until the renderer has drawn. */
  readonly textFrame: Locator;
  readonly textFrameLines: Locator;
  readonly sceneCanvas: Locator;

  constructor(
    scope: Locator,
    private readonly copy: InstrumentCopy,
  ) {
    this.region = scope.getByRole("complementary", {
      name: copy.name,
      exact: true,
    });
    this.barTitle = this.region.getByText(/· quality\.spec\.ts$/i);
    this.status = this.region.getByText(anyRunStatus);
    this.stages = this.region.getByRole("list", {
      name: copy.stagesName,
      exact: true,
    });
    /* The visible code is hidden from assistive technology; this is the text it reads instead. */
    this.specText = this.region
      .getByRole("paragraph")
      .filter({ hasText: specSource });
    this.sceneLabel = this.region.getByText(copy.sceneLabel, { exact: true });
    this.sceneCaption = this.region.getByText(/^0\d .+ · .+$/);
    this.skip = this.region.getByRole("button", {
      name: copy.skipName,
      exact: true,
    });
    this.rerun = this.region.getByRole("button", {
      name: copy.rerunName,
      exact: true,
    });
    this.announcement = this.region.getByRole("status");
    this.typedCode = this.region.locator("[data-spec]");
    this.scene = this.region.locator("[data-scene]");
    this.textFrame = this.scene.locator("[data-scene-still]");
    this.textFrameLines = this.textFrame.locator(":scope > span");
    this.sceneCanvas = this.scene.locator("canvas");
  }

  /** The caption the scene shows while stage `index` plays (0-based). */
  captionFor(index: number, fixed = false): string {
    const action = fixed ? this.copy.fixCaption : this.copy.captions[index];
    return `0${index + 1} ${stageNames[index]} · ${action}`;
  }

  /** Asserts each stage row reads its name and the given state, in order. */
  async expectStages(states: readonly StageState[]): Promise<void> {
    const rows = stageNames.map(
      (name, index) =>
        `  - listitem: ${name} ${this.copy.stageStates[states[index] ?? "pending"]}`,
    );
    await expect(this.stages).toMatchAriaSnapshot(
      [`- list "${this.copy.stagesName}":`, ...rows].join("\n"),
    );
  }

  async expectFinalFrame(): Promise<void> {
    await expect(this.status).toHaveText(runStatus.passed);
    await this.expectStages(stageNames.map(() => "passed"));
    await expect(this.sceneCaption).toHaveText(
      this.captionFor(stageNames.length - 1),
    );
    await expect(this.specText).toBeAttached();
    await expect(this.typedCode).toHaveText(specSource);
  }

  /**
   * The run starts once the page is idle and the instrument is in view. Idle time is on the
   * test's clock; the view check is the browser's own, so this waits for it in real time.
   */
  async startRun(clock: Clock): Promise<void> {
    await clock.runFor(100);
    await this.expectRunState("playing");
  }

  /** The run's state hook: waiting, playing, paused or final. */
  async expectRunState(state: string): Promise<void> {
    await expect(this.region).toHaveAttribute("data-run-state", state);
  }

  /** The renderer loads once the page is idle, on the test's clock; this moves it on until then. */
  async waitForSceneDrawn(clock: Clock): Promise<void> {
    await expect
      .poll(async () => {
        await clock.runFor(rendererStepMs);
        return this.scene.getAttribute("data-drawn");
      })
      .not.toBeNull();
  }

  /**
   * Moves the clock on in short steps until the renderer has sized the scene canvas. It stops
   * there: the renderer still has the grain to boot, in idle slices, before it is done.
   */
  async waitForSceneSized(clock: Clock): Promise<void> {
    await expect
      .poll(
        async () => {
          await clock.runFor(bootStepMs);
          return this.sceneCanvas.evaluate(
            (canvas: HTMLCanvasElement) => canvas.width,
          );
        },
        { intervals: [0] },
      )
      .toBeGreaterThan(0);
  }

  /** Waits until the browser has reported the scene box's size, so the renderer's observer has run too. */
  async settleSceneObservers(): Promise<void> {
    await this.scene.evaluate(
      (box) =>
        new Promise<void>((resolve) => {
          const observer = new ResizeObserver(() => {
            observer.disconnect();
            resolve();
          });
          observer.observe(box);
        }),
    );
  }

  /** The scene time of the frame the renderer last drew. */
  async drawnSceneTime(): Promise<number> {
    return Number(await this.scene.getAttribute("data-drawn"));
  }

  /** The scene canvas's backing store in device pixels. */
  async sceneCanvasBuffer(): Promise<CanvasBuffer> {
    return this.sceneCanvas.evaluate((canvas: HTMLCanvasElement) => ({
      width: canvas.width,
      height: canvas.height,
    }));
  }

  async sceneCanvasPlacement(): Promise<CanvasPlacement> {
    return this.sceneCanvas.evaluate((canvas: HTMLCanvasElement) => ({
      width: canvas.style.width,
      height: canvas.style.height,
      left: canvas.style.left,
      top: canvas.style.top,
    }));
  }

  async sceneCanvasScale(): Promise<CanvasScale> {
    return this.sceneCanvas.evaluate((canvas: HTMLCanvasElement) => {
      const box = canvas.getBoundingClientRect();
      return {
        across: canvas.width / box.width,
        down: canvas.height / box.height,
      };
    });
  }

  /** How far the typed code runs past the right edge of its window, in CSS pixels. */
  async codeOverflow(): Promise<number> {
    return this.typedCode.evaluate((code) => {
      const window = code.parentElement;
      return window ? window.scrollWidth - window.clientWidth : 0;
    });
  }

  /** The height of the typed code's window. */
  async codeWindowHeight(): Promise<number> {
    return this.typedCode.evaluate(
      (code) => code.parentElement?.getBoundingClientRect().height ?? 0,
    );
  }

  /** How many times assistive technology meets the spec's last call in the instrument. */
  async specReadCount(): Promise<number> {
    const tree = await this.region.ariaSnapshot();
    return tree.split("toHaveQuality").length - 1;
  }

  async height(): Promise<number> {
    return this.region.evaluate(
      (instrument) => instrument.getBoundingClientRect().height,
    );
  }

  /**
   * Scrolls until the instrument's top `pixels` show at the bottom of the viewport, then waits
   * for the browser to report its new intersection, so the page's own observers have run too.
   */
  async scrollToShow(pixels: number): Promise<void> {
    await this.region.evaluate(async (instrument, shown) => {
      const top = instrument.getBoundingClientRect().top + window.scrollY;
      const view = document.documentElement.clientHeight;
      window.scrollTo({ top: top - (view - shown), behavior: "instant" });
      await new Promise<void>((resolve) => {
        const observer = new IntersectionObserver(() => {
          observer.disconnect();
          resolve();
        });
        observer.observe(instrument);
      });
    }, pixels);
  }

  async snapshot(): Promise<RunSnapshot> {
    const stateByName = new Map(
      Object.entries(this.copy.stageStates).map(([state, name]) => [
        name,
        state as StageState,
      ]),
    );
    const raw = await this.region.evaluate((instrument) => {
      const caption = instrument.querySelector<HTMLElement>(
        "[data-scene-caption]",
      );
      return {
        states: [...instrument.querySelectorAll("[data-stage-state]")].map(
          (state) => state.textContent?.trim() ?? "",
        ),
        caption: caption?.textContent?.replace(/\s+/g, " ").trim() ?? "",
        captionShown: caption
          ? getComputedStyle(caption).visibility === "visible"
          : false,
      };
    });
    return {
      stages: raw.states.map((name) => stateByName.get(name)),
      caption: raw.caption,
      captionShown: raw.captionShown,
    };
  }
}
