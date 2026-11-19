import js from "@eslint/js";
import eslintPluginAstro from "eslint-plugin-astro";
import { defineConfig, globalIgnores } from "eslint/config";
import { existsSync, readFileSync } from "node:fs";
import tseslint from "typescript-eslint";

// ESLint does not read git's ignore files; this keeps local-only folders out of linting.
const excludeFile = `${import.meta.dirname}/.git/info/exclude`;
const localExcludes = existsSync(excludeFile)
  ? readFileSync(excludeFile, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
  : [];

export default defineConfig(
  globalIgnores([
    "dist/",
    ".astro/",
    "node_modules/",
    "assets-src/",
    "public/",
    "test-results/",
    "playwright-report/",
    ".lighthouseci/",
    ...localExcludes,
  ]),
  js.configs.recommended,
  tseslint.configs.recommended,
  eslintPluginAstro.configs.recommended,
  {
    files: ["**/*.cjs"],
    languageOptions: {
      sourceType: "commonjs",
      globals: { module: "readonly" },
    },
    rules: {
      // CommonJS files load their dependencies with require; there is no import to prefer.
      "@typescript-eslint/no-require-imports": "off",
    },
  },
);
