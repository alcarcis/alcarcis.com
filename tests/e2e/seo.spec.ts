import { Sitemap } from "./components/SeoMeta";
import { expectedRobots, expectedSitemap } from "./data/seo";
import { expect, test } from "./fixtures";

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
