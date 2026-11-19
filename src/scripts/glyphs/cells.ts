/*
 * One monospace cell grid, tone made of glyph density. Glyphs are pre-rendered once per theme
 * into an atlas; each grid keeps per-cell layers and redraws only the cells that changed.
 */

const RAMP = " .:-=+*#%@";
/**
 * What the scene draws in the pass ink: a tick on a criterion or a test, a commit, the gate and
 * the run's verdict. The atlas holds exactly these glyphs in that ink.
 */
export const CHECK_GLYPHS = {
  tick: "✓",
  commit: "●",
  gate: "║",
  verdict: "PASSED",
} as const;
const checkGlyphs = [...new Set(Object.values(CHECK_GLYPHS).join(""))].join("");
/* The scene's glyphs: drawing symbols, the characters its notes are typed in, and the pass
   ink's. Geist Mono has no '✓' or '●'; the canvas draws them from the next font in the stack,
   clipped to a cell. */
const SYM = [
  ...new Set(
    "\\/|()@#%┌┐└┘│─║●✓_~'[].,-=:abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789" +
      checkGlyphs,
  ),
];
const SYM0 = RAMP.length;
const SYM_IDX = new Map(SYM.map((s, k) => [s, SYM0 + k]));
const SYM_ALPHA = [0.42, 0.62, 0.82, 1];
const CELL_W = 9;

/** Grain; text (the bug, notes, code); marks (frames, the lens, tags, the gate); passes. */
export const INK = { GRAIN: 0, TEXT: 1, MARK: 2, CHECK: 3 } as const;
export type Ink = (typeof INK)[keyof typeof INK];

type Theme = "light" | "dark";
/* Which token inks each layer in each theme, and the ramp's density alphas. */
const THEMES: Record<Theme, { inks: string[]; alpha: number[] }> = {
  dark: {
    inks: ["--link", "--text", "--link", "--pass"],
    alpha: [0, 0.2, 0.28, 0.36, 0.46, 0.58, 0.7, 0.82, 0.92, 1],
  },
  light: {
    inks: ["--text", "--text", "--link", "--pass"],
    alpha: [0, 0.13, 0.18, 0.26, 0.36, 0.48, 0.62, 0.76, 0.88, 1],
  },
};
/* Only the symbols each ink draws: grain none; text and marks every glyph; passes their own. */
const SYM_INK = ["", SYM.join(""), SYM.join(""), checkGlyphs];

/** The glyph an atlas symbol index stands for; "" for none. */
export const glyphAt = (sym: number): string => SYM[sym - SYM0] ?? "";

/** Whether the atlas holds glyph s in the given ink. */
export const inAtlas = (ink: Ink, s: string): boolean =>
  s !== "" && (SYM_INK[ink] ?? "").includes(s);

export const clamp = (v: number, a: number, b: number): number =>
  v < a ? a : v > b ? b : v;
export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * t;
export const smoothstep = (a: number, b: number, x: number): number => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
export const easeOut = (t: number): number => 1 - (1 - t) ** 3;
export const hash = (n: number): number => {
  const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
};

function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Read when asked, not at load, so the grid and the scene also run outside a page. */
const rootStyle = (): CSSStyleDeclaration =>
  getComputedStyle(document.documentElement);

export const currentTheme = (): Theme =>
  rootStyle().colorScheme === "dark" ? "dark" : "light";

const token = (name: string): string =>
  rootStyle().getPropertyValue(name).trim();

/* ---------- cell metrics and the shared atlas ---------- */

let font = "monospace";
let fontPx = 15;
let cellH = 16;
let dpr = 1;
let cwD = 9;
let chD = 16;
/** Cell width and height in CSS px. */
export let cw = 9;
export let ch = 16;
let atlas: HTMLCanvasElement | null = null;

export function measureFont(): void {
  font = token("--font-mono") || "monospace";
  const m = document.createElement("canvas").getContext("2d");
  if (!m) return;
  m.font = `400 100px ${font}`;
  const advance = m.measureText("0").width / 100;
  fontPx = CELL_W / (advance > 0.3 && advance < 1 ? advance : 0.6);
  cellH = Math.round(fontPx * 1.07);
}

