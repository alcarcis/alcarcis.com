import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { codeText, repositories } from "../../../src/lib/open-source.ts";
import {
  typingSteps,
  type TypingStep,
} from "../../../src/scripts/usage-terminal/typing.ts";

/** WCAG 2.2.2: motion that starts by itself and lasts longer than this needs a pause control. */
const pauseControlThresholdMs = 5000;

const shownCounts = (steps: readonly TypingStep[]): number[] =>
  steps.map((step) => step.shown);

const gaps = (steps: readonly TypingStep[]): number[] =>
  steps.slice(1).map((step, index) => step.at - (steps[index]?.at ?? 0));

describe("typingSteps", () => {
  it("shows two more characters a step, in order, and ends with all of them", () => {
    assert.deepEqual(shownCounts(typingSteps("npm ci")), [2, 4, 6]);
    assert.deepEqual(shownCounts(typingSteps("npm")), [2, 3]);
  });

  it("waits a moment before the first characters show", () => {
    const [first] = typingSteps("npm ci");

    assert.ok(first);
    assert.ok(first.at > 0);
  });

  it("keeps an even pace within a line", () => {
    const steps = typingSteps("npm run check");

    assert.equal(new Set(gaps(steps)).size, 1);
  });

  it("pauses longer after a step that ends a line", () => {
    // Steps: "a\n" ends the first line, then "bc", "de".
    const [afterBreak, withinLine] = gaps(typingSteps("a\nbcde"));

    assert.ok(afterBreak !== undefined && withinLine !== undefined);
    assert.ok(afterBreak > withinLine);
  });

  it("has nothing to type for an empty text", () => {
    assert.deepEqual(typingSteps(""), []);
  });

  for (const { name, usage } of repositories) {
    it(`types ${name}'s usage in under five seconds, so it needs no pause control`, () => {
      const steps = typingSteps(codeText(usage.code));
      const last = steps.at(-1);

      assert.ok(last);
      assert.equal(last.shown, codeText(usage.code).length);
      assert.ok(last.at < pauseControlThresholdMs);
    });
  }
});
