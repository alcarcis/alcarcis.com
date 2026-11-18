const minimumCategoryScore = 0.95;

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
