/*
 * Counts the tests in the JSON report `playwright test --list --reporter=json` prints: every
 * spec's tests (one per project) across files and nested suites. Null whenever the report is
 * not a complete list, so the page never shows an invented number.
 */

type Json = Readonly<Record<string, unknown>>;

const isObject = (value: unknown): value is Json =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function countSpecs(specs: unknown): number | null {
  if (!Array.isArray(specs)) return null;
  let count = 0;
  for (const spec of specs) {
    if (!isObject(spec) || !Array.isArray(spec["tests"])) return null;
    count += spec["tests"].length;
  }
  return count;
}

function countSuites(suites: unknown): number | null {
  if (!Array.isArray(suites)) return null;
  let count = 0;
  for (const suite of suites) {
    if (!isObject(suite)) return null;
    const own = countSpecs(suite["specs"] ?? []);
    const nested = countSuites(suite["suites"] ?? []);
    if (own === null || nested === null) return null;
    count += own + nested;
  }
  return count;
}

export function countListedTests(reportJson: string): number | null {
  let report: unknown;
  try {
    report = JSON.parse(reportJson);
  } catch {
    return null;
  }
  if (!isObject(report)) return null;
  const errors = report["errors"] ?? [];
  if (!Array.isArray(errors) || errors.length > 0) return null;
  return countSuites(report["suites"]);
}
