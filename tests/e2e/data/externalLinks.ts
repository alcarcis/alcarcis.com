import { playwrightCiReference, pw2xray } from "./openSource";

export const profileUrls = {
  linkedIn: "https://www.linkedin.com/in/alcarcis",
  gitHub: "https://github.com/alcarcis",
} as const;

/** Every external link a page may carry, sorted; anything else fails the external-links spec. */
export const expectedExternalUrls: readonly string[] = [
  profileUrls.gitHub,
  playwrightCiReference.url,
  pw2xray.url,
  profileUrls.linkedIn,
];

/** LinkedIn answers automated requests with HTTP 999, so only GitHub links get a live check. */
export const isLiveCheckable = (url: string): boolean =>
  new URL(url).hostname === "github.com";
