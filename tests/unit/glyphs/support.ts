import {
  glyphAt,
  makeGrid,
  symLevel,
  resetLayers,
  sizeGrid,
  type Grid,
  type Ink,
} from "../../../src/scripts/glyphs/cells.ts";
import { drawSteps, setBand } from "../../../src/scripts/glyphs/scene.ts";
import { sceneEnd } from "../../../src/scripts/instrument/timeline.ts";

/** The scene draws into a grid's layers; only blitting them touches the canvas. */
const canvasStandIn = (): HTMLCanvasElement =>
  ({
    width: 0,
    height: 0,
    style: {},
    getContext: () => ({}),
  }) as unknown as HTMLCanvasElement;

/** A grid the size of the desktop scene box, 62 × 16 cells, with its free band in rows 2–13. */
export function sceneGrid(): Grid {
  const grid = makeGrid(canvasStandIn());
  if (!grid) throw new Error("The canvas stand-in has no 2D context.");
  sizeGrid(grid, 62, 16, 0x5ce7e);
  setBand(2, 13);
  return grid;
}

/** Scene times every 10 ms, from the first frame to the last. */
export const sceneTimes: readonly number[] = Array.from(
  { length: Math.round(sceneEnd * 100) + 1 },
  (_, step) => step / 100,
);

/** A glyph the scene drew in one cell; "" when the glyph has no atlas column. */
export interface DrawnGlyph {
  readonly glyph: string;
  readonly ink: Ink;
}

/** Draws the scene at time t and lists every glyph it put down, cell by cell. */
export function drawnGlyphs(grid: Grid, t: number): DrawnGlyph[] {
  resetLayers(grid);
  drawSteps(grid, t);
  const drawn: DrawnGlyph[] = [];
  grid.sA.forEach((alpha, cell) => {
    if (alpha > 0) {
      drawn.push({
        glyph: glyphAt(grid.sym[cell] ?? 0),
        ink: (grid.sInk[cell] ?? 0) as Ink,
      });
    }
  });
  return drawn;
}

/** A cell as the renderer shows it: its glyph, ink and alpha level (0–3); null when blank. */
export interface ShownCell {
  readonly glyph: string;
  readonly ink: Ink;
  readonly level: number;
}

/**
 * Draws the scene at time t and returns the rows that show any glyph, cropped to the columns
 * they use: the composition as a reader sees it, without the grain.
 */
export function shownCells(grid: Grid, t: number): (ShownCell | null)[][] {
  resetLayers(grid);
  drawSteps(grid, t);
  const rows: (ShownCell | null)[][] = [];
  for (let r = 0; r < grid.rows; r++) {
    const row: (ShownCell | null)[] = [];
    for (let c = 0; c < grid.cols; c++) {
      const cell = r * grid.cols + c;
      const level = symLevel(grid.sA[cell] ?? 0);
      const glyph = glyphAt(grid.sym[cell] ?? 0);
      row.push(
        level >= 0 && glyph
          ? { glyph, ink: (grid.sInk[cell] ?? 0) as Ink, level }
          : null,
      );
    }
    if (row.some(Boolean)) rows.push(row);
  }
  const used = (row: (ShownCell | null)[]): [number, number] => [
    row.findIndex(Boolean),
    row.findLastIndex(Boolean),
  ];
  const first = Math.min(...rows.map((row) => used(row)[0]));
  return rows.map((row) => row.slice(first, used(row)[1] + 1));
}

/** The same composition as lines of text, blanks as spaces. */
export function shownLines(grid: Grid, t: number): string[] {
  return shownCells(grid, t).map((row) =>
    row.map((cell) => cell?.glyph ?? " ").join(""),
  );
}
