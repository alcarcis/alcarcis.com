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
  finalFrame,
  type FrameInk,
} from "../../../src/scripts/glyphs/final-frame.ts";
import {
  beats,
  ciCdStage,
  fixAt,
  sceneEnd,
  stepStart,
} from "../../../src/scripts/instrument/timeline.ts";
import {
  drawnGlyphs,
  sceneGrid,
  sceneTimes,
  shownCells,
  shownLines,
} from "./support.ts";

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

const productionStage = 4;
/** The production step fades in over its first 0.2 s, while the gate fades out. */
const deployDrawnFrom = stepStart(productionStage) + 0.2;
const deployTimes = sceneTimes.filter(
  (t) => t >= deployDrawnFrom && t < beats[productionStage],
);
const jobs = ["build", "test", "deploy"] as const;
const pending = "·";
const check = "✓";

/** What a job's status cell shows at time t: pending, a running mark, or the check. */
function jobStatus(lines: readonly string[], job: string): string {
  for (const line of lines) {
    const at = line.indexOf(` ${job}`);
    if (at > 0 && line.includes(`${job}${job === "deploy" ? "│" : "├"}`))
      return line[at - 1] ?? "";
  }
  throw new Error(`No ${job} job in: ${lines.join(" / ")}`);
}

/** What production's status cell shows: pending until the deploy reaches it, then the check. */
function environmentStatus(lines: readonly string[]): string {
  const line = lines.find((l) => l.startsWith("production "));
  if (!line) throw new Error(`No production line in: ${lines.join(" / ")}`);
  return line["production ".length] ?? "";
}

/** What has been typed of "deployed", after production's status. */
function deployedWord(lines: readonly string[]): string {
  const line = lines.find((l) => l.startsWith("production ")) ?? "";
  const from = "production ✓ ".length;
  return line.slice(from, from + "deployed".length).trim();
}

/** The ink and alpha level each run of the text frame stands for in the renderer. */
const rendererInk: Record<FrameInk, { ink: Ink; level: number }> = {
  box: { ink: INK.TEXT, level: 1 },
  name: { ink: INK.TEXT, level: 2 },
  link: { ink: INK.MARK, level: 2 },
  check: { ink: INK.CHECK, level: 3 },
};

describe("the scene's production step", () => {
  it("ends on the finished workflow run: every job checked, production deployed", () => {
    assert.deepEqual(shownLines(sceneGrid(), sceneEnd), [
      "┌───────┐  ┌──────┐  ┌────────┐",
      "│✓ build├──┤✓ test├──┤✓ deploy│",
      "└───────┘  └──────┘  └───┬────┘",
      "production ✓ deployed ───┘",
    ]);
  });

  it("starts with every job and production pending", () => {
    const lines = shownLines(sceneGrid(), deployDrawnFrom);

    assert.deepEqual(
      jobs.map((job) => jobStatus(lines, job)),
      [pending, pending, pending],
    );
    assert.equal(environmentStatus(lines), pending);
  });

  it("runs one job at a time, in order, and deploys to production last", () => {
    const grid = sceneGrid();
    const passedOrder: string[] = [];

    for (const t of deployTimes) {
      const lines = shownLines(grid, t);
      const statuses = jobs.map((job) => jobStatus(lines, job));
      const running = statuses.filter((s) => s !== pending && s !== check);
      assert.ok(running.length <= 1, `at ${t} s: ${statuses.join(" ")}`);
      const passed: string[] = jobs.filter((_, j) => statuses[j] === check);
      if (environmentStatus(lines) === check) passed.push("production");
      for (const name of passed)
        if (!passedOrder.includes(name)) passedOrder.push(name);
      assert.deepEqual(passed, passedOrder.slice(0, passed.length));
      if (deployedWord(lines) !== "")
        assert.ok(passed.includes("production"), `deployed early, at ${t} s`);
    }

    assert.deepEqual(passedOrder, [...jobs, "production"]);
  });

  it("draws only the checks in the pass ink", () => {
    const grid = sceneGrid();
    const passInk = new Set<string>();

    for (const t of deployTimes) {
      for (const { glyph, ink } of drawnGlyphs(grid, t))
        if (ink === INK.CHECK) passInk.add(glyph);
    }

    assert.deepEqual([...passInk], [check]);
  });

  it("ends on the frame the page shows in text, run by run in the same inks", () => {
    const cells = shownCells(sceneGrid(), sceneEnd);

    assert.deepEqual(
      finalFrame.map((line) => line.map(([, text]) => text).join("")),
      cells.map((row) => row.map((cell) => cell?.glyph ?? " ").join("")),
    );
    finalFrame.forEach((line, r) => {
      let c = 0;
      for (const [kind, text] of line) {
        for (const glyph of text) {
          const cell = cells[r]?.[c++];
          if (glyph === " ") continue;
          assert.deepEqual(
            cell && { ink: cell.ink, level: cell.level },
            rendererInk[kind],
            `${kind} '${glyph}' at line ${r}, column ${c - 1}`,
          );
        }
      }
    });
  });
});
