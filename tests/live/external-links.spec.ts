import { expect, test } from "@playwright/test";
import {
  expectedExternalUrls,
  isLiveCheckable,
} from "../e2e/data/externalLinks";

// The URL list is shared with tests/e2e/external-links.spec.ts, which asserts that the pages link
// only to these URLs, so both suites check the same links.

// The commit link is left out of the live check: it names this build's commit, which GitHub
// knows only once it is pushed.

for (const url of expectedExternalUrls.filter(isLiveCheckable)) {
  test(`${url} answers with HTTP 200`, async ({ request }) => {
    const response = await request.get(url);

    expect(response.status()).toBe(200);
  });
}
