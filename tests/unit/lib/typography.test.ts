import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { breakOnlyBetween } from "../../../src/lib/typography.ts";
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
