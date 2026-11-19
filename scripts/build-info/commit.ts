export type Environment = Readonly<Record<string, string | undefined>>;

const fullOrShortSha = /^[0-9a-f]{7,40}$/i;
const shortShaLength = 7;

const shortSha = (value: string | undefined): string | null => {
  const sha = value?.trim();
  return sha && fullOrShortSha.test(sha)
    ? sha.slice(0, shortShaLength).toLowerCase()
    : null;
};

/**
 * The short SHA of the commit being built: Cloudflare Pages names it, then GitHub Actions, then
 * the checked-out repository, which is asked only when neither variable names a commit. Null
 * when none of them names one; throws what git throws when it cannot be read.
 */
export function resolveCommit(
  env: Environment,
  gitHead: () => string,
): string | null {
  return (
    shortSha(env["CF_PAGES_COMMIT_SHA"]) ??
    shortSha(env["GITHUB_SHA"]) ??
    shortSha(gitHead())
  );
}
