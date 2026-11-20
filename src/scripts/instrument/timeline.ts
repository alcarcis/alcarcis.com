/*
 * The instrument's run as a pure function of its elapsed time: the spec types itself, then the
 * scene shows what QA does at each of the five stages while the stage rows follow it. Exactly
 * one row runs at a time, the one the scene is showing; it passes at its beat and the next row
 * starts in the same frame. The renderer draws the scene from the same scene time.
 */

/** Scene seconds at which each stage's step completes. */
export const beats = [1.2, 2.5, 3.8, 6.1, 8.1] as const;
export const sceneEnd = 8.4;
/** The stage whose gate catches a defect and lets it through once its fix merges. */
export const ciCdStage = 3;
/** Seconds into the ci/cd step at which the fix merges; the scene's gate opens from then. */
export const fixDelay = 1.3;

/** Scene seconds at which a stage's step begins: when the step before it completes. */
export const stepStart = (stage: number): number =>
  stage > 0 ? (beats[stage - 1] ?? 0) : 0;

/** Scene seconds at which the fix merges; the page switches the ci/cd caption then. */
export const fixAt = stepStart(ciCdStage) + fixDelay;

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
      fixed:
        captioned === ciCdStage && passed === ciCdStage && sceneTime >= fixAt,
    },
    done: elapsedMs >= sceneStartMs + sceneEnd * 1000 + finishDelayMs,
  };
}
