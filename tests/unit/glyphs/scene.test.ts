import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CHECK_GLYPHS,
  INK,
  inAtlas,
  type Grid,
  type Ink,
} from "../../../src/scripts/glyphs/cells.ts";
import {
  beats,
  ciCdStage,
  fixAt,
  stepStart,
} from "../../../src/scripts/instrument/timeline.ts";
import { drawnGlyphs, sceneGrid, sceneTimes } from "./support.ts";

/** The inks the gate's bars are drawn in at time t: MARK while shut, CHECK once open. */
const gateInks = (grid: Grid, t: number): Set<Ink> =>
  new Set(
    drawnGlyphs(grid, t)
      .filter(({ glyph }) => glyph === CHECK_GLYPHS.gate)
      .map(({ ink }) => ink),
  );

/** The ci/cd step fades in over its first 0.15 s, while the step before fades out. */
const gateDrawnFrom = stepStart(ciCdStage) + 0.2;

describe("the scene's pass ink", () => {
  it("draws only glyphs the atlas holds in that ink", () => {
    const grid = sceneGrid();
    const drawn = new Set<string>();
    const missing = new Set<string>();

    for (const t of sceneTimes) {
      for (const { glyph, ink } of drawnGlyphs(grid, t)) {
        if (ink !== INK.CHECK) continue;
        drawn.add(glyph);
        if (!inAtlas(INK.CHECK, glyph))
          missing.add(glyph || "(no atlas column)");
      }
    }

    assert.ok(drawn.size > 0, "the scene never draws in the pass ink");
    assert.deepEqual([...missing], []);
  });
});

describe("the scene's ci/cd step", () => {
  it("keeps the gate shut until the fix merges", () => {
    const grid = sceneGrid();
    const beforeTheFix = sceneTimes.filter(
      (t) => t >= gateDrawnFrom && t < fixAt,
    );

    assert.ok(beforeTheFix.length > 0);
    for (const t of beforeTheFix) {
      assert.deepEqual(gateInks(grid, t), new Set([INK.MARK]), `at ${t} s`);
    }
  });

  it("has the gate open when the stage passes", () => {
    const grid = sceneGrid();

    assert.deepEqual(
      gateInks(grid, beats[ciCdStage] - 0.01),
      new Set([INK.CHECK]),
    );
  });
});
