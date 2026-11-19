import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  languageAlternates,
  robotsTxt,
  sitemapXml,
} from "../../../src/lib/seo.ts";

const urlFor = (locale: "en" | "es"): string =>
  locale === "en" ? "https://example.test/" : "https://example.test/es/";

describe("languageAlternates", () => {
  it("lists every language version, then x-default for the default language", () => {
    assert.deepEqual(languageAlternates(["en", "es"], "en", urlFor), [
      { hreflang: "en", href: "https://example.test/" },
      { hreflang: "es", href: "https://example.test/es/" },
      { hreflang: "x-default", href: "https://example.test/" },
    ]);
  });
});

describe("sitemapXml", () => {
  const alternates = languageAlternates(["en", "es"], "en", urlFor);
  const xml = sitemapXml([
    { url: "https://example.test/", alternates },
    { url: "https://example.test/es/", alternates },
  ]);

  it("declares the sitemap and xhtml namespaces on the urlset", () => {
    assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>\n/);
    assert.match(
      xml,
      /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9" xmlns:xhtml="http:\/\/www\.w3\.org\/1999\/xhtml">/,
    );
  });

  it("gives every page a loc and one alternate link per language version", () => {
    const urls = xml.match(/<url>[\s\S]*?<\/url>/g) ?? [];

    assert.equal(urls.length, 2);
    assert.match(urls[1] ?? "", /<loc>https:\/\/example\.test\/es\/<\/loc>/);
    for (const url of urls) {
      assert.equal(url.match(/<xhtml:link /g)?.length, alternates.length);
      assert.match(
        url,
        /<xhtml:link rel="alternate" hreflang="x-default" href="https:\/\/example\.test\/"\/>/,
      );
    }
  });

  it("escapes characters that would break the XML", () => {
    const escaped = sitemapXml([
      {
        url: "https://example.test/?a=1&b=<2>",
        alternates: [{ hreflang: "en", href: 'https://example.test/"q"' }],
      },
    ]);

    assert.match(
      escaped,
      /<loc>https:\/\/example\.test\/\?a=1&amp;b=&lt;2&gt;<\/loc>/,
    );
    assert.match(escaped, /href="https:\/\/example\.test\/&quot;q&quot;"/);
  });
});

describe("robotsTxt", () => {
  it("allows every crawler and names the sitemap", () => {
    assert.equal(
      robotsTxt("https://example.test/sitemap.xml"),
      "User-agent: *\nAllow: /\n\nSitemap: https://example.test/sitemap.xml\n",
    );
  });
});
