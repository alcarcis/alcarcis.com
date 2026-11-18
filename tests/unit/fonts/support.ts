import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative, sep } from "node:path";
import type { TestContext } from "node:test";
import { crc32, deflateRawSync } from "node:zlib";
import type { Download } from "../../../scripts/fonts/download.ts";
import {
  ensureFonts,
  type FontStore,
} from "../../../scripts/fonts/ensure-fonts.ts";
import { FontFetchError } from "../../../scripts/fonts/errors.ts";
import { createFileStore } from "../../../scripts/fonts/file-store.ts";
import type { PinnedFontFamily } from "../../../scripts/fonts/manifest.ts";

export interface FontSpec {
  readonly archiveEntry: string;
  readonly target: string;
  readonly content: string;
}

export interface FamilyFixture {
  readonly pin: PinnedFontFamily;
  readonly archive: Uint8Array;
}

export const testfaceVariable: FontSpec = {
  archiveEntry: "Testface_Complete/Fonts/WEB/fonts/Testface-Variable.woff2",
  target: "fonts/testface/Testface-Variable.woff2",
  content: "Testface variable font bytes",
};

export const testfaceItalic: FontSpec = {
  archiveEntry: "Testface_Complete/Fonts/WEB/fonts/Testface-Italic.woff2",
  target: "fonts/testface/Testface-Italic.woff2",
  content: "Testface italic font bytes",
};

export const unpinnedEntries: Readonly<Record<string, string>> = {
  "Testface_Complete/Fonts/WEB/fonts/Testface-Bold.woff2":
    "Testface bold bytes",
  "Testface_Complete/License/FFL.txt": "Licence text",
};

export const sha256 = (data: Uint8Array | string): string =>
  createHash("sha256").update(data).digest("hex");

export function aFamily(
  fonts: readonly FontSpec[] = [testfaceVariable],
): FamilyFixture {
  return {
    pin: {
      family: "Testface",
      page: "https://fonts.example.test/testface",
      url: "https://fonts.example.test/download/testface",
      files: fonts.map((font) => ({
        archiveEntry: font.archiveEntry,
        target: font.target,
        sha256: sha256(font.content),
      })),
    },
    archive: archiveOf(fonts),
  };
}

export function archiveOf(
  fonts: readonly FontSpec[],
  replacedEntries: Readonly<Record<string, string>> = {},
): Uint8Array {
  return buildZip({
    ...unpinnedEntries,
    ...Object.fromEntries(
      fonts.map((font) => [font.archiveEntry, font.content]),
    ),
    ...replacedEntries,
  });
}

export function buildZip(
  entries: Readonly<Record<string, string>>,
  method: "deflate" | "store" = "deflate",
): Uint8Array {
  const methodCode = method === "deflate" ? 8 : 0;
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const [name, content] of Object.entries(entries)) {
    const data = Buffer.from(content, "utf8");
    const body = method === "deflate" ? deflateRawSync(data) : data;
    const nameBytes = Buffer.from(name, "utf8");
    const checksum = crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(methodCode, 8);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(methodCode, 10);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(body.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBytes.length, 28);
    central.writeUInt32LE(offset, 42);

    localParts.push(local, nameBytes, body);
    centralParts.push(central, nameBytes);
    offset += local.length + nameBytes.length + body.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(Object.keys(entries).length, 8);
  end.writeUInt16LE(Object.keys(entries).length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);

  return Buffer.concat([...localParts, centralDirectory, end]);
}

/** Overwrites the compressed bytes of the archive's first entry, as a download cut short might. */
export function damageFirstEntry(zip: Uint8Array): Uint8Array {
  const damaged = Buffer.from(zip);
  const bodyStart = 30 + damaged.readUInt16LE(26) + damaged.readUInt16LE(28);
  damaged.fill(0xff, bodyStart, bodyStart + damaged.readUInt32LE(18));
  return damaged;
}

export interface DownloadStub {
  readonly download: Download;
  readonly requestedUrls: readonly string[];
}

export function downloadsFrom(
  responses: Readonly<Record<string, Uint8Array | Error>>,
): DownloadStub {
  const requestedUrls: string[] = [];
  const download: Download = async (url) => {
    requestedUrls.push(url);
    const response = responses[url];
    if (response === undefined) throw new Error(`Unexpected download: ${url}`);
    if (response instanceof Error) throw response;
    return response;
  };
  return { download, requestedUrls };
}

export async function temporaryRoot(t: TestContext): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "fetch-fonts-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

export async function placeFile(
  root: string,
  target: string,
  content: string,
): Promise<void> {
  const path = join(root, target);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
}

export async function readText(root: string, target: string): Promise<string> {
  return readFile(join(root, target), "utf8");
}

export async function filesUnder(root: string): Promise<string[]> {
  const entries = await readdir(root, { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) =>
      relative(root, join(entry.parentPath, entry.name)).split(sep).join("/"),
    )
    .sort();
}

export function ensureFontsIn(
  root: string,
  families: readonly PinnedFontFamily[],
  download: Download,
  store: FontStore = createFileStore(root),
): Promise<void> {
  return ensureFonts(families, { download, store, log: () => undefined });
}

export async function expectFontFetchError(
  attempt: Promise<unknown>,
  expectedFragments: readonly string[],
): Promise<void> {
  await assert.rejects(attempt, (error: unknown) => {
    assert.ok(
      error instanceof FontFetchError,
      `Expected a FontFetchError, got ${String(error)}`,
    );
    for (const fragment of expectedFragments) {
      assert.ok(
        error.message.includes(fragment),
        `Expected the message to include "${fragment}":\n${error.message}`,
      );
    }
    return true;
  });
}
