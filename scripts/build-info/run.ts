import { execFileSync } from "node:child_process";

/** A process the build runs to read one of its facts, and how long it may run. */
export interface BuildCommand {
  /** How the build log names the command. */
  readonly name: string;
  readonly file: string;
  readonly args: readonly string[];
  readonly timeoutMs: number;
}

/** Runs a command to completion and returns what it printed; throws when it fails or stalls. */
export type CommandRunner = (command: BuildCommand) => string;

/*
 * Each limit leaves wide headroom over what the command takes on a developer machine, so a slow
 * or cold CI runner stays well inside it, while a stalled process holds up page rendering for
 * seconds instead of until the host's build limit. rev-parse reads a few files (about 25 ms);
 * listing loads every spec file through Playwright's TypeScript transform (about 1 s).
 */
const gitTimeoutMs = 10_000;
const testListTimeoutMs = 30_000;

export const gitHeadCommand: BuildCommand = {
  name: "git rev-parse HEAD",
  file: "git",
  args: ["rev-parse", "HEAD"],
  timeoutMs: gitTimeoutMs,
};

/** Listing needs only the @playwright/test package, not a browser, so it works on any host. */
export const testListCommand = (playwrightCli: string): BuildCommand => ({
  name: "playwright test --list",
  file: process.execPath,
  args: [playwrightCli, "test", "--list", "--reporter=json"],
  timeoutMs: testListTimeoutMs,
});

const inSeconds = (ms: number): string => `${ms / 1000} s`;

/** What a command that outlived its limit throws: which command, its limit, and what to do. */
export class CommandTimeoutError extends Error {
  constructor(command: BuildCommand) {
    super(
      `${command.name} did not finish within ${inSeconds(command.timeoutMs)} and was stopped; ` +
        "run it by hand to see why it stalls, or raise its limit in scripts/build-info/run.ts",
    );
    this.name = "CommandTimeoutError";
  }
}

const timedOut = (error: unknown): boolean =>
  error instanceof Error && "code" in error && error.code === "ETIMEDOUT";

/**
 * Runs build commands in `cwd`, each under its limit. A command that outlives it is killed with
 * SIGKILL, not asked to stop: execFileSync waits for the process to exit, and a stalled process
 * may never act on a polite signal.
 */
export const commandRunner =
  (cwd: string): CommandRunner =>
  (command) => {
    try {
      return execFileSync(command.file, command.args, {
        cwd,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        maxBuffer: 32 * 1024 * 1024,
        timeout: command.timeoutMs,
        killSignal: "SIGKILL",
      });
    } catch (error) {
      throw timedOut(error) ? new CommandTimeoutError(command) : error;
    }
  };
