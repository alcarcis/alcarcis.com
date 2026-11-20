// @ts-check
import { defineConfig, fontProviders } from "astro/config";

export default defineConfig({
  site: "https://alcarcis.com",
  output: "static",
  trailingSlash: "always",
  build: {
    format: "directory",
  },
  i18n: {
    defaultLocale: "en",
    locales: ["en", "es"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  fonts: [
    {
      provider: fontProviders.local(),
      name: "Chillax",
      cssVariable: "--font-display",
      fallbacks: ["sans-serif"],
      options: {
        variants: [
          {
            weight: "200 700",
            style: "normal",
            src: ["./src/assets/fonts/chillax/Chillax-Variable.woff2"],
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: "General Sans",
      cssVariable: "--font-body",
      fallbacks: ["sans-serif"],
      options: {
        variants: [
          {
            weight: "200 700",
            style: "normal",
            src: ["./src/assets/fonts/general-sans/GeneralSans-Variable.woff2"],
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: "Geist Mono",
      cssVariable: "--font-mono",
      // Liberation Mono has Courier New's metrics, so Linux keeps the
      // same width when Courier New is missing.
      fallbacks: ["Liberation Mono", "monospace"],
      options: {
        variants: [
          {
            weight: "100 900",
            style: "normal",
            src: ["./src/assets/fonts/geist-mono/GeistMono-Variable.woff2"],
          },
        ],
      },
    },
  ],
});
