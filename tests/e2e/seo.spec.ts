import type { APIRequestContext } from "@playwright/test";
import { Sitemap, SeoMeta } from "./components/SeoMeta";
import {
  expectedRobots,
  expectedSitemap,
  seoCases,
  shareImageMaxBytes,
  shareImageSize,
  siteOrigin,
  touchIconSize,
} from "./data/seo";
import { expect, test } from "./fixtures";

const pngSignature = "89504e470d0a1a0a";

interface ServedImage {
  readonly contentType: string;
  readonly bytes: Buffer;
}

/** Fetches a production URL from the server under test: same path, local origin. */
async function fetchFromSite(
  request: APIRequestContext,
  url: string,
): Promise<ServedImage> {
  const parsed = new URL(url);
  expect(parsed.origin, `${url} points at the production origin`).toBe(
    siteOrigin,
  );
  const response = await request.get(parsed.pathname);
  expect(response.status(), `${parsed.pathname} is served`).toBe(200);
  return {
    contentType: response.headers()["content-type"] ?? "",
    bytes: await response.body(),
  };
}

/** A PNG's width and height, read from its IHDR chunk. */
function pngSize(bytes: Buffer): { width: number; height: number } {
  expect(bytes.subarray(0, 8).toString("hex"), "PNG signature").toBe(
    pngSignature,
  );
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

for (const seo of seoCases) {
  const { page: locale } = seo;

  test.describe(`${locale.language.name} page at ${locale.language.path}`, () => {
    test.beforeEach(async ({ homePage }) => {
      await homePage.open(locale.language.path);
    });

    test("describes itself to search engines in its language", async ({
      page,
    }) => {
      const meta = new SeoMeta(page);

      await expect(meta.description).toHaveCount(1);
      await expect(meta.description).toHaveAttribute(
        "content",
        seo.description,
      );
    });

    test("declares Open Graph tags and a large Twitter card for link previews", async ({
      page,
    }) => {
      const meta = new SeoMeta(page);

      await expect(meta.shareTags).toHaveCount(seo.shareTags.length);
      for (const tag of seo.shareTags) {
        await expect(meta.tag(tag), tag.key).toHaveAttribute(
          "content",
          tag.content,
        );
      }
    });

    test("serves its share image as a small 1200×630 PNG", async ({
      request,
    }) => {
      const image = await fetchFromSite(request, seo.shareImageUrl);

      expect(image.contentType).toMatch(/^image\/png(;|$)/);
      expect(pngSize(image.bytes)).toEqual(shareImageSize);
      expect(image.bytes.byteLength).toBeLessThan(shareImageMaxBytes);
    });

    test("declares a 180×180 PNG touch icon that loads", async ({
      homePage,
      request,
    }) => {
      await expect(homePage.seo.touchIcon).toHaveCount(1);
      const icon = await request.get(await homePage.seo.touchIconUrl());

      expect(icon.status()).toBe(200);
      expect(icon.headers()["content-type"]).toMatch(/^image\/png(;|$)/);
      expect(pngSize(await icon.body())).toEqual({
        width: touchIconSize,
        height: touchIconSize,
      });
    });
  });
}

test("the sitemap lists both pages with every language version as XML", async ({
  page,
}) => {
  const sitemap = new Sitemap(page);
  const response = await sitemap.fetch();

  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toMatch(
    /^(application|text)\/xml(;|$)/,
  );
  expect(await sitemap.entries(response)).toEqual(expectedSitemap);
});

test("robots.txt allows every crawler and points at the sitemap", async ({
  request,
}) => {
  const response = await request.get("/robots.txt");

  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toMatch(/^text\/plain(;|$)/);
  const directives = (await response.text())
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("#"))
    .map((line) => {
      const separator = line.indexOf(":");
      return [
        line.slice(0, separator).trim().toLowerCase(),
        line.slice(separator + 1).trim(),
      ];
    });

  expect(directives).toEqual(expectedRobots);
});
