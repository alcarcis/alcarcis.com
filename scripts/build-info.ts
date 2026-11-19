import { createRequire } from "node:module";
import { join } from "node:path";
import { collectBuildInfo, type BuildInfo } from "./build-info/collect.ts";
import {
  commandRunner,
  gitHeadCommand,
  testListCommand,
} from "./build-info/run.ts";

export type { BuildInfo } from "./build-info/collect.ts";

/*
 * Reads this build's facts from the real environment: the CI variables, git, and the
 * Playwright suite's own list. Each process runs under a time limit, so a stalled one costs a
 * row and a warning instead of a stuck build.
 */
export function readBuildInfo(root: string): BuildInfo {
  const run = commandRunner(root);
  const playwrightCli = (): string =>
    createRequire(join(root, "package.json")).resolve("@playwright/test/cli");

  const info = collectBuildInfo({
    env: process.env,
    gitHead: () => run(gitHeadCommand),
    listTests: () => run(testListCommand(playwrightCli())),
    now: () => new Date(),
  });
  for (const problem of info.problems) console.warn(`[build-info] ${problem}`);
  return info;
}
