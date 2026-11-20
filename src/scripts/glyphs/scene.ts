/*
 * The hero instrument's scene: what QA does at each of the five stages, drawn as a pure
 * function of the run's scene time. Each step draws its composition at local time tau
 * (seconds since its step began) with overall alpha a, complete by the end of its step.
 */
import { beats, fixDelay, stepStart } from "../instrument/timeline.ts";
import {
  CHECK_GLYPHS,
  INK,
  ch,
  clamp,
  cw,
  easeOut,
  hash,
  lerp,
  putSym,
  smoothstep,
  type Grid,
  type Ink,
} from "./cells.ts";

/** The free rows between the scene's label and its caption. */
let band = [2, 12] as [number, number];
let reduced = false;

export function setBand(top: number, bottom: number): void {
  band = [top, bottom];
}

export function setReducedMotion(on: boolean): void {
  reduced = on;
}

/* Types s from cell (c, r), its first n characters; spaces leave the cell as it is. */
function type(
  g: Grid,
  c: number,
  r: number,
  s: string,
  a: number,
  ink: Ink,
  n = s.length,
): void {
  for (let j = 0; j < Math.min(n, s.length); j++) {
    const glyph = s[j] ?? " ";
    if (glyph !== " ") putSym(g, c + j, r, glyph, a, ink);
  }
}

/* How many of s's characters are typed at local time tau, typing from t0 for d seconds. */
const typed = (tau: number, t0: number, d: number, s: string): number =>
  Math.floor(clamp((tau - t0) / d, 0, 1) * s.length);

/* A box; its sides can be junctions, where a line leaves it. */
function box(
  g: Grid,
  c: number,
  r: number,
  w: number,
  h: number,
  a: number,
  ink: Ink,
  [left, right] = ["│", "│"],
): void {
  for (let j = 1; j < w - 1; j++) {
    putSym(g, c + j, r, "─", a, ink);
    putSym(g, c + j, r + h - 1, "─", a, ink);
  }
  for (let j = 1; j < h - 1; j++) {
    putSym(g, c, r + j, left, a, ink);
    putSym(g, c + w - 1, r + j, right, a, ink);
  }
  putSym(g, c, r, "┌", a, ink);
  putSym(g, c + w - 1, r, "┐", a, ink);
  putSym(g, c, r + h - 1, "└", a, ink);
  putSym(g, c + w - 1, r + h - 1, "┘", a, ink);
}

/* A W x H composition centred in the free band; while it shows, it sits on clean ground. */
function place(g: Grid, W: number, H: number, a: number): [number, number] {
  const x = Math.floor((g.cols - W) / 2);
  const y = band[0] + Math.max(0, Math.floor((band[1] - band[0] + 1 - H) / 2));
  if (a > 0.3) {
    for (let r = Math.max(0, y - 1); r < Math.min(g.rows, y + H + 1); r++) {
      for (let c = Math.max(0, x - 2); c < Math.min(g.cols, x + W + 2); c++) {
        g.val[r * g.cols + c] = 0;
      }
    }
  }
  return [x, y];
}

/* An original pixel insect seen from above; two frames alternate the legs in a tripod gait. */
const BUG = [
  [" \\   / ", "  (@)  ", "\\(%#%)\\", "/(###)/", " \\(#)\\ "],
  [" \\   / ", "  (@)  ", "/(%#%)/", "\\(###)\\", " /(#)/ "],
];

interface Bug {
  c0: number;
  r0: number;
  leg: number;
}

function drawBug(g: Grid, b: Bug, a: number, gone: number): void {
  const sprite = BUG[b.leg] ?? [];
  sprite.forEach((line, r) => {
    for (let c = 0; c < 7; c++) {
      const s = line[c] ?? " ";
      if (s === " " || (gone > 0 && hash(r * 7 + c + 11) < gone)) continue;
      putSym(g, b.c0 + c, b.r0 + r, s, a, INK.TEXT);
    }
  });
}

