import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import { logoPaths, logoViewBox } from "../../src/lib/logo.ts";

const favicon = await readFile(
  new URL("../../public/favicon.svg", import.meta.url),
  "utf8",
);

const attributeValues = (svg: string, name: string): string[] =>
  [...svg.matchAll(new RegExp(`\\s${name}="([^"]*)"`, "g"))].map(
    ([, value]) => value ?? "",
  );

describe("public/favicon.svg", () => {
  it("draws the header's mark: both slashes, then the cursor, with the same paths", () => {
    assert.deepEqual(attributeValues(favicon, "d"), [
      ...logoPaths.slashes,
      logoPaths.cursor,
    ]);
  });

  it("frames the mark with the header's view box inside its graphite tile", () => {
    assert.deepEqual(attributeValues(favicon, "viewBox"), [
      "0 0 32 32",
      logoViewBox,
    ]);
  });

  it("rounds the stroke ends, as the header's mark does", () => {
    assert.deepEqual(attributeValues(favicon, "stroke-linecap"), ["round"]);
  });
});
