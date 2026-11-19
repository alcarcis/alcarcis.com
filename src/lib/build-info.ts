import { readBuildInfo, type BuildInfo } from "../../scripts/build-info.ts";

let cached: BuildInfo | undefined;

/** This build's facts, read once: every page shows the same commit, date and test count. */
export function buildInfo(): BuildInfo {
  cached ??= readBuildInfo(process.cwd());
  return cached;
}
