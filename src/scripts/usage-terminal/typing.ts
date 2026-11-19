/*
 * How a README's usage types itself: two characters a step at an even pace, a short pause
 * after each line, and nothing else. Every usage on the page types in well under five seconds,
 * the point past which motion that starts by itself needs a way to stop it (WCAG 2.2.2).
 */

const charsPerStep = 2;
const stepMs = 26;
const lineBreakPauseMs = 200;
/** The wait between the terminal coming into view and its first characters. */
const startDelayMs = 250;

export interface TypingStep {
  /** How many characters show once this step lands. */
  readonly shown: number;
  /** Milliseconds after typing starts at which the step lands. */
  readonly at: number;
}

/** Every step that types the text, in order; the last one shows all of it. */
export function typingSteps(text: string): TypingStep[] {
  const steps: TypingStep[] = [];
  let at = startDelayMs;
  for (let shown = 0; shown < text.length;) {
    const next = Math.min(text.length, shown + charsPerStep);
    steps.push({ shown: next, at });
    at += text.slice(shown, next).includes("\n") ? lineBreakPauseMs : stepMs;
    shown = next;
  }
  return steps;
}
