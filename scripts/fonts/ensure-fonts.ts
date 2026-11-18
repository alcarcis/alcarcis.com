import { createHash } from "node:crypto";
import { HttpStatusError, type Download } from "./download.ts";
import {
  archiveDamaged,
  downloadFailed,
  entryMissing,
  hashMismatch,
  notAZipArchive,
  writeFailed,
} from "./errors.ts";
import type { PinnedFontFamily, PinnedFontFile } from "./manifest.ts";
import { NotAZipArchiveError, openZip, type ZipArchive } from "./zip.ts";

export interface FontStore {
  /** The file's bytes, or undefined when it does not exist. */
  read(target: string): Promise<Uint8Array | undefined>;
  /** Writes the whole file or nothing. */
  writeAtomically(target: string, data: Uint8Array): Promise<void>;
}

export interface EnsureFontsOptions {
  readonly download: Download;
  readonly store: FontStore;
  readonly log: (message: string) => void;
}

interface VerifiedFile {
  readonly file: PinnedFontFile;
  readonly data: Uint8Array;
}

const sha256 = (data: Uint8Array): string =>
  createHash("sha256").update(data).digest("hex");

const reasonOf = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/**
 * Makes every pinned font file present with its pinned hash. Families whose files are
 * already in place are not downloaded; a family is written only after all its files verify.
 */
export async function ensureFonts(
  families: readonly PinnedFontFamily[],
  { download, store, log }: EnsureFontsOptions,
): Promise<void> {
  for (const family of families) {
    const missing = await filesNeedingFetch(family, store);
    if (missing.length === 0) {
      log(`${family.family}: present, SHA-256 verified.`);
      continue;
    }

    log(`${family.family}: downloading ${family.url}`);
    const archive = await downloadArchive(family, download);
    const verified = missing.map((file) =>
      extractVerified(family, file, archive),
    );
    for (const { file, data } of verified) {
      await writeVerified(family, file, data, store);
      log(`${family.family}: wrote ${file.target}, SHA-256 verified.`);
    }
  }
}

async function filesNeedingFetch(
  family: PinnedFontFamily,
  store: FontStore,
): Promise<PinnedFontFile[]> {
  const needed: PinnedFontFile[] = [];
  for (const file of family.files) {
    const present = await store.read(file.target);
    if (present === undefined || sha256(present) !== file.sha256) {
      needed.push(file);
    }
  }
  return needed;
}

async function downloadArchive(
  family: PinnedFontFamily,
  download: Download,
): Promise<ZipArchive> {
  let bytes: Uint8Array;
  try {
    bytes = await download(family.url);
  } catch (error) {
    const status = error instanceof HttpStatusError ? error.status : undefined;
    throw downloadFailed(family, reasonOf(error), status);
  }

  try {
    return openZip(bytes);
  } catch (error) {
    if (error instanceof NotAZipArchiveError) {
      throw notAZipArchive(family, bytes);
    }
    throw error;
  }
}

function extractVerified(
  family: PinnedFontFamily,
  file: PinnedFontFile,
  archive: ZipArchive,
): VerifiedFile {
  let data: Uint8Array | undefined;
  try {
    data = archive.read(file.archiveEntry);
  } catch (error) {
    if (error instanceof NotAZipArchiveError) {
      throw archiveDamaged(family, error.message);
    }
    throw error;
  }
  if (data === undefined) throw entryMissing(family, file, archive.entryNames);

  const actual = sha256(data);
  if (actual !== file.sha256) throw hashMismatch(family, file, actual);
  return { file, data };
}

async function writeVerified(
  family: PinnedFontFamily,
  file: PinnedFontFile,
  data: Uint8Array,
  store: FontStore,
): Promise<void> {
  try {
    await store.writeAtomically(file.target, data);
  } catch (error) {
    throw writeFailed(family, file, reasonOf(error));
  }
}
