import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveCommit } from "../../../scripts/build-info/commit.ts";
import {
  cloudflareSha,
  failing,
  gitHubSha,
  headSha,
  sources,
} from "./support.ts";

describe("resolveCommit", () => {
  it("prefers the commit Cloudflare Pages builds", () => {
    const { env, gitHead } = sources({
      env: { CF_PAGES_COMMIT_SHA: cloudflareSha, GITHUB_SHA: gitHubSha },
    });

    assert.equal(resolveCommit(env, gitHead), cloudflareSha);
  });

  it("falls back to the commit GitHub Actions builds", () => {
    const { env, gitHead } = sources({ env: { GITHUB_SHA: gitHubSha } });

    assert.equal(resolveCommit(env, gitHead), gitHubSha);
  });

  it("falls back to the checked-out commit", () => {
    const { env, gitHead } = sources();

    assert.equal(resolveCommit(env, gitHead), headSha);
  });

  it("skips empty and malformed values", () => {
    const { env, gitHead } = sources({
      env: { CF_PAGES_COMMIT_SHA: "", GITHUB_SHA: "not a commit" },
    });

    assert.equal(resolveCommit(env, gitHead), headSha);
  });

  it("keeps the whole hash, in lowercase", () => {
    const { env, gitHead } = sources({
      env: { GITHUB_SHA: gitHubSha.toUpperCase() },
    });

    assert.equal(resolveCommit(env, gitHead), gitHubSha);
  });

  it("accepts a short hash as it is named", () => {
    const { env, gitHead } = sources({ env: { GITHUB_SHA: "9A8B7C6" } });

    assert.equal(resolveCommit(env, gitHead), "9a8b7c6");
  });

  it("is unknown when git names no commit either", () => {
    const { env } = sources();

    assert.equal(
      resolveCommit(env, () => "fatal: not a commit\n"),
      null,
    );
  });

  it("passes git's failure on when no variable names the commit", () => {
    const { env } = sources();

    assert.throws(() => resolveCommit(env, failing("not a git repository")), {
      message: "not a git repository",
    });
  });

  it("does not run git when a variable names the commit", () => {
    const { env } = sources({ env: { GITHUB_SHA: gitHubSha } });

    assert.equal(resolveCommit(env, failing("git must not run")), gitHubSha);
  });
});
