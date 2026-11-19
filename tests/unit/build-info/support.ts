import type { BuildInfoSources } from "../../../scripts/build-info/collect.ts";
import {
  CommandTimeoutError,
  type BuildCommand,
  type CommandRunner,
} from "../../../scripts/build-info/run.ts";

export const cloudflareSha = "cf0123456789abcdef0123456789abcdef012345";
export const gitHubSha = "9a8b7c6d5e4f30211203f4e5d6c7b8a9f0e1d2c3";
export const headSha = "0123abcdef4567890123abcdef4567890123abcd";

/** A file of the JSON report `playwright test --list --reporter=json` prints. */
export interface ListedFile {
  readonly specs: readonly number[];
  readonly suites?: readonly ListedFile[];
}

const listedSuite = ({ specs, suites = [] }: ListedFile): unknown => ({
  title: "suite",
  specs: specs.map((tests, index) => ({
    title: `spec ${index + 1}`,
    tests: Array.from({ length: tests }, () => ({ projectName: "chromium" })),
  })),
  suites: suites.map(listedSuite),
});

export const listReport = (
  files: readonly ListedFile[],
  errors: readonly unknown[] = [],
): string =>
  JSON.stringify({ config: {}, suites: files.map(listedSuite), errors });

export const failing = (message: string) => (): never => {
  throw new Error(message);
};

/** A Node one-liner as a build command, under a limit it finishes well inside. */
export const nodeCommand = (
  script: string,
  timeoutMs = 10_000,
): BuildCommand => ({
  name: `node -e "${script}"`,
  file: process.execPath,
  args: ["-e", script],
  timeoutMs,
});

/** A command that would run for 5 s under a 0.1 s limit: only the limit can end it that soon. */
export const stalledCommand: BuildCommand = {
  ...nodeCommand("setTimeout(() => {}, 5_000)", 100),
  name: "a stalled command",
};

/**
 * A runner whose every command stalls past its limit, ending it the way the real runner does,
 * without waiting out the real limits.
 */
export const stallingRunner: CommandRunner = (command) => {
  throw new CommandTimeoutError(command);
};

export function sources(
  overrides: Partial<BuildInfoSources> = {},
): BuildInfoSources {
  return {
    env: {},
    gitHead: () => `${headSha}\n`,
    listTests: () => listReport([{ specs: [1, 1] }]),
    now: () => new Date("2026-11-18T15:00:00Z"),
    ...overrides,
  };
}
