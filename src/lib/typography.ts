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