/* Framing brackets one cell outside the sprite, and the defect's tag above them, typed in. */
function drawDefect(
  g: Grid,
  b: Bug,
  a: number,
  chars: number,
  tag: string,
): void {
  const L = b.c0 - 2;
  const R = b.c0 + 8;
  const T = b.r0 - 1;
  const B = b.r0 + 5;
  const corners: [number, number, string][] = [
    [L, T, "┌"],
    [L + 1, T, "─"],
    [R - 1, T, "─"],
    [R, T, "┐"],
    [L, B, "└"],
    [L + 1, B, "─"],
    [R - 1, B, "─"],
    [R, B, "┘"],
  ];
  for (const [c, r, s] of corners) putSym(g, c, r, s, a, INK.MARK);
  for (let r = T + 1; r < B; r++) {
    putSym(g, L, r, "│", a, INK.MARK);
    putSym(g, R, r, "│", a, INK.MARK);
  }
  type(g, R - tag.length + 1, T - 1, tag, a, INK.MARK, chars);
}

interface Lens {
  x: number;
  y: number;
  R: number;
  m: number;
  k: number;
  a: number;
}

/* The magnifying glass: inside the ring the field is sampled at 1/m scale and drawn at higher
   ink (gain k for symbols); ring and handle are glyphs on top. */
function layerLens(g: Grid, L: Lens): void {
  const val = g.val.slice();
  const ink = g.ink.slice();
  const sym = g.sym.slice();
  const sA = g.sA.slice();
  const sInk = g.sInk.slice();
  const lc = L.x / cw;
  const lr = L.y / ch;
  const Rc = L.R / cw;
  const Rr = L.R / ch;
  for (
    let r = Math.max(0, Math.floor(lr - Rr));
    r <= Math.min(g.rows - 1, Math.ceil(lr + Rr));
    r++
  ) {
    for (
      let c = Math.max(0, Math.floor(lc - Rc));
      c <= Math.min(g.cols - 1, Math.ceil(lc + Rc));
      c++
    ) {
      const dx = (c + 0.5 - lc) / Rc;
      const dy = (r + 0.5 - lr) / Rr;
      if (dx * dx + dy * dy > 0.84) continue;
      const sc = Math.floor(lc + (c + 0.5 - lc) / L.m);
      const sr = Math.floor(lr + (r + 0.5 - lr) / L.m);
      if (sc < 0 || sr < 0 || sc >= g.cols || sr >= g.rows) continue;
      const i = r * g.cols + c;
      const si = sr * g.cols + sc;
      const s = sym[si] ?? 0;
      g.val[i] = Math.min(0.62, (val[si] ?? 0) * (1 + 0.7 * L.a));
      g.ink[i] = ink[si] ?? 0;
      g.sym[i] = s;
      g.sA[i] = s ? Math.min(1, (sA[si] ?? 0) * (1 + L.k * L.a)) : 0;
      g.sInk[i] = sInk[si] ?? 0;
    }
  }
}

/* The ring is rasterized row by row, one glyph per side, the way ASCII art draws a circle; the
   top and bottom rows close with dashes. The handle runs out at 45° to the lower left. */
function drawLensFrame(g: Grid, L: Lens): void {
  const a = L.a * 0.86;
  let first = true;
  for (
    let r = Math.floor((L.y - L.R) / ch);
    r <= Math.floor((L.y + L.R) / ch);
    r++
  ) {
    const dy = ((r + 0.5) * ch - L.y) / L.R;
    if (Math.abs(dy) >= 1) continue;
    const dx = Math.sqrt(1 - dy * dy) * L.R;
    const cl = Math.floor((L.x - dx) / cw);
    const cr = Math.floor((L.x + dx) / cw);
    const last = ((r + 1.5) * ch - L.y) / L.R >= 1;
    const side = Math.abs(dy) < 0.45;
    putSym(g, cl, r, side ? "|" : dy < 0 ? "/" : "\\", a, INK.MARK);
    putSym(g, cr, r, side ? "|" : dy < 0 ? "\\" : "/", a, INK.MARK);
    if (first || last)
      for (let c = cl + 1; c < cr; c++) putSym(g, c, r, "-", a, INK.MARK);
    first = false;
  }
  const h = L.R * Math.SQRT1_2 + 8;
  for (let j = 0; j < 3; j++) {
    const c = Math.floor((L.x - h - j * ch) / cw);
    const r = Math.floor((L.y + h + j * ch) / ch);
    putSym(g, c, r, "/", L.a, INK.MARK);
    putSym(g, c - 1, r, "/", L.a, INK.MARK);
  }
}

