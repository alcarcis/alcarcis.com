import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { countListedTests } from "../../../scripts/build-info/test-count.ts";
import { listReport } from "./support.ts";

describe("countListedTests", () => {
  it("counts every listed test across files and nested suites", () => {
    const report = listReport([
      { specs: [1, 1], suites: [{ specs: [1, 1, 1] }] },
      { specs: [1] },
    ]);

    assert.equal(countListedTests(report), 6);
  });

  it("counts a spec once for each project it runs in", () => {
    assert.equal(countListedTests(listReport([{ specs: [2, 2] }])), 4);
  });

  it("is unknown when a test file failed to load", () => {
    const report = listReport([{ specs: [1] }], [{ message: "SyntaxError" }]);

    assert.equal(countListedTests(report), null);
  });

  it("is unknown when the output is not a test list", () => {
    assert.equal(countListedTests("Error: no tests found"), null);
    assert.equal(countListedTests(JSON.stringify({ suites: "none" })), null);
    assert.equal(
      countListedTests(JSON.stringify({ suites: [{ specs: [{}] }] })),
      null,
    );
  });
});
