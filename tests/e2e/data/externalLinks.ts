import { playwrightCiReference, pw2xray } from "./openSource";
import { creditUrls } from "./tools";

export const profileUrls = {
  linkedIn: "https://www.linkedin.com/in/alcarcis",
  gitHub: "https://github.com/alcarcis",
} as const;

/** Every external link a page may carry, sorted; anything else fails the external-links spec. */
export const expectedExternalUrls: readonly string[] = [
  creditUrls.ccBySa30,
  creditUrls.ccBy30,
  creditUrls.ccBy40,
  profileUrls.gitHub,
  playwrightCiReference.url,
  pw2xray.url,
  creditUrls.jenkinsProject,
  profileUrls.linkedIn,
];

/** LinkedIn answers automated requests with HTTP 999, so only GitHub links get a live check. */
export const isLiveCheckable = (url: string): boolean =>
  new URL(url).hostname === "github.com";
