import assert from "node:assert/strict";
import { createRequire, registerHooks } from "node:module";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  commandRunner,
  testListCommand,
} from "../../../scripts/build-info/run.ts";

/*
 * The e2e data modules import each other without file extensions, which Playwright's loader
 * accepts and Node's does not; this retries a missing relative import with `.ts`.
 */
registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      const extensionless =
        specifier.startsWith(".") && !/\.[cm]?[jt]s$/.test(specifier);
      if (
        extensionless &&
        error instanceof Error &&
        "code" in error &&
        error.code === "ERR_MODULE_NOT_FOUND"
      ) {
        return nextResolve(`${specifier}.ts`, context);
      }
      throw error;
    }
  },
});

const { expectedExternalUrls, isLiveCheckable } =
  await import("../../e2e/data/externalLinks.ts");
const { localeCases } = await import("../../e2e/data/locales.ts");

const root = join(import.meta.dirname, "../../..");
const playwrightCli = createRequire(join(root, "package.json")).resolve(
  "@playwright/test/cli",
);
const run = commandRunner(root);

interface Suite {
  readonly specs?: readonly {
    readonly title: string;
    readonly tests: readonly unknown[];
  }[];
  readonly suites?: readonly Suite[];
}

/** One title per listed test (a spec runs once per project), across nested suites. */
const testTitles = (suites: readonly Suite[]): string[] =>
  suites.flatMap((suite) => [
    ...(suite.specs ?? []).flatMap((spec) => spec.tests.map(() => spec.title)),
    ...testTitles(suite.suites ?? []),
  ]);

/** Lists the tests a Playwright config would run, without starting a browser or a server. */
const listedTitles = (configArgs: readonly string[] = []): string[] => {
  const command = testListCommand(playwrightCli);
  const report = JSON.parse(
    run({ ...command, args: [...command.args, ...configArgs] }),
  ) as { readonly suites: readonly Suite[] };
  return testTitles(report.suites);
};

// liveCheck must match the title in tests/live/external-links.spec.ts, and the hermetic title below
// the one in tests/e2e/external-links.spec.ts; a rename there fails here with a diff that names it.
const liveCheck = " answers with HTTP 200";

describe("live link checks", () => {
  it("stay out of the quality gate, which keeps the hermetic external-link tests", () => {
    const titles = listedTitles();

    assert.deepEqual(
      titles.filter((title) => title.endsWith(liveCheck)),
      [],
    );
    assert.equal(
      titles.filter((title) =>
        title.endsWith("links only to the expected external URLs"),
      ).length,
      localeCases.length,
    );
  });

  it("run in the live suite, once for each GitHub link the pages carry", () => {
    assert.deepEqual(
      listedTitles(["-c", "playwright.live.config.ts"]).sort(),
      expectedExternalUrls
        .filter(isLiveCheckable)
        .map((url) => `${url}${liveCheck}`)
        .sort(),
    );
  });
});
