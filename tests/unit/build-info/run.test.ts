import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CommandTimeoutError,
  commandRunner,
} from "../../../scripts/build-info/run.ts";
import { nodeCommand, stalledCommand } from "./support.ts";

const run = commandRunner(process.cwd());

describe("commandRunner", () => {
  it("stops a command that outlives its limit and names the command and the limit", () => {
    assert.throws(() => run(stalledCommand), {
      name: "CommandTimeoutError",
      message:
        /^a stalled command did not finish within 0\.1 s and was stopped;/,
    });
  });

  it("returns what a command prints when it finishes within its limit", () => {
    assert.equal(run(nodeCommand("process.stdout.write('listed')")), "listed");
  });

  it("passes a command's own failure on as it is, not as a timeout", () => {
    assert.throws(
      () => run(nodeCommand("process.exit(3)")),
      (error) =>
        !(error instanceof CommandTimeoutError) &&
        (error as { status?: unknown }).status === 3,
    );
  });
});
