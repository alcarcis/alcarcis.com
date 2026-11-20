import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  breakOnlyBetween,
  keepTermsTogether,
} from "../../../src/lib/typography.ts";
import { nbsp } from "./support.ts";

describe("breakOnlyBetween", () => {
  it("keeps each part on one line and lets lines break only at the separators", () => {
    assert.equal(
      breakOnlyBetween("Quality Engineering · Agentic QA · Web, API & mobile"),
      `Quality${nbsp}Engineering · Agentic${nbsp}QA · Web,${nbsp}API${nbsp}&${nbsp}mobile`,
    );
  });

  it("leaves text without separators as one unbreakable part", () => {
    assert.equal(
      breakOnlyBetween("axe 0 violations"),
      `axe${nbsp}0${nbsp}violations`,
    );
  });
});

describe("keepTermsTogether", () => {
  it("binds the words of a pull request, so a line never breaks inside the term", () => {
    assert.equal(
      keepTermsTogether("This site is tested on every pull request"),
      `This site is tested on every pull${nbsp}request`,
    );
  });

  it("binds every occurrence and leaves the other spaces breakable", () => {
    assert.equal(
      keepTermsTogether("pull request checks · preview per pull request"),
      `pull${nbsp}request checks · preview per pull${nbsp}request`,
    );
  });

  it("leaves text without the term unchanged", () => {
    assert.equal(keepTermsTogether("axe 0 violations"), "axe 0 violations");
  });
});
