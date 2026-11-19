export const owner = {
  name: "Carlos Alcalá",
} as const;

/**
 * What the structured data says about the owner beyond the name. Search engines read it; the
 * page never shows it: the current job title does not label the portfolio (D34, Q24).
 */
export const structuredProfile = {
  jobTitle: "QA Specialist",
  knowsAbout: ["Quality Engineering", "Test Automation", "Agentic QA", "CI/CD"],
} as const;

export const contact = {
  email: "hola@alcarcis.com",
} as const;

export const profiles = {
  linkedIn: "https://www.linkedin.com/in/alcarcis",
  gitHub: "https://github.com/alcarcis",
} as const;