/** Recomputes the device cell size; true when the pixel ratio changed. */
export function measureCells(): boolean {
  const before = dpr;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  cwD = Math.max(2, Math.round(CELL_W * dpr));
  chD = Math.max(2, Math.round(cellH * dpr));
  cw = cwD / dpr;
  ch = chD / dpr;
  return dpr !== before;
}

/* Ramp glyphs pre-rendered once per ink at their density alpha; symbols at four levels. */
export function buildAtlas(): void {
  const theme = THEMES[currentTheme()];
  const inks = theme.inks.map(token);
  const a = document.createElement("canvas");
  a.width = (SYM0 + SYM.length) * cwD;
  a.height = 20 * chD;
  const g = a.getContext("2d");
  if (!g) return;
  g.font = `400 ${fontPx * dpr}px ${font}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  const glyph = (
    s: string,
    gx: number,
    row: number,
    alpha: number,
    ink: string,
  ) => {
    g.save();
    g.beginPath();
    g.rect(gx * cwD, row * chD, cwD, chD);
    g.clip();
    g.globalAlpha = alpha;
    g.fillStyle = ink;
    g.fillText(s, gx * cwD + cwD / 2, row * chD + chD / 2);
    g.restore();
  };
  inks.forEach((ink, k) => {
    for (let j = 1; j < SYM0; j++)
      glyph(RAMP[j] ?? "", j, k, theme.alpha[j] ?? 1, ink);
    for (const s of SYM_INK[k] ?? "") {
      SYM_ALPHA.forEach((alpha, l) =>
        glyph(s, SYM_IDX.get(s) ?? 0, 4 + k * 4 + l, alpha, ink),
      );
    }
  });
  atlas = a;
}

/* ---------- grids: per-cell layers, drawing only the cells that changed ---------- */

export interface Grid {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  cols: number;
  rows: number;
  N: number;
  full: boolean;
  /** Ramp brightness per cell, 0..1, and its ink. */
  val: Float32Array;
  ink: Uint8Array;
  /** Symbol per cell (atlas column, 0 = none), its alpha and ink. */
  sym: Uint8Array;
  sA: Float32Array;
  sInk: Uint8Array;
  /** Glyph | ink << 7 | level << 9: this frame, and the last one drawn. */
  code: Uint16Array;
  prev: Uint16Array;
  /** 1 = untouched, 0 = clear ground. */
  mask: Float32Array;
  grain: Float32Array;
}

export function makeGrid(canvas: HTMLCanvasElement): Grid | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const empty = new Float32Array(0);
  return {
    canvas,
    ctx,
    cols: 0,
    rows: 0,
    N: 0,
    full: true,
    val: empty,
    ink: new Uint8Array(0),
    sym: new Uint8Array(0),
    sA: empty,
    sInk: new Uint8Array(0),
    code: new Uint16Array(0),
    prev: new Uint16Array(0),
    mask: empty,
    grain: empty,
  };
}

export function sizeGrid(
  g: Grid,
  cols: number,
  rows: number,
  seed: number,
): void {
  g.cols = Math.max(1, cols);
  g.rows = Math.max(1, rows);
  const N = (g.N = g.cols * g.rows);
  g.canvas.width = g.cols * cwD;
  g.canvas.height = g.rows * chD;
  g.canvas.style.width = `${(g.cols * cwD) / dpr}px`;
  g.canvas.style.height = `${(g.rows * chD) / dpr}px`;
  g.val = new Float32Array(N);
  g.ink = new Uint8Array(N);
  g.sym = new Uint8Array(N);
  g.sA = new Float32Array(N);
  g.sInk = new Uint8Array(N);
  g.code = new Uint16Array(N);
  g.prev = new Uint16Array(N);
  g.mask = new Float32Array(N).fill(1);
  g.full = true;
  // Paper texture: never above ':' so it reads as grain, not content. Fixed per layout.
  const rnd = seeded(seed);
  g.grain = new Float32Array(N);
  for (let r = 0, i = 0; r < g.rows; r++) {
    for (let c = 0; c < g.cols; c++, i++) {
      const f =
        0.5 +
        0.28 * Math.sin(c * 0.071) * Math.cos(r * 0.17) +
        0.14 * Math.sin((c * 0.5 + r) * 0.06) +
        0.08 * Math.sin(c * 0.023 - r * 0.051);
      const v = f * 0.62 + rnd() * 0.3;
      g.grain[i] = v > 0.76 ? 0.25 : v > 0.54 ? 0.15 : 0;
    }
  }
  g.val.set(g.grain);
}

/** Takes a grid back to before it was sized: an empty canvas, and nothing for it to draw. */
export function unsizeGrid(g: Grid): void {
  g.N = 0;
  g.canvas.width = 0;
  g.canvas.height = 0;
  g.canvas.style.width = "";
  g.canvas.style.height = "";
}

export function resetLayers(g: Grid): void {
  g.val.set(g.grain);
  g.ink.fill(INK.GRAIN);
  g.sym.fill(0);
  g.sA.fill(0);
}

export function putSym(
  g: Grid,
  c: number,
  r: number,
  s: string,
  a: number,
  ink: Ink,
): void {
  if (c < 0 || r < 0 || c >= g.cols || r >= g.rows || a <= 0.01) return;
  const i = r * g.cols + c;
  if (a >= (g.sA[i] ?? 0)) {
    g.sA[i] = a;
    g.sym[i] = SYM_IDX.get(s) ?? 0;
    g.sInk[i] = ink;
  }
}

export function blit(g: Grid): void {
  if (!atlas || !g.N) return;
  const { N, mask, sym, sA, sInk, val, ink, code, prev } = g;
  let changed = 0;
  for (let i = 0; i < N; i++) {
    const m = mask[i] ?? 1;
    let cd = 0;
    const s = sym[i] ?? 0;
    if (s) {
      const a = (sA[i] ?? 0) * m;
      const l =
        a >= 0.95 ? 3 : a >= 0.74 ? 2 : a >= 0.54 ? 1 : a >= 0.3 ? 0 : -1;
      if (l >= 0) cd = s | ((sInk[i] ?? 0) << 7) | (l << 9);
    }
    if (!cd) {
      const v = Math.min(9, ((val[i] ?? 0) * m * 10) | 0);
      if (v) cd = v | ((ink[i] ?? 0) << 7);
    }
    code[i] = cd;
    if (cd !== prev[i]) changed++;
  }
  if (!changed && !g.full) return;
  const ctx = g.ctx;
  const full = g.full || changed > N * 0.3;
  if (full) ctx.clearRect(0, 0, g.canvas.width, g.canvas.height);
  for (let r = 0, i = 0; r < g.rows; r++) {
    const y = r * chD;
    for (let c = 0; c < g.cols; c++, i++) {
      const cd = code[i] ?? 0;
      if (!full) {
        if (cd === prev[i]) continue;
        ctx.clearRect(c * cwD, y, cwD, chD);
      }
      if (cd) {
        const gl = cd & 127;
        const k = (cd >> 7) & 3;
        const row = gl < SYM0 ? k : 4 + k * 4 + (cd >> 9);
        ctx.drawImage(
          atlas,
          gl * cwD,
          row * chD,
          cwD,
          chD,
          c * cwD,
          y,
          cwD,
          chD,
        );
      }
    }
  }
  prev.set(code);
  g.full = false;
}

/** Clears the cells under a rectangle in the grid's own px; text gets a soft rim. */
export function quietRect(
  g: Grid,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  hard: boolean,
): void {
  const rim = hard ? 0 : 1;
  const c0 = Math.floor(x0 / cw) - rim;
  const c1 = Math.ceil(x1 / cw) - 1 + rim;
  const r0 = Math.floor(y0 / ch) - rim;
  const r1 = Math.ceil(y1 / ch) - 1 + rim;
  if (r1 < 0 || r0 >= g.rows || c1 < 0 || c0 >= g.cols) return;
  for (let r = Math.max(0, r0); r <= Math.min(g.rows - 1, r1); r++) {
    const edgeRow = r === r0 || r === r1;
    for (let c = Math.max(0, c0); c <= Math.min(g.cols - 1, c1); c++) {
      const v = !hard && (edgeRow || c === c0 || c === c1) ? 0.5 : 0;
      const i = r * g.cols + c;
      if (v < (g.mask[i] ?? 1)) g.mask[i] = v;
    }
  }
}
