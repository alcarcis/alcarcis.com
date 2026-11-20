import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { collectBuildInfo } from "../../../scripts/build-info/collect.ts";
import {
  gitHeadCommand,
  testListCommand,
} from "../../../scripts/build-info/run.ts";
import {
  failing,
  headSha,
  listReport,
  sources,
  stallingRunner,
} from "./support.ts";

describe("collectBuildInfo", () => {
  it("reads the commit, the build date and the test count", () => {
    const info = collectBuildInfo(
      sources({ listTests: () => listReport([{ specs: [1, 1, 1] }]) }),
    );

    assert.deepEqual(info, {
      commit: headSha,
      built: "2026-11-18",
      tests: 3,
      problems: [],
    });
  });

  it("dates the build in UTC", () => {
    const info = collectBuildInfo(
      sources({ now: () => new Date("2026-11-19T00:30:00-05:00") }),
    );

    assert.equal(info.built, "2026-11-19");
  });

  it("leaves the test count unknown and says why when listing fails", () => {
    const info = collectBuildInfo(
      sources({ listTests: failing("spawn ENOENT") }),
    );

    assert.equal(info.tests, null);
    assert.deepEqual(info.problems, [
      "E2E row without a test count: could not list the Playwright tests (spawn ENOENT).",
    ]);
  });

  it("leaves the test count unknown and names the limit when listing stalls", () => {
    const info = collectBuildInfo(
      sources({
        listTests: () => stallingRunner(testListCommand("playwright/cli.js")),
      }),
    );

    assert.equal(info.tests, null);
    assert.equal(info.problems.length, 1);
    assert.match(
      info.problems.join("\n"),
      /^E2E row without a test count: could not list the Playwright tests \(playwright test --list did not finish within 30 s and was stopped;/,
    );
  });

  it("leaves the test count unknown when the list is not readable", () => {
    const info = collectBuildInfo(sources({ listTests: () => "not json" }));

    assert.equal(info.tests, null);
    assert.deepEqual(info.problems, [
      "E2E row without a test count: the Playwright test list could not be read.",
    ]);
  });

  it("leaves the commit unknown and says why git could not read it", () => {
    const info = collectBuildInfo(
      sources({ gitHead: failing("not a git repository") }),
    );

    assert.equal(info.commit, null);
    assert.deepEqual(info.problems, [
      "Commit row omitted: no CF_PAGES_COMMIT_SHA or GITHUB_SHA, and git could not read the commit (not a git repository).",
    ]);
  });

  it("leaves the commit unknown and names the limit when git stalls", () => {
    const info = collectBuildInfo(
      sources({ gitHead: () => stallingRunner(gitHeadCommand) }),
    );

    assert.equal(info.commit, null);
    assert.equal(info.problems.length, 1);
    assert.match(
      info.problems.join("\n"),
      /^Commit row omitted: no CF_PAGES_COMMIT_SHA or GITHUB_SHA, and git could not read the commit \(git rev-parse HEAD did not finish within 10 s and was stopped;/,
    );
  });

  it("leaves the commit unknown when no source names one", () => {
    const info = collectBuildInfo(sources({ gitHead: () => "" }));

    assert.equal(info.commit, null);
    assert.deepEqual(info.problems, [
      "Commit row omitted: no CF_PAGES_COMMIT_SHA, GITHUB_SHA or git commit.",
    ]);
  });
});
