import { expect, type Locator } from "@playwright/test";
import { specSource, stageNames } from "../data/instrument";
import type { InstrumentCopy, StageStateNames } from "../data/locales";

export type StageState = keyof StageStateNames;

export class Instrument {
  readonly region: Locator;
  readonly status: Locator;
  readonly stages: Locator;
  readonly specText: Locator;
  readonly sceneLabel: Locator;
  readonly sceneCaption: Locator;

  constructor(
    scope: Locator,
    private readonly copy: InstrumentCopy,
  ) {
    this.region = scope.getByRole("complementary", {
      name: copy.name,
      exact: true,
    });
    this.status = this.region.getByText(/^(Passed|Running)$/);
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
  }

  /** The value a data row shows next to its term, such as COMMIT. */
  dataValue(term: string): Locator {
    return this.region
      .getByRole("term")
      .filter({ hasText: new RegExp(`^${term}$`) })
      .locator("xpath=following-sibling::*[1]");
  }

  /** The caption the scene shows while stage `index` plays (0-based). */
  captionFor(index: number): string {
    return `0${index + 1} ${stageNames[index]} · ${this.copy.captions[index]}`;
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
    await expect(this.status).toHaveText("Passed");
    await this.expectStages(stageNames.map(() => "passed"));
    await expect(this.sceneCaption).toHaveText(
      this.captionFor(stageNames.length - 1),
    );
    await expect(this.specText).toBeAttached();
  }
}