/* 01 requirements: an acceptance-criteria card; each line is typed, then its box ticks. */
const CRITERIA = [
  "Given a saved cart",
  "When the user pays",
  "Then an order exists",
];
function stepCriteria(g: Grid, tau: number, a: number): void {
  const f = a * smoothstep(0, 0.2, tau);
  const [x, y] = place(g, 30, 5, f);
  box(g, x, y, 30, 5, f * 0.62, INK.MARK);
  g.sym[y * g.cols + x + 2] = 0;
  g.sym[y * g.cols + x + 8] = 0;
  type(g, x + 3, y, "AC-01", f, INK.MARK);
  CRITERIA.forEach((s, j) => {
    const t0 = 0.1 + j * 0.12;
    if (tau < t0) return;
    type(g, x + 2, y + 1 + j, "[ ]", a * 0.62, INK.TEXT);
    type(g, x + 6, y + 1 + j, s, a * 0.82, INK.TEXT, typed(tau, t0, 0.25, s));
    const tick = 0.6 + j * 0.25;
    if (tau >= tick)
      putSym(
        g,
        x + 3,
        y + 1 + j,
        CHECK_GLYPHS.tick,
        a * smoothstep(tick, tick + 0.08, tau),
        INK.CHECK,
      );
  });
}

/* 02 design: the lens sweeps a wireframe, settles on one input and an edge case is noted. */
function stepDesign(g: Grid, tau: number, a: number): void {
  const f = a * smoothstep(0, 0.2, tau);
  const [x, y] = place(g, 34, 7, f);
  const w = f * 0.62;
  box(g, x, y, 16, 7, w, INK.TEXT);
  type(g, x + 2, y + 1, "============", f * 0.42, INK.TEXT);
  box(g, x + 2, y + 2, 6, 2, w, INK.TEXT);
  const hit = smoothstep(0.68, 0.76, tau) * a;
  box(g, x + 8, y + 2, 6, 2, Math.max(w, hit), hit > 0.3 ? INK.MARK : INK.TEXT);
  box(g, x + 2, y + 4, 12, 2, w, INK.TEXT);
  if (tau > 0.72) {
    type(
      g,
      x + 16,
      y + 2,
      "──",
      a * 0.82,
      INK.MARK,
      typed(tau, 0.72, 0.04, "──"),
    );
    type(
      g,
      x + 19,
      y + 2,
      "edge case added",
      a,
      INK.MARK,
      typed(tau, 0.76, 0.2, "edge case added"),
    );
  }
  // The lens sweeps the screen left to right, settles on the right-hand input, holds while the
  // note is written, then lifts.
  const sweep = easeOut(clamp((tau - 0.1) / 0.4, 0, 1));
  const settle = smoothstep(0.5, 0.7, tau);
  const lens: Lens = {
    x: lerp(lerp(x - 1, x + 15, sweep), x + 11, settle) * cw,
    y: lerp(y + 3.5, y + 3, settle) * ch,
    R: Math.min(30, (band[1] - band[0] + 1) * ch * 0.25),
    m: 1,
    k: 1.6,
    a: a * smoothstep(0.05, 0.2, tau) * (1 - smoothstep(1.05, 1.25, tau)),
  };
  if (lens.a > 0.01) {
    layerLens(g, lens);
    drawLensFrame(g, lens);
  }
}

