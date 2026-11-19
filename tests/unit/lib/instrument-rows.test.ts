import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  instrumentRows,
  type InstrumentFacts,
  type InstrumentRow,
} from "../../../src/lib/instrument-rows.ts";
import { nbsp } from "./support.ts";

const everyFact: InstrumentFacts = {
  commit: "0123abc",
  built: "2026-11-18",
  tests: 42,
};
const enforcedScore = 0.95;

const terms = (rows: readonly InstrumentRow[]): string[] =>
  rows.map((row) => row.term);

const budgetRow = (rows: readonly InstrumentRow[]): InstrumentRow | undefined =>
  rows.find((row) => row.term === "BUDGET");

describe("instrumentRows", () => {
  it("shows every fact the build read, in order", () => {
    assert.deepEqual(instrumentRows(everyFact, enforcedScore), [
      { term: "COMMIT", value: "0123abc" },
      { term: "BUILT", value: "2026-11-18", datetime: "2026-11-18" },
      { term: "TESTS", value: "42 playwright tests" },
      {
        term: "BUDGET",
        value: `lighthouse${nbsp}≥${nbsp}95 · axe${nbsp}0${nbsp}violations`,
      },
    ]);
  });

  it("counts a single test in the singular", () => {
    const rows = instrumentRows({ ...everyFact, tests: 1 }, enforcedScore);

    assert.equal(
      rows.find((row) => row.term === "TESTS")?.value,
      "1 playwright test",
    );
  });

  it("leaves out the COMMIT row when the build could not read the commit", () => {
    const rows = instrumentRows({ ...everyFact, commit: null }, enforcedScore);

    assert.deepEqual(terms(rows), ["BUILT", "TESTS", "BUDGET"]);
  });

  it("leaves out the TESTS row when the build could not count the tests", () => {
    const rows = instrumentRows({ ...everyFact, tests: null }, enforcedScore);

    assert.deepEqual(terms(rows), ["COMMIT", "BUILT", "BUDGET"]);
  });

  it("leaves out a fact that is empty instead of showing a blank value", () => {
    const rows = instrumentRows({ ...everyFact, commit: "" }, enforcedScore);

    assert.deepEqual(terms(rows), ["BUILT", "TESTS", "BUDGET"]);
  });

  it("never shows a blank or placeholder value, whichever facts are missing", () => {
    for (const commit of [null, "", "0123abc"]) {
      for (const tests of [null, 0, 1, 42]) {
        for (const { term, value } of instrumentRows(
          { ...everyFact, commit, tests },
          enforcedScore,
        )) {
          assert.notEqual(value.trim(), "", `${term} is blank`);
          assert.doesNotMatch(value, /null|undefined|NaN|—|\?/, term);
        }
      }
    }
  });

  it("states the Lighthouse score it is given as the budget", () => {
    const rows = instrumentRows(everyFact, 0.9);

    assert.equal(
      budgetRow(rows)?.value,
      `lighthouse${nbsp}≥${nbsp}90 · axe${nbsp}0${nbsp}violations`,
    );
  });
});
