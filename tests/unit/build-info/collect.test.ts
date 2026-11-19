import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { collectBuildInfo } from "../../../scripts/build-info/collect.ts";
import { failing, headSha, listReport, sources } from "./support.ts";

describe("collectBuildInfo", () => {
  it("reads the commit, the build date and the test count", () => {
    const info = collectBuildInfo(
      sources({ listTests: () => listReport([{ specs: [1, 1, 1] }]) }),
    );

    assert.deepEqual(info, {
      commit: headSha.slice(0, 7),
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
      "TESTS omitted: could not list the Playwright tests (spawn ENOENT).",
    ]);
  });

  it("leaves the test count unknown when the list is not readable", () => {
    const info = collectBuildInfo(sources({ listTests: () => "not json" }));

    assert.equal(info.tests, null);
    assert.deepEqual(info.problems, [
      "TESTS omitted: the Playwright test list could not be read.",
    ]);
  });

  it("leaves the commit unknown and says why", () => {
    const info = collectBuildInfo(
      sources({ gitHead: failing("not a git repository") }),
    );

    assert.equal(info.commit, null);
    assert.deepEqual(info.problems, [
      "COMMIT omitted: no CF_PAGES_COMMIT_SHA, GITHUB_SHA or git commit.",
    ]);
  });
});
