import { minimumCategoryScore } from "../../../scripts/quality-budget";

/** The address Contact shows as its link and copies; the same on every page. */
export const emailAddress = "hola@alcarcis.com";

/** This site's own repository, which the report links as its source. */
export const sourceRepository = {
  url: "https://github.com/alcarcis/alcarcis.com",
  linkText: "github.com/alcarcis/alcarcis.com",
} as const;

/**
 * The Lighthouse score every category must reach, as the report states it: read from the module
 * lighthouserc.cjs asserts, so the page and the pipeline cannot disagree.
 */
export const lighthouseMinimum = Math.round(minimumCategoryScore * 100);

/** The section anchors: one English set on every page, so links between pages keep their target. */
export const anchors = { contact: "contact", report: "report" } as const;

/** What the copy button reports: the address copied, or selected for the visitor to copy. */
export type CopyOutcome = "copied" | "selected";

/**
 * How long the copy button's report stays, counted from the click: still there at the first
 * mark, so it can be read, and gone by the second, when the button shows its label again. A
 * failure says more, so it stays longer.
 */
export const reportShown: Readonly<
  Record<CopyOutcome, { readonly stillAtMs: number; readonly goneByMs: number }>
> = {
  copied: { stillAtMs: 1_000, goneByMs: 2_500 },
  selected: { stillAtMs: 4_000, goneByMs: 6_000 },
};