/* 03 code: two columns typing in pairs, a line of code and its test; each test then passes. */
const PAIRS = [
  ["total()", "it('sums items')"],
  ["pay()", "it('charges once')"],
  ["ship()", "it('ships paid')"],
] as const;
function stepCode(g: Grid, tau: number, a: number): void {
  const f = a * smoothstep(0, 0.15, tau);
  const [x, y] = place(g, 35, 5, f);
  type(g, x, y, "src/cart.ts", f * 0.82, INK.MARK);
  type(g, x + 15, y, "cart.spec.ts", f * 0.82, INK.MARK);
  for (let c = 0; c < 35; c++) putSym(g, x + c, y + 1, "─", f * 0.42, INK.TEXT);
  for (let r = 0; r < 5; r++)
    if (r !== 1) putSym(g, x + 13, y + r, "│", f * 0.42, INK.TEXT);
  PAIRS.forEach(([code, test], j) => {
    const t0 = 0.1 + j * 0.38;
    type(g, x, y + 2 + j, code, a * 0.82, INK.TEXT, typed(tau, t0, 0.12, code));
    type(
      g,
      x + 15,
      y + 2 + j,
      test,
      a * 0.62,
      INK.TEXT,
      typed(tau, t0 + 0.12, 0.14, test),
    );
    const tick = t0 + 0.28;
    if (tau >= tick)
      putSym(
        g,
        x + 34,
        y + 2 + j,
        CHECK_GLYPHS.tick,
        a * smoothstep(tick, tick + 0.06, tau),
        INK.CHECK,
      );
  });
}

/* 04 ci/cd: a commit carrying the bug rides the pipeline to the gate, which stays shut:
   BLOCKED, and the bug is framed and tagged DEF-01. Then the fix merges, fixDelay into the step
   (the page switches the caption on the same clock): BLOCKED and the tag fade, the bug
   dissolves, the gate opens and the commit passes, each timed from that moment. */
function stepGate(g: Grid, tau: number, a: number): void {
  const W = 36;
  const f = a * smoothstep(0, 0.15, tau);
  const sinceFix = tau - fixDelay;
  const [x, y] = place(g, W, 8, f);
  const line = y + 4;
  const gx = x + 22;
  for (let c = 0; c < W; c++) putSym(g, x + c, line, "─", f * 0.62, INK.TEXT);
  // Earlier commits that already passed drift on toward production.
  const drift = Math.round(easeOut(clamp(tau / 0.9, 0, 1)) * 4);
  for (let j = 0; j < 2; j++) {
    const c = gx + 3 + j * 5 + drift;
    putSym(g, c, line, CHECK_GLYPHS.commit, f * 0.9, INK.CHECK);
  }
  const open = smoothstep(0.4, 0.55, sinceFix);
  for (let r = y + 1; r <= y + 7; r++) {
    if (open > 0.5 && Math.abs(r - line) <= 1) continue;
    putSym(g, gx, r, CHECK_GLYPHS.gate, f, open > 0.5 ? INK.CHECK : INK.MARK);
  }
  const arrive = easeOut(clamp((tau - 0.1) / 0.6, 0, 1));
  const bug: Bug = {
    c0: Math.round(lerp(x - 10, gx - 9, arrive)),
    r0: line - 2,
    leg: arrive < 1 && !reduced ? Math.floor(tau * 9) & 1 : 0,
  };
  const gone = smoothstep(0.05, 0.4, sinceFix);
  const pass = easeOut(clamp((sinceFix - 0.55) / 0.4, 0, 1));
  const cc = Math.round(lerp(bug.c0 + 3, x + W - 2, pass));
  putSym(
    g,
    cc,
    line,
    CHECK_GLYPHS.commit,
    a * (gone < 1 ? 0.8 : 1),
    cc > gx ? INK.CHECK : INK.TEXT,
  );
  if (gone < 1) drawBug(g, bug, a * 0.85, gone);
  const detected =
    smoothstep(0.78, 0.92, tau) * (1 - smoothstep(0.3, 0.5, sinceFix));
  if (detected > 0.01) {
    drawDefect(
      g,
      bug,
      detected * a,
      Math.floor(clamp((tau - 0.9) / 0.18, 0, 1) * 6),
      "DEF-01",
    );
  }
  if (tau > 0.72) {
    type(
      g,
      gx + 2,
      y + 2,
      "BLOCKED",
      a * (1 - smoothstep(0.25, 0.45, sinceFix)),
      INK.MARK,
      typed(tau, 0.72, 0.15, "BLOCKED"),
    );
  }
}

/* 05 production: a workflow run. Its jobs run one at a time, each once the one before it has
   passed and the link between them has lit; the run's path then leaves the deploy job and
   reaches production, which is marked deployed. It ends on final-frame.ts's frame. */
