/** This site's own repository: the certificate links its source and the commit it was built from. */
export const sourceRepository = "https://github.com/alcarcis/alcarcis.com";

const shortShaLength = 7;

/** The commit a build was made from, as the certificate's first row shows it. */
export interface CommitFact {
  /** The hash as the row shows it: its first seven characters. */
  readonly shortSha: string;
  /**
   * The commit's page on GitHub, which shows its pull request with the gate that let it merge.
   * Not its checks: a squash merge makes a new commit whose own run may still be going.
   */
  readonly href: string;
}

/**
 * The commit row's facts, or null when the build could not read a commit: the row is then left
 * out rather than showing a blank or a guess.
 */
export function commitFact(commit: string | null): CommitFact | null {
  const sha = commit?.trim().toLowerCase();
  if (!sha) return null;
  return {
    shortSha: sha.slice(0, shortShaLength),
    href: `${sourceRepository}/commit/${sha}`,
  };
}

/** A phrase in the singular and in the plural, each with a {count} to fill in. */
export interface CountedPhrases {
  readonly one: string;
  readonly other: string;
}

/** Fills a count into the phrase for its number: "1 Playwright test", "325 Playwright tests". */
export const countedPhrase = (phrases: CountedPhrases, count: number): string =>
  (count === 1 ? phrases.one : phrases.other).replace("{count}", String(count));
