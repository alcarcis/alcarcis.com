// JSON-LD for the page head. Pure, so Node's test runner loads it directly.

export interface PersonFacts {
  readonly name: string;
  readonly jobTitle: string;
  /** The owner's home page; it also identifies the Person (`@id`). */
  readonly url: string;
  readonly sameAs: readonly string[];
  readonly knowsAbout: readonly string[];
  readonly image?: string;
}

/** The site's owner as a schema.org Person. */
export function personJsonLd(facts: PersonFacts): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${facts.url}#person`,
    name: facts.name,
    jobTitle: facts.jobTitle,
    url: facts.url,
    ...(facts.image === undefined ? {} : { image: facts.image }),
    sameAs: facts.sameAs,
    knowsAbout: facts.knowsAbout,
  };
}

const unsafeInScript: Readonly<Record<string, string>> = {
  "<": "\\u003c",
  ">": "\\u003e",
  "&": "\\u0026",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029",
};

/**
 * JSON for an inline `<script type="application/ld+json">`. HTML ends a script at the first
 * `</script`, and `<!--` changes how it is parsed, so the characters that can form either are
 * written as JSON escapes; the line and paragraph separators too. The JSON still parses to the
 * same data.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(
    /[<>&\u2028\u2029]/g,
    (character) => unsafeInScript[character] ?? character,
  );
}
