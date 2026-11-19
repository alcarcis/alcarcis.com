import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cvDownloadFor } from "../../../src/lib/cv.ts";

const published =
  (...paths: string[]) =>
  (path: string): boolean =>
    paths.includes(path);

describe("cvDownloadFor", () => {
  it("links the page's own language PDF when it is published", () => {
    assert.deepEqual(
      cvDownloadFor("en", published("/cv/carlos-alcala-cv-en.pdf")),
      { href: "/cv/carlos-alcala-cv-en.pdf" },
    );
    assert.deepEqual(
      cvDownloadFor("es", published("/cv/carlos-alcala-cv-es.pdf")),
      { href: "/cv/carlos-alcala-cv-es.pdf" },
    );
  });

  it("offers nothing while the PDF is missing", () => {
    assert.equal(cvDownloadFor("en", published()), null);
  });

  it("never sends a page to the other language's PDF", () => {
    assert.equal(
      cvDownloadFor("es", published("/cv/carlos-alcala-cv-en.pdf")),
      null,
    );
  });
});
