import { expectedExternalUrls, isLiveCheckable } from "./data/externalLinks";
import { localeCases } from "./data/locales";
import { expect, test } from "./fixtures";

for (const locale of localeCases) {
  test(`${locale.language.name} page at ${locale.language.path} links only to the expected external URLs`, async ({
    homePage,
  }) => {
    await homePage.open(locale.language.path);

    expect(await homePage.externalLinkUrls()).toEqual(expectedExternalUrls);
  });
}

for (const url of expectedExternalUrls.filter(isLiveCheckable)) {
  test(`${url} answers with HTTP 200`, async ({ request }) => {
    const response = await request.get(url);

    expect(response.status()).toBe(200);
  });
}
