import { fileURLToPath } from "node:url";
import { createDownloader } from "./fonts/download.ts";
import { ensureFonts } from "./fonts/ensure-fonts.ts";
import { FontFetchError } from "./fonts/errors.ts";
import { createFileStore } from "./fonts/file-store.ts";
import { pinnedFontFamilies } from "./fonts/manifest.ts";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));

try {
  await ensureFonts(pinnedFontFamilies, {
    download: createDownloader(),
    store: createFileStore(repositoryRoot),
    log: (message) => console.log(`[fonts] ${message}`),
  });
} catch (error) {
  if (!(error instanceof FontFetchError)) throw error;
  console.error(`[fonts] ${error.message}`);
  process.exitCode = 1;
}
