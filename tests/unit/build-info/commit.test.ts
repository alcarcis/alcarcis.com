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

    assert.equal(resolveCommit(env, gitHead), "cf01234");
  });

  it("falls back to the commit GitHub Actions builds", () => {
    const { env, gitHead } = sources({ env: { GITHUB_SHA: gitHubSha } });

    assert.equal(resolveCommit(env, gitHead), "9a8b7c6");
  });

  it("falls back to the checked-out commit", () => {
    const { env, gitHead } = sources();

    assert.equal(resolveCommit(env, gitHead), headSha.slice(0, 7));
  });

  it("skips empty and malformed values", () => {
    const { env, gitHead } = sources({
      env: { CF_PAGES_COMMIT_SHA: "", GITHUB_SHA: "not a commit" },
    });

    assert.equal(resolveCommit(env, gitHead), headSha.slice(0, 7));
  });

  it("writes the short form in lowercase", () => {
    const { env, gitHead } = sources({
      env: { GITHUB_SHA: gitHubSha.toUpperCase() },
    });

    assert.equal(resolveCommit(env, gitHead), "9a8b7c6");
  });

  it("is unknown when no source names a commit", () => {
    const { env } = sources();

    assert.equal(resolveCommit(env, failing("not a git repository")), null);
  });
});
