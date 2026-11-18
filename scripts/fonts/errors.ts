import {
  manifestPath,
  type PinnedFontFamily,
  type PinnedFontFile,
} from "./manifest.ts";

export class FontFetchError extends Error {
  override name = "FontFetchError";
}

const MAX_LISTED_ENTRIES = 20;
const RETRY = "Run `pnpm fonts` again";

function fileName(file: PinnedFontFile): string {
  return file.target.slice(file.target.lastIndexOf("/") + 1);
}

function fontFetchError(
  family: PinnedFontFamily,
  summary: string,
  details: readonly string[],
  nextStep: string,
): FontFetchError {
  return new FontFetchError(
    [
      `Could not set up the ${family.family} font: ${summary}`,
      ...details.map((line) => `  ${line}`),
      `Next: ${nextStep}`,
    ].join("\n"),
  );
}

const TRANSIENT_CLIENT_STATUSES = new Set([408, 429]);

const isGone = (status: number | undefined): boolean =>
  status !== undefined &&
  status >= 400 &&
  status < 500 &&
  !TRANSIENT_CLIENT_STATUSES.has(status);

export function downloadFailed(
  family: PinnedFontFamily,
  reason: string,
  status: number | undefined,
): FontFetchError {
  const details = [`URL:    ${family.url}`, `Reason: ${reason}`];
  if (isGone(status)) {
    return fontFetchError(
      family,
      "Fontshare no longer serves this download.",
      details,
      `retrying will not help. Find the family's current download on ${family.page}, update \`url\` for ${family.family} in ${manifestPath}, then run \`pnpm fonts\`.`,
    );
  }
  return fontFetchError(
    family,
    "the download failed, most likely a temporary network or server error.",
    details,
    `check the network connection. ${RETRY}. If it keeps failing, open the URL in a browser to see whether Fontshare is down.`,
  );
}

export function notAZipArchive(
  family: PinnedFontFamily,
  received: Uint8Array,
): FontFetchError {
  const start = new TextDecoder()
    .decode(received.subarray(0, 40))
    .replace(/\s+/g, " ")
    .trim();
  return fontFetchError(
    family,
    "the download is not a ZIP archive.",
    [
      `URL:      ${family.url}`,
      `Received: ${received.byteLength} bytes starting with "${start}"`,
    ],
    `open the URL in a browser to see what Fontshare returns now. ${RETRY} if it was a temporary error page; if the download moved, update \`url\` for ${family.family} in ${manifestPath}.`,
  );
}

export function archiveDamaged(
  family: PinnedFontFamily,
  reason: string,
): FontFetchError {
  return fontFetchError(
    family,
    "the downloaded archive is damaged.",
    [`URL:    ${family.url}`, `Reason: ${reason}`],
    `${RETRY}; a download cut short usually explains it. If it persists, download the URL in a browser and try to open the ZIP to see whether Fontshare serves a broken archive.`,
  );
}

export function entryMissing(
  family: PinnedFontFamily,
  file: PinnedFontFile,
  entryNames: readonly string[],
): FontFetchError {
  const woff2Entries = entryNames.filter((name) => name.endsWith(".woff2"));
  const listed = woff2Entries.slice(0, MAX_LISTED_ENTRIES);
  const omitted = woff2Entries.length - listed.length;
  return fontFetchError(
    family,
    `the archive has no entry ${file.archiveEntry}.`,
    [
      `URL: ${family.url}`,
      `WOFF2 entries in the archive (${woff2Entries.length}):`,
      ...(listed.length === 0
        ? ["  (none)"]
        : listed.map((name) => `  ${name}`)),
      ...(omitted > 0 ? [`  … and ${omitted} more`] : []),
    ],
    `if Fontshare moved or renamed the file, update \`archiveEntry\` for ${fileName(file)} in ${manifestPath}, then check its hash.`,
  );
}

export function hashMismatch(
  family: PinnedFontFamily,
  file: PinnedFontFile,
  actual: string,
): FontFetchError {
  return fontFetchError(
    family,
    `${fileName(file)} does not match its pinned SHA-256, so it was not written.`,
    [
      `URL:      ${family.url}`,
      `Entry:    ${file.archiveEntry}`,
      `Expected: ${file.sha256}`,
      `Actual:   ${actual}`,
    ],
    `${RETRY} in case the download was damaged. If the hash still differs, Fontshare has probably published a new version: confirm it on ${family.page}, check the new file (glyphs, metrics, licence), then set \`sha256\` for ${fileName(file)} in ${manifestPath} to the actual value.`,
  );
}

export function writeFailed(
  family: PinnedFontFamily,
  file: PinnedFontFile,
  reason: string,
): FontFetchError {
  return fontFetchError(
    family,
    `could not write ${file.target}; no partial file was left.`,
    [`Reason: ${reason}`],
    `check that the folder is writable and no other process holds the file. ${RETRY}.`,
  );
}
