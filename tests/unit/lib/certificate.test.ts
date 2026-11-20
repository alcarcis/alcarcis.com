import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  commitFact,
  countedPhrase,
  e2ePhrase,
  sourceRepository,
} from "../../../src/lib/certificate.ts";

const fullSha = "ac8f69d0e1b2c3d4e5f60718293a4b5c6d7e8f90";

describe("commitFact", () => {
  it("shows a full hash by its first seven characters and links its commit page", () => {
    assert.deepEqual(commitFact(fullSha), {
      shortSha: "ac8f69d",
      href: `${sourceRepository}/commit/${fullSha}`,
    });
  });

  it("links a short hash as it is, which GitHub resolves", () => {
    assert.deepEqual(commitFact("ac8f69d"), {
      shortSha: "ac8f69d",
      href: `${sourceRepository}/commit/ac8f69d`,
    });
  });

  it("links the commit itself, never its checks", () => {
    assert.doesNotMatch(commitFact(fullSha)?.href ?? "", /checks/);
  });

  it("has no commit to show when the build could not read one", () => {
    assert.equal(commitFact(null), null);
    assert.equal(commitFact(""), null);
    assert.equal(commitFact("  "), null);
  });
});

describe("countedPhrase", () => {
  const phrases = {
    one: "{count} Playwright test · on every pull request",
    other: "{count} Playwright tests · on every pull request",
  };

  it("counts a single test in the singular", () => {
    assert.equal(
      countedPhrase(phrases, 1),
      "1 Playwright test · on every pull request",
    );
  });

  it("counts any other number in the plural", () => {
    assert.equal(
      countedPhrase(phrases, 325),
      "325 Playwright tests · on every pull request",
    );
    assert.equal(
      countedPhrase(phrases, 0),
      "0 Playwright tests · on every pull request",
    );
  });
});

/*
 * The page's own strings, read from src/i18n/ui.ts as text: the module imports astro:i18n,
 * which only Astro can load, so Node's test runner cannot import it.
 */
const uiSource = readFileSync(
  new URL("../../../src/i18n/ui.ts", import.meta.url),
  "utf8",
);

const uiString = (locale: "en" | "es", key: string): string => {
  const start = uiSource.search(new RegExp(`^const ${locale}\\b`, "m"));
  const block = uiSource.slice(start, uiSource.indexOf("\n}", start));
  const escapedKey = key.replaceAll(".", "\\.");
  const match = new RegExp(`"${escapedKey}":\\s*"([^"]*)"`).exec(block);
  if (!match?.[1]) throw new Error(`ui.ts has no ${locale} "${key}".`);
  return match[1];
};

const e2ePhrases = (locale: "en" | "es") => ({
  uncounted: uiString(locale, "certificate.e2e"),
  one: uiString(locale, "certificate.e2e.one"),
  other: uiString(locale, "certificate.e2e.other"),
});

describe("e2ePhrase", () => {
  const cases = [
    {
      locale: "en",
      uncounted: "Playwright · on every pull request",
      one: "1 Playwright test · on every pull request",
      other: "379 Playwright tests · on every pull request",
    },
    {
      locale: "es",
      uncounted: "Playwright · en cada pull request",
      one: "1 prueba de Playwright · en cada pull request",
      other: "379 pruebas de Playwright · en cada pull request",
    },
  ] as const;

  for (const { locale, uncounted, one, other } of cases) {
    it(`states the suite without a number when the build could not count it (${locale})`, () => {
      assert.equal(e2ePhrase(e2ePhrases(locale), null), uncounted);
    });

    it(`counts a single test in the singular (${locale})`, () => {
      assert.equal(e2ePhrase(e2ePhrases(locale), 1), one);
    });

    it(`counts the suite in the plural (${locale})`, () => {
      assert.equal(e2ePhrase(e2ePhrases(locale), 379), other);
    });
  }
});
