import type { BuildInfoSources } from "../../../scripts/build-info/collect.ts";

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
