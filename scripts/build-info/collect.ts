import { resolveCommit, type Environment } from "./commit.ts";
import { countListedTests } from "./test-count.ts";

export interface BuildInfoSources {
  readonly env: Environment;
  /** The full SHA of the checked-out commit; throws when git fails or outlives its limit. */
  readonly gitHead: () => string;
  /** The JSON report of `playwright test --list`; throws when it fails or outlives its limit. */
  readonly listTests: () => string;
  readonly now: () => Date;
}

/**
 * Facts about this build, true by construction. A fact that cannot be read is null, and the
 * certificate leaves its row out instead of showing a guess; `problems` says why.
 */
export interface BuildInfo {
  readonly commit: string | null;
  readonly built: string;
  readonly tests: number | null;
  readonly problems: readonly string[];
}

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

function countTests(
  listTests: () => string,
  problems: string[],
): number | null {
  let report: string;
  try {
    report = listTests();
  } catch (error) {
    problems.push(
      `TESTS omitted: could not list the Playwright tests (${errorMessage(error)}).`,
    );
    return null;
  }
  const count = countListedTests(report);
  if (count === null) {
    problems.push("TESTS omitted: the Playwright test list could not be read.");
  }
  return count;
}

function readCommit(
  sources: BuildInfoSources,
  problems: string[],
): string | null {
  let commit: string | null;
  try {
    commit = resolveCommit(sources.env, sources.gitHead);
  } catch (error) {
    problems.push(
      `COMMIT omitted: no CF_PAGES_COMMIT_SHA or GITHUB_SHA, and git could not read the commit (${errorMessage(error)}).`,
    );
    return null;
  }
  if (commit === null) {
    problems.push(
      "COMMIT omitted: no CF_PAGES_COMMIT_SHA, GITHUB_SHA or git commit.",
    );
  }
  return commit;
}

export function collectBuildInfo(sources: BuildInfoSources): BuildInfo {
  const problems: string[] = [];
  const commit = readCommit(sources, problems);
  const tests = countTests(sources.listTests, problems);
  const built = sources.now().toISOString().slice(0, 10);
  return { commit, built, tests, problems };
}