const JOBS = ["build", "test", "deploy"] as const;
const SPINNER = "-\\|/";
const PENDING = "·";
/** Seconds into the step at which job j starts and passes. */
const jobStart = (j: number): number => 0.25 + j * 0.5;
const jobDone = (j: number): number => jobStart(j) + 0.4;
/** The path lights from the last job's pass; production is deployed once it arrives. */
const deployAt = jobDone(JOBS.length - 1) + 0.2;
/* The path from the deploy job down to production and back along its line, in drawing order. */
const DEPLOY_PATH: readonly [number, number, string][] = [
  [25, 2, "┬"],
  [25, 3, "┘"],
  [24, 3, "─"],
  [23, 3, "─"],
  [22, 3, "─"],
];
function stepProduction(g: Grid, tau: number, a: number): void {
  const f = a * smoothstep(0, 0.2, tau);
  const [x, y] = place(g, 31, 4, f);
  // A status cell: pending, a spinner while its job runs, then the check.
  const status = (c: number, r: number, start: number, done: number): void => {
    if (tau >= done) {
      const tick = a * smoothstep(done, done + 0.08, tau);
      putSym(g, c, r, CHECK_GLYPHS.tick, tick, INK.CHECK);
    } else if (tau >= start) {
      const turn = reduced ? 0 : Math.floor((tau - start) * 12) % 4;
      putSym(g, c, r, SPINNER[turn] ?? "-", a, INK.MARK);
    } else {
      putSym(g, c, r, PENDING, f * 0.62, INK.TEXT);
    }
  };
  let c = x;
  JOBS.forEach((job, j) => {
    const w = job.length + 4;
    const running = tau >= jobStart(j) && tau < jobDone(j);
    const sides: [string, string] = [
      j > 0 ? "┤" : "│",
      j < JOBS.length - 1 ? "├" : "│",
    ];
    const ink = running ? INK.MARK : INK.TEXT;
    box(g, c, y, w, 3, running ? a : f * 0.62, ink, sides);
    status(c + 1, y + 1, jobStart(j), jobDone(j));
    const named = f * (tau >= jobStart(j) ? 0.82 : 0.62);
    type(g, c + 3, y + 1, job, named, INK.TEXT);
    if (j === JOBS.length - 1) return;
    const lit = typed(tau, jobDone(j), 0.1, "──");
    for (let k = 0; k < 2; k++) {
      if (k < lit) putSym(g, c + w + k, y + 1, "─", a * 0.82, INK.MARK);
      else putSym(g, c + w + k, y + 1, "─", f * 0.42, INK.TEXT);
    }
    c += w + 2;
  });
  const pathFrom = jobDone(JOBS.length - 1);
  const along = clamp((tau - pathFrom) / (deployAt - pathFrom), 0, 1);
  const reached = Math.floor(along * DEPLOY_PATH.length);
  DEPLOY_PATH.slice(0, reached).forEach(([pc, pr, s]) =>
    putSym(g, x + pc, y + pr, s, a * 0.82, INK.MARK),
  );
  const deployed = f * (tau >= deployAt ? 0.82 : 0.62);
  type(g, x, y + 3, "production", deployed, INK.TEXT);
  status(x + 11, y + 3, deployAt, deployAt);
  const shown = typed(tau, deployAt + 0.05, 0.1, "deployed");
  type(g, x + 13, y + 3, "deployed", a * 0.82, INK.TEXT, shown);
}

const STEPS = [stepCriteria, stepDesign, stepCode, stepGate, stepProduction];

/* The scene at run time t: the step whose time it is, with the one before fading out over its
   first 0.2 s. Step k ends at beats[k]; after the last, it holds. */
export function drawSteps(g: Grid, t: number): void {
  let k = 0;
  while (k < STEPS.length - 1 && t >= (beats[k] ?? 0)) k++;
  const t0 = stepStart(k);
  if (k && t - t0 < 0.2)
    STEPS[k - 1]?.(g, t0 - stepStart(k - 1), 1 - (t - t0) / 0.2);
  STEPS[k]?.(g, Math.min(t, beats[k] ?? t) - t0, 1);
}
