import { inflateRawSync } from "node:zlib";

const END_OF_CENTRAL_DIRECTORY = 0x06054b50;
const CENTRAL_DIRECTORY_ENTRY = 0x02014b50;
const LOCAL_FILE_HEADER = 0x04034b50;
const END_RECORD_SIZE = 22;
const MAX_COMMENT_SIZE = 0xffff;
const STORED = 0;
const DEFLATED = 8;

export class NotAZipArchiveError extends Error {
  override name = "NotAZipArchiveError";
}

export interface ZipArchive {
  readonly entryNames: readonly string[];
  /** The entry's uncompressed bytes, or undefined when the archive has no entry by that name. */
  read(name: string): Uint8Array | undefined;
}

interface CentralEntry {
  readonly method: number;
  readonly compressedSize: number;
  readonly localHeaderOffset: number;
}

/** Reads the central directory of a ZIP archive in memory; enough for the font archives, no ZIP64. */
export function openZip(archive: Uint8Array): ZipArchive {
  const view = new DataView(
    archive.buffer,
    archive.byteOffset,
    archive.byteLength,
  );
  const entries = readCentralDirectory(archive, view);

  return {
    entryNames: [...entries.keys()],
    read(name) {
      const entry = entries.get(name);
      return entry === undefined
        ? undefined
        : readEntry(archive, view, name, entry);
    },
  };
}

function readCentralDirectory(
  archive: Uint8Array,
  view: DataView,
): Map<string, CentralEntry> {
  const end = findEndOfCentralDirectory(view);
  const count = view.getUint16(end + 10, true);
  const names = new TextDecoder();
  const entries = new Map<string, CentralEntry>();
  let cursor = view.getUint32(end + 16, true);

  try {
    for (let index = 0; index < count; index += 1) {
      if (view.getUint32(cursor, true) !== CENTRAL_DIRECTORY_ENTRY) {
        throw new NotAZipArchiveError("The ZIP central directory is damaged.");
      }
      const nameLength = view.getUint16(cursor + 28, true);
      const extraLength = view.getUint16(cursor + 30, true);
      const commentLength = view.getUint16(cursor + 32, true);
      const name = names.decode(
        archive.subarray(cursor + 46, cursor + 46 + nameLength),
      );
      entries.set(name, {
        method: view.getUint16(cursor + 10, true),
        compressedSize: view.getUint32(cursor + 20, true),
        localHeaderOffset: view.getUint32(cursor + 42, true),
      });
      cursor += 46 + nameLength + extraLength + commentLength;
    }
  } catch (error) {
    if (error instanceof RangeError) {
      throw new NotAZipArchiveError("The ZIP central directory is truncated.");
    }
    throw error;
  }

  return entries;
}

function findEndOfCentralDirectory(view: DataView): number {
  const last = view.byteLength - END_RECORD_SIZE;
  const first = Math.max(0, last - MAX_COMMENT_SIZE);
  for (let offset = last; offset >= first; offset -= 1) {
    if (view.getUint32(offset, true) === END_OF_CENTRAL_DIRECTORY) {
      return offset;
    }
  }
  throw new NotAZipArchiveError(
    "No ZIP end-of-central-directory record found.",
  );
}

function readEntry(
  archive: Uint8Array,
  view: DataView,
  name: string,
  entry: CentralEntry,
): Uint8Array {
  if (entry.method !== STORED && entry.method !== DEFLATED) {
    throw new NotAZipArchiveError(
      `The ZIP entry ${name} uses compression method ${entry.method}; only stored and deflated entries are supported.`,
    );
  }

  try {
    const header = entry.localHeaderOffset;
    if (view.getUint32(header, true) !== LOCAL_FILE_HEADER) {
      throw new Error("no local file header at its offset");
    }
    const start =
      header +
      30 +
      view.getUint16(header + 26, true) +
      view.getUint16(header + 28, true);
    const body = archive.subarray(start, start + entry.compressedSize);
    return entry.method === STORED ? body.slice() : inflateRawSync(body);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new NotAZipArchiveError(
      `The ZIP entry ${name} is damaged: ${reason}.`,
    );
  }
}
