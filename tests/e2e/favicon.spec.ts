import { localeCases } from "./data/locales";
import { expect, test } from "./fixtures";

const svgContentType = /^image\/svg\+xml(;|$)/;

for (const locale of localeCases) {
  test(`${locale.language.name} page at ${locale.language.path} declares an SVG icon that loads`, async ({
    homePage,
    request,
  }) => {
    await homePage.open(locale.language.path);
    await expect(homePage.seo.icon).toHaveCount(1);

    const response = await request.get(await homePage.seo.iconUrl());

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toMatch(svgContentType);
  });
}
