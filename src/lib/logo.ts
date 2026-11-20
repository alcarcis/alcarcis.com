// The `//_` mark (D61): two slashes and a cursor, drawn with round-capped strokes and no fill.
// The header draws it from these paths; public/favicon.svg repeats them as static markup, and a
// unit test keeps the two in step. No Astro imports, so Node's test runner loads this directly.

/** The box around the strokes, round caps included, with a little air on every side. */
export const logoViewBox = "2 2.5 32 27.5";

/** Stroke width in view box units at header size; the favicon thickens it to read at 16 px. */
export const logoStrokeWidth = 4;

export const logoPaths = {
  /** Two forward slashes, in copper. */
  slashes: ["M6 26L12.5 6", "M14.5 26L21 6"],
  /** The cursor after them, in pass green: the one part that blinks, in the header only. */
  cursor: "M25 25H30.5",
} as const;
