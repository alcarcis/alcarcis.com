import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  currentLink,
  type ObservedPart,
} from "../../../src/scripts/sections-nav/current.ts";

/** The page in order: the hero, five linked sections, then the footer, which belongs to the last. */
const pageParts = (crossing: readonly number[]): ObservedPart[] =>
  [null, 0, 1, 2, 3, 4, 4].map((link, position) => ({
    link,
    crossing: crossing.includes(position),
  }));

describe("currentLink", () => {
  it("marks no link while nothing crosses the reading line", () => {
    assert.equal(currentLink(pageParts([])), null);
  });

  it("marks no link while the hero crosses it", () => {
    assert.equal(currentLink(pageParts([0])), null);
  });

  it("marks the link of the section that crosses it", () => {
    assert.equal(currentLink(pageParts([1])), 0);
    assert.equal(currentLink(pageParts([3])), 2);
  });

  it("marks the section coming into view where two meet on the line", () => {
    assert.equal(currentLink(pageParts([0, 1])), 0);
    assert.equal(currentLink(pageParts([2, 3])), 2);
  });

  it("marks the last section while the footer crosses it", () => {
    assert.equal(currentLink(pageParts([6])), 4);
    assert.equal(currentLink(pageParts([5, 6])), 4);
  });
});
