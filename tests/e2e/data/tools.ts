/** The tools in each group, in the order the page lists them; names are the same on every page. */
export const toolNamesByGroup: readonly (readonly string[])[] = [
  ["Playwright", "TypeScript", "Cypress", "Cucumber"],
  ["Maestro", "Appium"],
  ["Postman", "k6", "JMeter"],
  ["GitHub Actions", "Jenkins", "Docker", "Git"],
  ["Jira", "Xray"],
];

/** Where the logo credits link: the Jenkins project, as its licence asks, and each licence. */
export const creditUrls = {
  jenkinsProject: "https://jenkins.io/",
  ccBySa30: "https://creativecommons.org/licenses/by-sa/3.0/",
  ccBy30: "https://creativecommons.org/licenses/by/3.0/",
  ccBy40: "https://creativecommons.org/licenses/by/4.0/",
} as const;

/** A stretch of the credits line: plain text, or a link with its name and address. */
export type CreditSegment =
  string | { readonly link: string; readonly url: string };

/** A single-colour mark takes its brand colour when the pointer rests on its tool. */
export const hoverCase = {
  tool: "Docker",
  brandColour: "rgb(36, 150, 237)",
} as const;

/** Maestro's official black tile would vanish on graphite: the dark theme shows its reversed tile. */
export const themedLogo = {
  tool: "Maestro",
  light: /\/maestro\.[\w-]+\.svg$/,
  dark: /\/maestro-reversed\.[\w-]+\.svg$/,
} as const;
