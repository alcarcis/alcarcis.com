/*
 * The instrument's run as a pure function of its elapsed time: the spec types itself, then the
 * scene shows what QA does at each of the five stages while the stage rows follow it. Exactly
 * one row runs at a time, the one the scene is showing; it passes at its beat and the next row
 * starts in the same frame. The renderer draws the scene from the same scene time.
 */

/** Scene seconds at which each stage's step completes. */
export const beats = [1.2, 2.5, 3.8, 6.1, 6.9] as const;
export const sceneEnd = 7.2;
/** In ci/cd the fix merges 1.3 s into the step; the renderer opens the gate on the same offset. */
export const fixAt = beats[2] + 1.3;

const typingStepMs = 30;
const charsPerStep = 3;
const sceneDelayMs = 250;
const finishDelayMs = 450;
const stageCount = beats.length;

export type StageState = "pending" | "running" | "passed";

export interface RunFrame {
  /** Characters of the spec shown. */
  readonly typed: number;
  /** The spec is still typing (or about to): the caret shows and the scene waits. */
  readonly typing: boolean;
  /** Seconds into the scene, from 0 to sceneEnd. */
  readonly sceneTime: number;
  readonly stages: readonly StageState[];
  /** The stage the scene's caption names; null while the spec types. */
  readonly caption: { readonly stage: number; readonly fixed: boolean } | null;
  /** The data rows come back when the scene ends. */
  readonly rowsRevealed: boolean;
  readonly done: boolean;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export function runFrameAt(
  elapsedMs: number,
  specLength: number,
  leadMs: number,
): RunFrame {
  const steps = Math.max(1, Math.ceil(specLength / charsPerStep));
  const sceneStartMs = leadMs + (steps - 1) * typingStepMs + sceneDelayMs;
  const typed =
    elapsedMs < leadMs
      ? 0
      : Math.min(
          specLength,
          (Math.floor((elapsedMs - leadMs) / typingStepMs) + 1) * charsPerStep,
        );

  if (elapsedMs < sceneStartMs) {
    return {
      typed,
      typing: true,
      sceneTime: 0,
      stages: Array<StageState>(stageCount).fill("pending"),
      caption: null,
      rowsRevealed: false,
      done: false,
    };
  }

  const sceneTime = clamp((elapsedMs - sceneStartMs) / 1000, 0, sceneEnd);
  const passed = beats.filter((beat) => sceneTime >= beat).length;
  const stages = beats.map((_, stage): StageState =>
    stage < passed ? "passed" : stage === passed ? "running" : "pending",
  );
  const captioned = Math.min(passed, stageCount - 1);
  return {
    typed: specLength,
    typing: false,
    sceneTime,
    stages,
    caption: {
      stage: captioned,
      fixed: captioned === 3 && passed === 3 && sceneTime >= fixAt,
    },
    rowsRevealed: sceneTime >= sceneEnd,
    done: elapsedMs >= sceneStartMs + sceneEnd * 1000 + finishDelayMs,
  };
}
