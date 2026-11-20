/*
 * The scene's last frame: a workflow run whose three jobs have passed, one after another, and
 * whose deploy has reached production. The renderer ends on it, and the page shows it in text
 * before (and without) the renderer. Each line is a list of runs; each run has one ink.
 */

/** box: a job's box; name: job and environment names; link: the path the run took. */
export type FrameInk = "box" | "name" | "link" | "check";
export type FrameRun = readonly [FrameInk, string];

export const finalFrame: readonly (readonly FrameRun[])[] = [
  [["box", "┌───────┐  ┌──────┐  ┌────────┐"]],
  [
    ["box", "│"],
    ["check", "✓"],
    ["name", " build"],
    ["box", "├"],
    ["link", "──"],
    ["box", "┤"],
    ["check", "✓"],
    ["name", " test"],
    ["box", "├"],
    ["link", "──"],
    ["box", "┤"],
    ["check", "✓"],
    ["name", " deploy"],
    ["box", "│"],
  ],
  [
    ["box", "└───────┘  └──────┘  └───"],
    ["link", "┬"],
    ["box", "────┘"],
  ],
  [
    ["name", "production "],
    ["check", "✓"],
    ["name", " deployed "],
    ["link", "───┘"],
  ],
];
