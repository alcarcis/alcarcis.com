/*
 * The quality budget the pipeline enforces, in one place: lighthouserc.cjs asserts it on every
 * page it audits and the certificate's budget row states it, so the two cannot drift apart.
 */

/** The lowest Lighthouse score (0 to 1, median of runs) any budgeted category may reach. */
export const minimumCategoryScore = 0.95;
