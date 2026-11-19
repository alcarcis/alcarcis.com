/*
 * The repositories the Open source section lists, each with the usage its README gives, as
 * the row's terminal prints it. The lines come from the READMEs only (commands, imports and the
 * READMEs' own comments); the first line names where they come from. Terminal content is the
 * same on every page, as a real terminal would be; the words around it translate.
 */

/** The kinds of text the terminal colours apart. */
export type CodeTokenKind =
  "comment" | "prompt" | "keyword" | "string" | "function";

/** Plain text, or text of one kind the terminal colours. */
export type CodeToken = string | readonly [CodeTokenKind, string];

export interface Usage {
  /** The terminal window's title: the shell, or the language of the snippet. */
  readonly window: "Terminal" | "TypeScript";
  readonly code: readonly CodeToken[];
}

export interface Repository {
  /** The repository's key among the page's strings. */
  readonly key: "playwrightCiReference" | "pw2xray";
  readonly name: string;
  readonly url: string;
  readonly usage: Usage;
}

const onGitHub = (name: string): string =>
  `https://github.com/alcarcis/${name}`;

export const repositories: readonly Repository[] = [
  {
    key: "playwrightCiReference",
    name: "playwright-ci-reference",
    url: onGitHub("playwright-ci-reference"),
    // README, "Run it locally": its four commands and the comments of the last two.
    usage: {
      window: "Terminal",
      code: [
        ["comment", "# from README"],
        "\n",
        ["prompt", "$ "],
        "npm ci\n",
        ["prompt", "$ "],
        "npx playwright install chromium\n",
        ["prompt", "$ "],
        "npm run check  ",
        ["comment", "# lint + format + typecheck + all tests"],
        "\n",
        ["prompt", "$ "],
        "npm run report ",
        ["comment", "# open the last HTML report"],
      ],
    },
  },
  {
    key: "pw2xray",
    name: "pw2xray",
    url: onGitHub("pw2xray"),
    // README, "Cómo lo consume un repo": the wrapper script, verbatim.
    usage: {
      window: "TypeScript",
      code: [
        ["comment", "// from README"],
        "\n",
        ["keyword", "import"],
        " ",
        ["string", '"dotenv/config"'],
        ";\n",
        ["keyword", "import"],
        " { ",
        ["function", "uploadToXray"],
        " } ",
        ["keyword", "from"],
        " ",
        ["string", '"pw2xray/upload-to-xray"'],
        ";\n\n",
        ["function", "uploadToXray"],
        "().",
        ["function", "catch"],
        "((err) => {\n  console.",
        ["function", "error"],
        "(err);\n  process.exitCode = 1;\n});",
      ],
    },
  },
];

/** The code as plain text, with its line breaks. */
export const codeText = (code: readonly CodeToken[]): string =>
  code.map((token) => (typeof token === "string" ? token : token[1])).join("");

/** A page's address as a link shows it: without its scheme. */
export const displayUrl = (url: string): string =>
  url.replace(/^https?:\/\//, "");
