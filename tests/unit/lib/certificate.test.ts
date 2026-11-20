import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  commitFact,
  countedPhrase,
  sourceRepository,
} from "../../../src/lib/certificate.ts";

const fullSha = "ac8f69d0e1b2c3d4e5f60718293a4b5c6d7e8f90";

describe("commitFact", () => {
  it("shows a full hash by its first seven characters and links its commit page", () => {
    assert.deepEqual(commitFact(fullSha), {
      shortSha: "ac8f69d",
      href: `${sourceRepository}/commit/${fullSha}`,
    });
  });

  it("links a short hash as it is, which GitHub resolves", () => {
    assert.deepEqual(commitFact("ac8f69d"), {
      shortSha: "ac8f69d",
      href: `${sourceRepository}/commit/ac8f69d`,
    });
  });

  it("links the commit itself, never its checks", () => {
    assert.doesNotMatch(commitFact(fullSha)?.href ?? "", /checks/);
  });

  it("has no commit to show when the build could not read one", () => {
    assert.equal(commitFact(null), null);
    assert.equal(commitFact(""), null);
    assert.equal(commitFact("  "), null);
  });
});

describe("countedPhrase", () => {
  const phrases = {
    one: "{count} Playwright test · on every pull request",
    other: "{count} Playwright tests · on every pull request",
  };

  it("counts a single test in the singular", () => {
    assert.equal(
      countedPhrase(phrases, 1),
      "1 Playwright test · on every pull request",
    );
  });

  it("counts any other number in the plural", () => {
    assert.equal(
      countedPhrase(phrases, 325),
      "325 Playwright tests · on every pull request",
    );
    assert.equal(
      countedPhrase(phrases, 0),
      "0 Playwright tests · on every pull request",
    );
  });
});
