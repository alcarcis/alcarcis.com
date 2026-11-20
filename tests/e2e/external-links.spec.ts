import { commitUrl } from "./data/contact";
import { expectedExternalUrls } from "./data/externalLinks";
import { localeCases } from "./data/locales";
import { expect, test } from "./fixtures";
import { headCommit } from "./support/buildFacts";

// Whether these URLs answer is checked on a schedule outside the gate: tests/live/external-links.spec.ts.

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
