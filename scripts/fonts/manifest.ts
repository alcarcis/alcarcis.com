export interface PinnedFontFile {
  /** Path of the file inside the family's download archive. */
  readonly archiveEntry: string;
  /** Repository-relative path that `fonts` in astro.config.mjs reads. */
  readonly target: string;
  /** SHA-256 of the extracted file, so a repackaged archive with the same font still passes. */
  readonly sha256: string;
}

export interface PinnedFontFamily {
  readonly family: string;
  /** Public page where a new release of the family can be confirmed. */
  readonly page: string;
  /** Official download of the family's `*_Complete.zip` archive. */
  readonly url: string;
  readonly files: readonly PinnedFontFile[];
}

export const manifestPath = "scripts/fonts/manifest.ts";

export const pinnedFontFamilies: readonly PinnedFontFamily[] = [
  {
    family: "Chillax",
    page: "https://www.fontshare.com/fonts/chillax",
    url: "https://api.fontshare.com/v2/fonts/download/chillax",
    files: [
      {
        archiveEntry: "Chillax_Complete/Fonts/WEB/fonts/Chillax-Variable.woff2",
        target: "src/assets/fonts/chillax/Chillax-Variable.woff2",
        sha256:
          "4554fa2df4959226daea1f25a22cd54a7e5d2539e59769d0071547713d416106",
      },
    ],
  },
  {
    family: "General Sans",
    page: "https://www.fontshare.com/fonts/general-sans",
    url: "https://api.fontshare.com/v2/fonts/download/general-sans",
    files: [
      {
        archiveEntry:
          "GeneralSans_Complete/Fonts/WEB/fonts/GeneralSans-Variable.woff2",
        target: "src/assets/fonts/general-sans/GeneralSans-Variable.woff2",
        sha256:
          "49d3fbd2f1bcc9850d8d939cabf107d6ade508ce08419fca466b06879e4a0a8e",
      },
    ],
  },
];
