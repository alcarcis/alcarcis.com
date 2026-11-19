// The minimum lives in a module the build shares, so the instrument's BUDGET row states exactly
// what this enforces. Lighthouse CI loads this file with Node's require, which loads the
// TypeScript module natively (type stripping and require of ES modules).
const { minimumCategoryScore } = require("./scripts/quality-budget.ts");

const budgetedCategories = [
  "performance",
  "accessibility",
  "best-practices",
  "seo",
];

module.exports = {
  ci: {
    collect: {
      staticDistDir: "./dist",
      url: ["http://localhost/", "http://localhost/es/"],
      numberOfRuns: 3,
    },
    assert: {
      assertions: Object.fromEntries(
        budgetedCategories.map((category) => [
          `categories:${category}`,
          [
            "error",
            {
              minScore: minimumCategoryScore,
              aggregationMethod: "median-run",
            },
          ],
        ]),
      ),
    },
    upload: {
      target: "filesystem",
      outputDir: ".lighthouseci/reports",
    },
  },
};
