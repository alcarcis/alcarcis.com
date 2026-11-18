import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NotAZipArchiveError, openZip } from "../../../scripts/fonts/zip.ts";
import { buildZip, damageFirstEntry } from "./support.ts";

const entries = {
  "Family/Fonts/WEB/fonts/Family-Variable.woff2": "variable font bytes",
  "Family/License/FFL.txt": "licence text",
};

const decode = (bytes: Uint8Array | undefined): string | undefined =>
  bytes === undefined ? undefined : new TextDecoder().decode(bytes);

describe("openZip", () => {
  for (const method of ["deflate", "store"] as const) {
    it(`reads ${method === "deflate" ? "deflated" : "stored"} entries by name`, () => {
      const zip = openZip(buildZip(entries, method));

      assert.equal(
        decode(zip.read("Family/Fonts/WEB/fonts/Family-Variable.woff2")),
        "variable font bytes",
      );
      assert.equal(decode(zip.read("Family/License/FFL.txt")), "licence text");
    });
  }

  it("lists every entry name and reads an unknown name as undefined", () => {
    const zip = openZip(buildZip(entries));

    assert.deepEqual(zip.entryNames, Object.keys(entries));
    assert.equal(zip.read("Family/missing.woff2"), undefined);
  });

  it("rejects reading an entry whose compressed bytes are damaged", () => {
    const zip = openZip(damageFirstEntry(buildZip(entries)));

    assert.throws(
      () => zip.read("Family/Fonts/WEB/fonts/Family-Variable.woff2"),
      NotAZipArchiveError,
    );
  });

  it("rejects bytes that are not a ZIP archive", () => {
    const html = new TextEncoder().encode(
      "<!DOCTYPE html><title>Moved</title>",
    );

    assert.throws(() => openZip(html), NotAZipArchiveError);
  });
});
