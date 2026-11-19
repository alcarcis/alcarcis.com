import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  personJsonLd,
  serializeJsonLd,
} from "../../../src/lib/structured-data.ts";

const facts = {
  name: "Ada Example",
  jobTitle: "Engineer",
  url: "https://example.test/",
  sameAs: ["https://github.com/ada"],
  knowsAbout: ["Testing"],
};

describe("personJsonLd", () => {
  it("describes the owner as a schema.org Person identified by the site URL", () => {
    assert.deepEqual(
      personJsonLd({ ...facts, image: "https://example.test/ada.jpg" }),
      {
        "@context": "https://schema.org",
        "@type": "Person",
        "@id": "https://example.test/#person",
        name: "Ada Example",
        jobTitle: "Engineer",
        url: "https://example.test/",
        image: "https://example.test/ada.jpg",
        sameAs: ["https://github.com/ada"],
        knowsAbout: ["Testing"],
      },
    );
  });

  it("leaves the image out when there is none", () => {
    assert.equal("image" in personJsonLd(facts), false);
  });
});

describe("serializeJsonLd", () => {
  const hostile = {
    name: "</script><script>alert(1)</script>",
    note: "a & b > c <!-- d",
    separators: "line\u2028paragraph\u2029end",
  };

  it("never lets a value close the script element or open a comment", () => {
    const serialized = serializeJsonLd(hostile);

    assert.doesNotMatch(serialized, /[<>&\u2028\u2029]/);
  });

  it("still parses back to the same data", () => {
    assert.deepEqual(JSON.parse(serializeJsonLd(hostile)), hostile);
  });
});
