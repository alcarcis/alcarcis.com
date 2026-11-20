import { defineConfig } from "@playwright/test";

const isCI = Boolean(process.env["CI"]);

/*
 * Checks that the site's external links still answer. It calls third-party servers, so it stays
 * out of the quality gate, where an outage elsewhere would block merges, and runs on a schedule
 * instead (.github/workflows/live-links.yml). It only sends HTTP requests: no browser, no server.
 */
export default defineConfig({
  testDir: "./tests/live",
  forbidOnly: isCI,
  // A retry that passes means the URL is up, so a flaky result is not a failure here.
  retries: 2,
  timeout: 30_000,
  reporter: isCI
    ? [["github"], ["json", { outputFile: "live-results.json" }]]
    : [["list"]],
});
