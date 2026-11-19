/*
 * The Tools section: the tools Carlos uses, in the groups of the stack image on his GitHub
 * profile, plus Jenkins under CI/CD (both CVs name it). Each tool shows its real logo, a file
 * served by this site from src/assets/icons/tools, whose SOURCES.md records where every file
 * comes from and its licence or trademark note.
 */

/** The groups' keys among the page's strings. */
export type ToolGroupKey =
  "automation" | "mobile" | "apiPerformance" | "cicd" | "testManagement";

/** A single-colour mark: drawn in the theme's ink, in its brand colour while pointed at. */
export interface MarkLogo {
  readonly kind: "mark";
  readonly file: string;
  readonly brand: `#${string}`;
}

/**
 * An official multi-colour file, shown as itself: grey and muted at rest, in full colour while
 * pointed at. Its rest brightness can differ from the theme's default for each ground.
 */
export interface OfficialLogo {
  readonly kind: "official";
  readonly file: string;
  /** The file for the dark ground, when the light one would vanish on it. */
  readonly darkFile?: string;
  readonly restBrightness?: { readonly light?: number; readonly dark?: number };
}

export type Logo = MarkLogo | OfficialLogo;

export interface Tool {
  readonly name: string;
  readonly logo: Logo;
  /**
   * How the logo sits in its box beyond fitting it: the Apache feather turned and enlarged so
   * it reads as a feather; Xray's mark cropped from its wordmark.
   */
  readonly fit?: "feather" | "mark-only";
}

export interface ToolGroup {
  readonly key: ToolGroupKey;
  readonly tools: readonly Tool[];
}

const mark = (file: string, brand: `#${string}`): MarkLogo => ({
  kind: "mark",
  file,
  brand,
});

export const toolGroups: readonly ToolGroup[] = [
  {
    key: "automation",
    tools: [
      {
        name: "Playwright",
        logo: { kind: "official", file: "playwright.svg" },
      },
      { name: "TypeScript", logo: mark("typescript.svg", "#3178C6") },
      { name: "Cypress", logo: mark("cypress.svg", "#69D3A7") },
      { name: "Cucumber", logo: mark("cucumber.svg", "#23D96C") },
    ],
  },
  {
    key: "mobile",
    tools: [
      {
        name: "Maestro",
        // A one-tone tile: opacity alone mutes it, on either ground.
        logo: {
          kind: "official",
          file: "maestro.svg",
          darkFile: "maestro-reversed.svg",
          restBrightness: { light: 1, dark: 1 },
        },
      },
      { name: "Appium", logo: mark("appium.svg", "#EE376D") },
    ],
  },
  {
    key: "apiPerformance",
    tools: [
      { name: "Postman", logo: mark("postman.svg", "#FF6C37") },
      { name: "k6", logo: mark("k6.svg", "#7D64FF") },
      // The Apache feather alone, not the JMeter wordmark, at the owner's request.
      { name: "JMeter", logo: mark("apache.svg", "#D22128"), fit: "feather" },
    ],
  },
  {
    key: "cicd",
    tools: [
      { name: "GitHub Actions", logo: mark("githubactions.svg", "#2088FF") },
      {
        name: "Jenkins",
        // On graphite the butler's dark outline needs more light to keep its shape.
        logo: {
          kind: "official",
          file: "jenkins-official.svg",
          restBrightness: { dark: 2.2 },
        },
      },
      { name: "Docker", logo: mark("docker.svg", "#2496ED") },
      { name: "Git", logo: mark("git.svg", "#F03C2E") },
    ],
  },
  {
    key: "testManagement",
    tools: [
      { name: "Jira", logo: mark("jira.svg", "#0052CC") },
      {
        name: "Xray",
        // On graphite the tile takes less light, or its white bolt would vanish into it.
        logo: {
          kind: "official",
          file: "xray.svg",
          restBrightness: { dark: 1.25 },
        },
        fit: "mark-only",
      },
    ],
  },
];

/** Every logo file the groups show, on either ground. */
export const logoFiles = (groups: readonly ToolGroup[]): Set<string> =>
  new Set(
    groups.flatMap(({ tools }) =>
      tools.flatMap(({ logo }) =>
        logo.kind === "official" && logo.darkFile
          ? [logo.file, logo.darkFile]
          : [logo.file],
      ),
    ),
  );

/** A stretch of a line of copy: plain text, or a link. */
export type LinkSegment =
  string | { readonly text: string; readonly href: string };

/** Splits copy written with [text](href) links into its text and its links, in order. */
export function linkSegments(line: string): LinkSegment[] {
  const parts = line.split(/\[([^\]]+)\]\(([^)\s]+)\)/);
  const segments: LinkSegment[] = [];
  for (let index = 0; index < parts.length; index += 3) {
    const text = parts[index];
    const linkText = parts[index + 1];
    const href = parts[index + 2];
    if (text) segments.push(text);
    if (linkText !== undefined && href !== undefined) {
      segments.push({ text: linkText, href });
    }
  }
  return segments;
}
