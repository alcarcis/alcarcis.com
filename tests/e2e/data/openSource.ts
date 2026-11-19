/**
 * The repositories the Open source section lists: each one's name, its GitHub page, and the
 * usage its README gives, line by line, as the row's terminal prints it. Terminal content is
 * the same on every page, as a real terminal would be.
 */
export interface RepositoryFacts {
  readonly name: string;
  readonly url: string;
  /** The link's visible text: the page's address without its scheme. */
  readonly linkText: string;
  readonly usage: string;
}

const onGitHub = (name: string): Pick<RepositoryFacts, "url" | "linkText"> => ({
  url: `https://github.com/alcarcis/${name}`,
  linkText: `github.com/alcarcis/${name}`,
});

export const playwrightCiReference: RepositoryFacts = {
  name: "playwright-ci-reference",
  ...onGitHub("playwright-ci-reference"),
  // README, "Run it locally": its four commands and the comments of the last two.
  usage: [
    "# from README",
    "$ npm ci",
    "$ npx playwright install chromium",
    "$ npm run check  # lint + format + typecheck + all tests",
    "$ npm run report # open the last HTML report",
  ].join("\n"),
};

export const pw2xray: RepositoryFacts = {
  name: "pw2xray",
  ...onGitHub("pw2xray"),
  // README, "Cómo lo consume un repo": the wrapper script, verbatim.
  usage: [
    "// from README",
    'import "dotenv/config";',
    'import { uploadToXray } from "pw2xray/upload-to-xray";',
    "",
    "uploadToXray().catch((err) => {",
    "  console.error(err);",
    "  process.exitCode = 1;",
    "});",
  ].join("\n"),
};
