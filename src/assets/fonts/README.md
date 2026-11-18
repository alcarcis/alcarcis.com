# Fonts

Self-hosted variable WOFF2 files, loaded through Astro's fonts API (`fonts` in `astro.config.mjs`), which copies them unchanged to `/_astro/fonts/`, writes the `@font-face` rules with `font-display: swap`, and adds metric-matched local fallbacks (Arial for the two sans families, Courier New for the mono).

| Family | Role | File | In git | Bytes | Weights | Preloaded |
| --- | --- | --- | --- | --- | --- | --- |
| Chillax | display (`--font-display`) | `chillax/Chillax-Variable.woff2` | no, fetched | 55,640 | 200–700 | yes: the H1 is the largest text in the first viewport |
| General Sans | body (`--font-body`) | `general-sans/GeneralSans-Variable.woff2` | no, fetched | 38,132 | 200–700 | no: no body text in the first viewport yet; preload it once the hero sub line ships |
| Geist Mono | code and UI (`--font-mono`) | `geist-mono/GeistMono-Variable.woff2` | yes | 40,376 | 100–900 | no: small UI text with a metric-matched fallback |

## Chillax and General Sans: fetched at build time

Both are from Indian Type Foundry through Fontshare, under the ITF Free Font License 2.0 (`chillax/FFL.txt`, `general-sans/FFL.txt`). The license lets a site self-host the fonts, but it forbids distributing them "through … repository … publicly accessible servers" and forbids subsetting or converting them. So the WOFF2 files stay out of git (see `.gitignore`) and ship exactly as Fontshare distributes them. The license texts stay in git: the license defines "Font Software" as the files that render the typeface designs, which a license text is not.

`pnpm fonts` (`scripts/fetch-fonts.ts`) puts them in place. `pnpm dev`, `pnpm build` and `pnpm preview` run it first, so it works the same locally, in CI and on Cloudflare Pages. For each family it:

1. hashes the file already in this folder and stops there, without any network request, when the SHA-256 matches the pin;
2. otherwise downloads the family archive, extracts only the pinned entry and checks its SHA-256 (the hash of the extracted file, not of the ZIP: Fontshare rebuilds the archive on every download);
3. writes the file to a temporary name and renames it into place, so a failed run never leaves a half-written font.

On any failure it stops the build and prints the family, the URL, the reason (HTTP status, network error, missing entry with the entries the archive does have, or expected and actual hash) and the next step.

| Family | Designer | Download | Archive entry | Font version | SHA-256 |
| --- | --- | --- | --- | --- | --- |
| Chillax | Manushi Parikh | `https://api.fontshare.com/v2/fonts/download/chillax` | `Chillax_Complete/Fonts/WEB/fonts/Chillax-Variable.woff2` | 1.000 | `4554fa2df4959226daea1f25a22cd54a7e5d2539e59769d0071547713d416106` |
| General Sans | Frode Helland | `https://api.fontshare.com/v2/fonts/download/general-sans` | `GeneralSans_Complete/Fonts/WEB/fonts/GeneralSans-Variable.woff2` | 2.000 | `49d3fbd2f1bcc9850d8d939cabf107d6ade508ce08419fca466b06879e4a0a8e` |

### Updating a pinned font

The pins live in one place, `scripts/fonts/manifest.ts`. When the fetch reports a hash mismatch twice in a row, Fontshare has most likely released a new version:

1. Confirm the release on the family page (<https://www.fontshare.com/fonts/chillax>, <https://www.fontshare.com/fonts/general-sans>).
2. Check the new file: glyph coverage (table below), weights, metrics, and whether `License/FFL.txt` in the archive changed.
3. Set `sha256` in the manifest to the "Actual" value from the error, run `pnpm fonts`, then `pnpm build` and `pnpm test:e2e`.

If the archive moved or renamed the file, the error lists the WOFF2 entries it has; update `archiveEntry` (or `url`) the same way.

## Geist Mono: committed

By Vercel with basement.studio, from the `geist` npm package 1.9.2 (`dist/fonts/geist-mono/GeistMono-Variable.woff2`, font version 1.900). License: SIL Open Font License 1.1, `geist-mono/OFL.txt`, which allows redistribution and declares no Reserved Font Name, so a subset may keep the family name. Subset with fonttools 4.68.0 to Latin, Latin-1, general punctuation, arrows, math comparison signs, box drawing, block elements and geometric shapes, keeping every OpenType feature, the weight axis and the name table (70 KB to 40 KB, SHA-256 `6709a9c3157a55679bddfb0041bd2e1c72214cbc7cb505535a64e179382d5f57`):

```sh
pyftsubset GeistMono-Variable.woff2 \
  --unicodes="U+0020-007E,U+00A0-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2190-21FF,U+2212,U+2215,U+2260-2265,U+2500-257F,U+2580-259F,U+25A0-25FF,U+FEFF,U+FFFD" \
  --layout-features='*' --name-IDs='*' --name-languages='*' --name-legacy \
  --notdef-outline --flavor=woff2 --output-file=GeistMono-Variable.woff2
```

## Glyph coverage

Checked with fonttools `getBestCmap()` on the shipped files.

| Characters | Chillax | General Sans | Geist Mono |
| --- | --- | --- | --- |
| Basic Latin (U+0020–U+007E) | yes | yes | yes |
| `á é í ó ú Á É Í Ó Ú ñ Ñ ü Ü ¿ ¡` | yes | yes | yes |
| `· — – ‘ ’ “ ” …` | yes | yes | yes |
| `× ≥ © °` | yes | yes | yes |
| `→` | no | no | yes |
| `─ │ ┌ ┐ └ ┘ ║ ●` | no | no | yes |
| `↻ ✓` | no | no | no |

None of the three has `↻` or `✓`. Draw arrows, rerun and check icons as inline SVG next to Chillax or General Sans text; where `✓` appears in Geist Mono text (the ASCII scene), the browser takes it from a system font.
