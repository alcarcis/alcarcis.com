import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { join } from "node:path";
import { collectBuildInfo, type BuildInfo } from "./build-info/collect.ts";

export type { BuildInfo } from "./build-info/collect.ts";

/*
 * Reads this build's facts from the real environment: the CI variables, git, and the
 * Playwright suite's own list. Listing needs only the @playwright/test package, not a browser,
 * so it works on Cloudflare Pages too.
 */
export function readBuildInfo(root: string): BuildInfo {
  const run = (file: string, args: readonly string[]): string =>
    execFileSync(file, args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 32 * 1024 * 1024,
    });
  const playwrightCli = (): string =>
    createRequire(join(root, "package.json")).resolve("@playwright/test/cli");

  const info = collectBuildInfo({
    env: process.env,
    gitHead: () => run("git", ["rev-parse", "HEAD"]),
    listTests: () =>
      run(process.execPath, [
        playwrightCli(),
        "test",
        "--list",
        "--reporter=json",
      ]),
    now: () => new Date(),
  });
  for (const problem of info.problems) console.warn(`[build-info] ${problem}`);
  return info;
}
