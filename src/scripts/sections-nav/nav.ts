/*
 * The sections nav on the client: it marks the link of the section in view, and it completes
 * the menu that holds the links below 1200 px.
 *
 * The menu is a native popover that its button opens without script; the browser closes it on
 * Escape or a tap outside and returns focus to the button. Script adds what the platform leaves
 * to the page: the button's expanded state, closing the menu once a link is activated, and
 * closing it when the window widens into the inline layout, where the links show in the bar.
 *
 * The mark reads no layout. An IntersectionObserver reports which parts of the page cross a
 * reading line 40% down the viewport: the hero (no link), each linked section, and the footer,
 * which belongs to the last section, so Contact stays marked at the end of the page.
 */
import { currentLink, type ObservedPart } from "./current";

/** A thin band 40% down the viewport: the line a part must cross to count as in view. */
const readingLine = "-40% 0px -59% 0px";

const inlineLayout = matchMedia("(width >= 75em)");

function wireMenu(menu: HTMLElement, button: HTMLElement): void {
  if (!("hidePopover" in menu)) return;
  const isOpen = (): boolean => menu.matches(":popover-open");
  const close = (): void => {
    if (isOpen()) menu.hidePopover();
  };

  button.setAttribute("aria-expanded", String(isOpen()));
  menu.addEventListener("toggle", () => {
    button.setAttribute("aria-expanded", String(isOpen()));
  });
  menu.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) close();
  });
  inlineLayout.addEventListener("change", () => {
    if (inlineLayout.matches) close();
  });
}

interface Part {
  readonly element: Element;
  readonly link: number | null;
}

function wireMark(links: readonly HTMLAnchorElement[]): void {
  if (!("IntersectionObserver" in window)) return;
  const hero = document.getElementById("top");
  const footer = document.querySelector("body > footer");
  const parts: Part[] = [];
  if (hero) parts.push({ element: hero, link: null });
  links.forEach((link, position) => {
    const section = document.getElementById(link.hash.slice(1));
    if (section) parts.push({ element: section, link: position });
  });
  if (footer) parts.push({ element: footer, link: links.length - 1 });

  const crossing = new Map<Element, boolean>();
  let marked: number | null = null;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        crossing.set(entry.target, entry.isIntersecting);
      }
      const current = currentLink(
        parts.map(({ element, link }): ObservedPart => ({
          link,
          crossing: crossing.get(element) ?? false,
        })),
      );
      if (current === marked) return;
      marked = current;
      links.forEach((link, position) => {
        if (position === current) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    },
    { rootMargin: readingLine },
  );
  for (const { element } of parts) observer.observe(element);
}

const menu = document.querySelector<HTMLElement>("[data-sections-menu]");
const button = document.querySelector<HTMLElement>(
  "[data-sections-menu-button]",
);
if (menu && button) wireMenu(menu, button);
wireMark([
  ...document.querySelectorAll<HTMLAnchorElement>("[data-section-link]"),
]);
