import { commitUrl } from "./data/contact";
import { expectedExternalUrls, isLiveCheckable } from "./data/externalLinks";
import { localeCases } from "./data/locales";
import { expect, test } from "./fixtures";
import { headCommit } from "./support/buildFacts";

for (const locale of localeCases) {
  test(`${locale.language.name} page at ${locale.language.path} links only to the expected external URLs`, async ({
    homePage,
  }) => {
    await homePage.open(locale.language.path);

    // The certificate also links the commit this build was made from.
    expect(await homePage.externalLinkUrls()).toEqual(
      [...expectedExternalUrls, commitUrl(headCommit())].sort(),
    );
  });
}

// The commit link is left out of the live check: it names this build's commit, which GitHub
// knows only once it is pushed.

for (const url of expectedExternalUrls.filter(isLiveCheckable)) {
  test(`${url} answers with HTTP 200`, async ({ request }) => {
    const response = await request.get(url);

    expect(response.status()).toBe(200);
  });
}
