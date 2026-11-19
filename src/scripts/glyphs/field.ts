/*
 * The page's ground: quiet, static grain on a fixed canvas, cleared around every line of text,
 * image and control, so it never draws over content.
 */
import { blit, ch, cw, quietRect, sizeGrid, type Grid } from "./cells.ts";

/** [x0, y0, x1, y1, hard] in document px. */
type QuietRect = [number, number, number, number, boolean];

const ZONES = "main > section, body > footer";
const BOXES = "img, svg, canvas, button, .button, [data-instrument]";
const SKIPPED_TEXT = ".visually-hidden, [data-instrument]";

let quiet: QuietRect[] = [];
const quietByZone = new WeakMap<Element, QuietRect[]>();

const rendered = (el: Element): boolean =>
  !el.checkVisibility || el.checkVisibility({ contentVisibilityAuto: true });

export function sizeField(g: Grid): void {
  sizeGrid(
    g,
    Math.ceil(window.innerWidth / cw),
    Math.ceil(window.innerHeight / ch),
    0x0650c33c,
  );
}

/* Every line of text and every image or control inside the page's sections clears the grain
   under it. A section content-visibility is skipping keeps its last known rectangles. */
export function measureQuiet(): void {
  const sx = window.scrollX;
  const sy = window.scrollY;
  const range = document.createRange();
  const all: QuietRect[] = [];
  for (const zone of document.querySelectorAll(ZONES)) {
    if (!rendered(zone)) {
      all.push(...(quietByZone.get(zone) ?? []));
      continue;
    }
    const mine: QuietRect[] = [];
    for (const el of zone.querySelectorAll(BOXES)) {
      const r = el.getBoundingClientRect();
      if (r.width && r.height)
        mine.push([r.left + sx, r.top + sy, r.right + sx, r.bottom + sy, true]);
    }
    const walker = document.createTreeWalker(zone, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.nodeValue?.trim() || node.parentElement?.closest(SKIPPED_TEXT))
        continue;
      range.selectNodeContents(node);
      for (const r of range.getClientRects()) {
        if (r.width && r.height) {
          mine.push([
            r.left + sx - 3,
            r.top + sy - 2,
            r.right + sx + 3,
            r.bottom + sy + 2,
            false,
          ]);
        }
      }
    }
    quietByZone.set(zone, mine);
    all.push(...mine);
  }
  quiet = all;
}

export function renderField(g: Grid): void {
  if (!g.N) return;
  const sx = window.scrollX;
  const sy = window.scrollY;
  g.mask.fill(1);
  for (const [x0, y0, x1, y1, hard] of quiet)
    quietRect(g, x0 - sx, y0 - sy, x1 - sx, y1 - sy, hard);
  blit(g);
}
