import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { HttpStatusError } from "../../../scripts/fonts/download.ts";
import {
  aFamily,
  archiveOf,
  buildZip,
  damageFirstEntry,
  downloadsFrom,
  ensureFontsIn,
  expectFontFetchError,
  filesUnder,
  placeFile,
  readText,
  sha256,
  temporaryRoot,
  testfaceItalic,
  testfaceVariable,
} from "./support.ts";

const manifestPath = "scripts/fonts/manifest.ts";

describe("ensureFonts", () => {
  it("skips the download when every font is present with its pinned hash", async (t) => {
    const root = await temporaryRoot(t);
    const family = aFamily();
    await placeFile(root, testfaceVariable.target, testfaceVariable.content);
    const stub = downloadsFrom({});

    await ensureFontsIn(root, [family.pin], stub.download);

    assert.deepEqual(stub.requestedUrls, []);
  });

  it("downloads a missing font and writes the pinned bytes", async (t) => {
    const root = await temporaryRoot(t);
    const family = aFamily();
    const stub = downloadsFrom({ [family.pin.url]: family.archive });

    await ensureFontsIn(root, [family.pin], stub.download);

    assert.deepEqual(stub.requestedUrls, [family.pin.url]);
    assert.equal(
      await readText(root, testfaceVariable.target),
      testfaceVariable.content,
    );
  });

  it("replaces a present font whose hash differs from the pin", async (t) => {
    const root = await temporaryRoot(t);
    const family = aFamily();
    await placeFile(root, testfaceVariable.target, "stale bytes");
    const stub = downloadsFrom({ [family.pin.url]: family.archive });

    await ensureFontsIn(root, [family.pin], stub.download);

    assert.equal(
      await readText(root, testfaceVariable.target),
      testfaceVariable.content,
    );
  });

  it("refuses an entry whose hash differs, naming the family, URL, expected and actual hash", async (t) => {
    const root = await temporaryRoot(t);
    const family = aFamily();
    const repackaged = archiveOf([testfaceVariable], {
      [testfaceVariable.archiveEntry]: "a newer release",
    });
    const stub = downloadsFrom({ [family.pin.url]: repackaged });

    await expectFontFetchError(
      ensureFontsIn(root, [family.pin], stub.download),
      [
        "Testface",
        family.pin.url,
        testfaceVariable.archiveEntry,
        `Expected: ${sha256(testfaceVariable.content)}`,
        `Actual:   ${sha256("a newer release")}`,
        family.pin.page,
        manifestPath,
      ],
    );
    assert.deepEqual(await filesUnder(root), []);
  });

  it("explains a failed download with the family, URL and reason", async (t) => {
    const root = await temporaryRoot(t);
    const family = aFamily();
    const stub = downloadsFrom({
      [family.pin.url]: new HttpStatusError(503, "Service Unavailable"),
    });

    await expectFontFetchError(
      ensureFontsIn(root, [family.pin], stub.download),
      [
        "Testface",
        family.pin.url,
        "HTTP 503 Service Unavailable",
        "temporary",
        "pnpm fonts",
      ],
    );
    assert.deepEqual(await filesUnder(root), []);
  });

  it("sends a download the server no longer has to the family page and the manifest URL", async (t) => {
    const root = await temporaryRoot(t);
    const family = aFamily();
    const stub = downloadsFrom({
      [family.pin.url]: new HttpStatusError(404, "Not Found"),
    });

    await expectFontFetchError(
      ensureFontsIn(root, [family.pin], stub.download),
      [
        "HTTP 404 Not Found",
        "no longer serves",
        family.pin.page,
        `update \`url\` for Testface in ${manifestPath}`,
      ],
    );
  });

  it("lists the WOFF2 entries the archive does have when the pinned entry is missing", async (t) => {
    const root = await temporaryRoot(t);
    const family = aFamily();
    const stub = downloadsFrom({ [family.pin.url]: archiveOf([]) });

    await expectFontFetchError(
      ensureFontsIn(root, [family.pin], stub.download),
      [
        testfaceVariable.archiveEntry,
        "Testface_Complete/Fonts/WEB/fonts/Testface-Bold.woff2",
        "archiveEntry",
        manifestPath,
      ],
    );
    assert.deepEqual(await filesUnder(root), []);
  });

  it("reports a download that is not a ZIP archive", async (t) => {
    const root = await temporaryRoot(t);
    const family = aFamily();
    const errorPage = new TextEncoder().encode(
      "<!DOCTYPE html><title>Moved</title>",
    );
    const stub = downloadsFrom({ [family.pin.url]: errorPage });

    await expectFontFetchError(
      ensureFontsIn(root, [family.pin], stub.download),
      ["not a ZIP archive", "<!DOCTYPE html>", family.pin.url],
    );
    assert.deepEqual(await filesUnder(root), []);
  });

  it("reports a damaged archive with the family, URL and reason", async (t) => {
    const root = await temporaryRoot(t);
    const family = aFamily();
    const damaged = damageFirstEntry(
      buildZip({ [testfaceVariable.archiveEntry]: testfaceVariable.content }),
    );
    const stub = downloadsFrom({ [family.pin.url]: damaged });

    await expectFontFetchError(
      ensureFontsIn(root, [family.pin], stub.download),
      [
        "Testface",
        "archive is damaged",
        family.pin.url,
        testfaceVariable.archiveEntry,
      ],
    );
    assert.deepEqual(await filesUnder(root), []);
  });

  it("writes no file of a family until every pinned file in it verifies", async (t) => {
    const root = await temporaryRoot(t);
    const family = aFamily([testfaceVariable, testfaceItalic]);
    const halfRepackaged = archiveOf([testfaceVariable, testfaceItalic], {
      [testfaceItalic.archiveEntry]: "a newer italic",
    });
    const stub = downloadsFrom({ [family.pin.url]: halfRepackaged });

    await expectFontFetchError(
      ensureFontsIn(root, [family.pin], stub.download),
      [testfaceItalic.archiveEntry],
    );
    assert.deepEqual(await filesUnder(root), []);
  });

  it("explains a failed write and names the target", async (t) => {
    const root = await temporaryRoot(t);
    const family = aFamily();
    const stub = downloadsFrom({ [family.pin.url]: family.archive });
    const readOnlyStore = {
      read: async () => undefined,
      writeAtomically: async () => {
        throw new Error("EACCES: permission denied");
      },
    };

    await expectFontFetchError(
      ensureFontsIn(root, [family.pin], stub.download, readOnlyStore),
      [testfaceVariable.target, "EACCES: permission denied", "pnpm fonts"],
    );
  });
});
