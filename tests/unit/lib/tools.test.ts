import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { linkSegments, logoFiles, toolGroups } from "../../../src/lib/tools.ts";

const logoDirectory = new URL(
  "../../../src/assets/icons/tools/",
  import.meta.url,
);
const shippedLogos = readdirSync(logoDirectory)
  .filter((file) => file.endsWith(".svg"))
  .sort();
const sources = readFileSync(new URL("SOURCES.md", logoDirectory), "utf8");

/** The table row SOURCES.md gives a file, split into its cells. */
const sourceRow = (file: string): string[] | undefined =>
  sources
    .split("\n")
    .find((line) => line.startsWith(`| ${file} |`))
    ?.split("|")
    .map((cell) => cell.trim())
    .filter(Boolean);

describe("tool logos", () => {
  it("ships exactly the logo files the section shows", () => {
    assert.deepEqual([...logoFiles(toolGroups)].sort(), shippedLogos);
  });

  for (const file of shippedLogos) {
    it(`records where ${file} comes from and its licence or trademark note`, () => {
      const row = sourceRow(file);

      assert.ok(row, `SOURCES.md has no row for ${file}`);
      assert.ok(
        row.some((cell) => /^https:\/\//.test(cell)),
        `${file} has no source URL`,
      );
      assert.ok(
        row.some((cell) => /licen[cs]e|trademark|CC0|CC-BY|Apache/i.test(cell)),
        `${file} has no licence or trademark note`,
      );
    });
  }

  it("names every tool once", () => {
    const names = toolGroups.flatMap((group) =>
      group.tools.map((tool) => tool.name),
    );

    assert.equal(new Set(names).size, names.length);
  });
});

describe("linkSegments", () => {
  it("splits a line into its text and its links, in order", () => {
    assert.deepEqual(
      linkSegments("Logo by the [Jenkins project](https://jenkins.io/), CC."),
      [
        "Logo by the ",
        { text: "Jenkins project", href: "https://jenkins.io/" },
        ", CC.",
      ],
    );
  });

  it("keeps links that sit side by side apart", () => {
    assert.deepEqual(linkSegments("[a](https://a.test/)[b](https://b.test/)"), [
      { text: "a", href: "https://a.test/" },
      { text: "b", href: "https://b.test/" },
    ]);
  });

  it("returns a line without links as it is", () => {
    assert.deepEqual(linkSegments("No links here."), ["No links here."]);
  });
});
