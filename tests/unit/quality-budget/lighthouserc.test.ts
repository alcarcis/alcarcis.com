import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { describe, it } from "node:test";
import { minimumCategoryScore } from "../../../scripts/quality-budget.ts";

type Assertion = readonly [level: string, options: { minScore?: number }];

interface LighthouseConfig {
  readonly ci: {
    readonly assert: { readonly assertions: Record<string, Assertion> };
  };
}

/* Loaded the way Lighthouse CI loads it: a CommonJS require from the project root. */
const config = createRequire(import.meta.url)(
  "../../../lighthouserc.cjs",
) as LighthouseConfig;

describe("lighthouserc", () => {
  it("fails a page whose category scores fall below the shared minimum", () => {
    const assertions = Object.entries(config.ci.assert.assertions);

    assert.notEqual(assertions.length, 0);
    for (const [category, [level, { minScore }]] of assertions) {
      assert.deepEqual(
        [level, minScore],
        ["error", minimumCategoryScore],
        category,
      );
    }
  });
});
