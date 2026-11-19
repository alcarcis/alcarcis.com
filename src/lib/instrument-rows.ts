import type { BuildInfo } from "../../scripts/build-info.ts";
import { breakOnlyBetween } from "./typography.ts";

/** One row of the instrument's data list: a term such as COMMIT and the fact it shows. */
export interface InstrumentRow {
  readonly term: string;
  readonly value: string;
  /** The value as a machine-readable date, when it is one. */
  readonly datetime?: string;
}

/** The build facts the rows show. */
export type InstrumentFacts = Pick<BuildInfo, "commit" | "built" | "tests">;

interface CandidateRow {
  readonly term: string;
  readonly value: string | null;
  readonly datetime?: string;
}

const testCount = (tests: number | null): string | null =>
  tests === null
    ? null
    : `${tests} playwright ${tests === 1 ? "test" : "tests"}`;

/*
 * Lighthouse's part states the score lighthouserc.cjs enforces. axe has no threshold to share:
 * the suite's toHaveNoViolations matcher passes only when a scan finds none, so zero is the
 * budget by construction.
 */
const budget = (minimumCategoryScore: number): string =>
  breakOnlyBetween(
    `lighthouse ≥ ${Math.round(minimumCategoryScore * 100)} · axe 0 violations`,
  );

const isShown = (row: CandidateRow): row is InstrumentRow =>
  row.value !== null && row.value.trim() !== "";

/**
 * The rows the instrument shows, in order. A fact the build could not read has no row, so the
 * page never shows a blank or a placeholder where a fact should be.
 */
export function instrumentRows(
  facts: InstrumentFacts,
  minimumCategoryScore: number,
): InstrumentRow[] {
  const rows: readonly CandidateRow[] = [
    { term: "COMMIT", value: facts.commit },
    { term: "BUILT", value: facts.built, datetime: facts.built },
    { term: "TESTS", value: testCount(facts.tests) },
    { term: "BUDGET", value: budget(minimumCategoryScore) },
  ];
  return rows.filter(isShown);
}
