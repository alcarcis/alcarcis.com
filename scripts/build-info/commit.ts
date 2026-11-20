export type Environment = Readonly<Record<string, string | undefined>>;

const fullOrShortSha = /^[0-9a-f]{7,40}$/i;

const sha = (value: string | undefined): string | null => {
  const trimmed = value?.trim();
  return trimmed && fullOrShortSha.test(trimmed) ? trimmed.toLowerCase() : null;
};

/**
 * The SHA of the commit being built, whole and in lowercase, as its source names it (a short
 * one is kept as it is): Cloudflare Pages names it, then GitHub Actions, then the checked-out
 * repository, which is asked only when neither variable names a commit. The certificate links
 * the whole hash and shows its first seven characters. Null when none of them names one; throws
 * what git throws when it cannot be read.
 */
export function resolveCommit(
  env: Environment,
  gitHead: () => string,
): string | null {
  return (
    sha(env["CF_PAGES_COMMIT_SHA"]) ?? sha(env["GITHUB_SHA"]) ?? sha(gitHead())
  );
}
