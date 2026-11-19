export type Environment = Readonly<Record<string, string | undefined>>;

const fullOrShortSha = /^[0-9a-f]{7,40}$/i;
const shortShaLength = 7;

/**
 * The short SHA of the commit being built: Cloudflare Pages names it, then GitHub Actions, then
 * the checked-out repository. Null when none of them names a commit.
 */
export function resolveCommit(
  env: Environment,
  gitHead: () => string,
): string | null {
  const sources = [
    () => env["CF_PAGES_COMMIT_SHA"],
    () => env["GITHUB_SHA"],
    gitHead,
  ];
  for (const read of sources) {
    const sha = readSafely(read)?.trim();
    if (sha && fullOrShortSha.test(sha)) {
      return sha.slice(0, shortShaLength).toLowerCase();
    }
  }
  return null;
}

function readSafely(read: () => string | undefined): string | undefined {
  try {
    return read();
  } catch {
    return undefined;
  }
}
