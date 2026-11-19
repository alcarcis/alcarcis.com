/** One observed part of the page: the hero, a linked section, or the footer. */
export interface ObservedPart {
  /** The position of the nav link this part belongs to; none for the hero. */
  readonly link: number | null;
  /** Whether the part crosses the reading line. */
  readonly crossing: boolean;
}

/**
 * Which nav link marks the section in view, from the observed parts in page order. The last
 * part crossing the reading line wins, so where two sections meet on the line the one coming
 * into view leads. While the hero, or nothing, crosses it, no link is marked.
 */
export function currentLink(parts: readonly ObservedPart[]): number | null {
  let current: number | null = null;
  for (const part of parts) {
    if (part.crossing) current = part.link;
  }
  return current;
}
