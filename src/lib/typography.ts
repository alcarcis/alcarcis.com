const noBreakSpace = "\u00A0";

/**
 * Joins the words of each part with no-break spaces, so a line can wrap only at a separator:
 * "Agentic QA" never splits across lines, "Agentic QA · Web" can.
 */
export const breakOnlyBetween = (text: string, separator = " · "): string =>
  text
    .split(separator)
    .map((part) => part.replaceAll(" ", noBreakSpace))
    .join(separator);

/** Terms whose words read as one name, so a line never breaks inside them. */
const unbreakableTerms = ["pull request"];

/**
 * Joins the words of each unbreakable term with no-break spaces, wherever the term appears:
 * "every pull request" can wrap before "pull", never between "pull" and "request".
 */
export const keepTermsTogether = (text: string): string =>
  unbreakableTerms.reduce(
    (bound, term) => bound.replaceAll(term, term.replaceAll(" ", noBreakSpace)),
    text,
  );
