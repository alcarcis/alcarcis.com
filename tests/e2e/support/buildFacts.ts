import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { join } from "node:path";

/*
 * Facts about the code under test, read independently of the site's build so the instrument's
 * data rows can be checked against them. Playwright runs from the repository root.
 */

const root = process.cwd();
const run = (file: string, args: readonly string[]): string =>
  execFileSync(file, args, { cwd: root, encoding: "utf8" }).trim();

export const headCommit = (): string => run("git", ["rev-parse", "HEAD"]);

/** The UTC calendar day of the HEAD commit, as YYYY-MM-DD. */
export const headCommitDay = (): string =>
  new Date(run("git", ["log", "-1", "--format=%cI"]))
    .toISOString()
    .slice(0, 10);

export const todayUtc = (): string => new Date().toISOString().slice(0, 10);

/** How many tests the whole suite lists, read from the list reporter's summary line. */
export function listedTestCount(): number {
  const cli = createRequire(join(root, "package.json")).resolve(
    "@playwright/test/cli",
  );
  const summary = /Total: (\d+) tests? in \d+ files?/.exec(
    run(process.execPath, [cli, "test", "--list", "--reporter=list"]),
  );
  if (!summary?.[1]) throw new Error("The Playwright list had no summary.");
  return Number(summary[1]);
}
