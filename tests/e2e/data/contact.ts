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

/**
 * The page of the commit a build was made from, as the certificate links it: the commit itself,
 * not its checks, so a squash merge's still-running push run never contradicts the seal. It
 * names the whole hash; the row shows only its first seven characters.
 */
export const commitUrl = (sha: string): string =>
  `${sourceRepository.url}/commit/${sha}`;

/** The section anchors: one English set on every page, so links between pages keep their target. */
export const anchors = { contact: "contact", report: "report" } as const;

/** The certificate's decorative layers: drawn for the eye, every one kept from assistive technology. */
export const certificateDecor = [
  "frame",
  "seal",
  "watermark",
  "corners",
] as const;

/**
 * Widths to lay Contact's address line out at, and whether the address and its two actions fit
 * on one line there; where they do not, the actions centre on a line of their own below.
 */
export const addressLines = [
  { width: 320, oneLine: false },
  { width: 390, oneLine: false },
  { width: 860, oneLine: true },
  { width: 1440, oneLine: true },
] as const;

/**
 * Widths to lay the certificate out at: the narrowest phone, either side of 860 px (where a
 * seal set over the card once covered its heading), where the site's layout widens, and a
 * wide screen.
 */
export const certificateWidths = [320, 390, 850, 870, 960, 1024, 1440] as const;

/**
 * Below this certificate width the rows stack, each term above its value; from it up they sit
 * side by side. It is 22rem inside the frame band and border, 10px on either side.
 */
export const rowsStackBelowPx = 22 * 16 + 20;

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
