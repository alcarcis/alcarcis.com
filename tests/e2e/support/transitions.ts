import type { Page } from "@playwright/test";

/** A transition the page started: the property it animates and the element it animates. */
export interface StartedTransition {
  readonly property: string;
  /** The element as tag, id and classes, plus the pseudo-element when the transition runs on one. */
  readonly target: string;
}

/** The window property a recording lives on while its action runs. */
const recordingKey = "__startedTransitions";

interface Recording {
  readonly started: StartedTransition[];
  readonly stop: () => void;
}

/** The window, seen as the slots a recording can live on. */
type RecordingSlots = Record<string, Recording | undefined>;

/**
 * Frames to wait once the action returns: the frame whose style update applies the change, the
 * one that sends its transition events, and one more, so a change the page completes a frame
 * later (the theme script turns transitions back on then) is caught as well.
 */
const framesAfterAction = 3;

const isColourProperty = (property: string): boolean =>
  /(^|-)color$/.test(property) || property === "fill" || property === "stroke";

const describeTransition = (
  { property, target }: StartedTransition,
  position: number,
): string => `${position}. ${property} on ${target}`;

/** Runs in the page: listens for every transition that starts until the recording stops. */
function startRecording(key: string): void {
  const started: StartedTransition[] = [];
  const label = (element: Element): string =>
    [
      element.localName,
      element.id === "" ? "" : `#${element.id}`,
      ...[...element.classList].map((name) => `.${name}`),
    ].join("");
  const record = (event: TransitionEvent): void => {
    if (event.target instanceof Element) {
      started.push({
        property: event.propertyName,
        target: `${label(event.target)}${event.pseudoElement}`,
      });
    }
  };
  document.addEventListener("transitionrun", record, { capture: true });
  (window as unknown as RecordingSlots)[key] = {
    started,
    stop: () =>
      document.removeEventListener("transitionrun", record, { capture: true }),
  };
}

/** Runs in the page: lets the given number of frames pass, then ends the recording. */
async function stopRecording({
  key,
  frames,
}: {
  key: string;
  frames: number;
}): Promise<StartedTransition[]> {
  for (let frame = 0; frame < frames; frame += 1) {
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
  }
  const slots = window as unknown as RecordingSlots;
  const recording = slots[key];
  if (recording === undefined)
    throw new Error("No transition recording is running.");
  recording.stop();
  delete slots[key];
  return recording.started;
}

export class TransitionReport {
  constructor(readonly started: readonly StartedTransition[]) {}

  /** The started transitions that blend one colour into another. */
  get colourTransitions(): StartedTransition[] {
    return this.started.filter(({ property }) => isColourProperty(property));
  }

  summary(): string {
    return this.colourTransitions
      .map((transition, index) => describeTransition(transition, index + 1))
      .join("\n");
  }
}

export class TransitionRecorder {
  constructor(private readonly page: Page) {}

  /**
   * Runs the action and reports the transitions that started while it ran and in the frames
   * that follow it. It counts transitionrun events rather than sampling the transitions still
   * running at the end, so a slow machine that lets a transition finish first cannot hide it.
   */
  async during(action: () => Promise<void>): Promise<TransitionReport> {
    await this.page.evaluate(startRecording, recordingKey);
    await action();
    const started = await this.page.evaluate(stopRecording, {
      key: recordingKey,
      frames: framesAfterAction,
    });
    return new TransitionReport(started);
  }

  /** Waits until no transition runs, so a recording that follows sees only what its action starts. */
  async settle(): Promise<void> {
    // getAnimations() applies pending style changes first, so a transition that a style change
    // is about to start counts as running too.
    await this.page.waitForFunction(
      () =>
        !document
          .getAnimations()
          .some((animation) => animation instanceof CSSTransition),
    );
  }
}
