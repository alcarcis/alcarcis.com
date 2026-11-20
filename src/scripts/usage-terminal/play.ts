/*
 * Each README usage types itself once, when its terminal comes into view. The characters not
 * yet typed keep their place, hidden, so the lines never move and nothing around them shifts;
 * a caret marks where typing stands. A terminal already on screen as the page loads stays as it
 * is, so no line it shows ever disappears. Under reduced motion, or in a browser without
 * IntersectionObserver, nothing changes: the HTML holds every line, and the usage summary beside
 * the terminal says the same for assistive technology. Switching to reduced motion mid-way
 * shows every line at once.
 *
 * Nothing here reads layout: the browser's own view checks decide when a terminal waits and
 * when it types, so the script costs no forced layout while the page loads.
 *
 * The terminal's data-typing attribute says where it stands: waiting (off-screen, lines
 * hidden), typing, done, or still (left as the page loaded it).
 */
import { typingSteps } from "./typing";

type TypingState = "waiting" | "typing" | "done" | "still";

/*
 * Typing starts once 60% of the terminal is in view, or, for a terminal too tall for that, once
 * it covers half the viewport. One observer watches the share in view. The other watches only
 * the viewport's middle line: a terminal at least half the viewport tall covers half of it
 * exactly when it reaches that line, however tall it is, and a shorter one reaching it is
 * already wholly in view. Both decide from the entries the browser hands them, so deciding
 * reads no layout.
 */
const startShare = 0.6;
const startWatches: readonly {
  readonly options: IntersectionObserverInit;
  readonly inView: (entry: IntersectionObserverEntry) => boolean;
}[] = [
  {
    options: { threshold: startShare },
    inView: (entry) => entry.intersectionRatio >= startShare,
  },
  {
    options: { rootMargin: "-50% 0px -50% 0px" },
    inView: (entry) => entry.isIntersecting,
  },
];

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

interface Typing {
  play(): void;
  finish(): void;
}

/** One stretch of the code's text: the part typed so far, and the rest, hidden in place. */
interface Stretch {
  readonly typed: Text;
  readonly untyped: HTMLSpanElement;
  readonly full: string;
}

const setState = (terminal: HTMLElement, state: TypingState): void => {
  terminal.dataset["typing"] = state;
};

/** Hides the terminal's lines in place and returns the controls that type them. */
function prepareTyping(terminal: HTMLElement, code: HTMLElement): Typing {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);

  const stretches: Stretch[] = nodes.map((typed) => {
    const untyped = document.createElement("span");
    untyped.className = "untyped";
    typed.after(untyped);
    return { typed, untyped, full: typed.data };
  });
  const text = stretches.map(({ full }) => full).join("");
  const caret = document.createElement("span");
  caret.className = "caret";
  let timer = 0;

  /* Shows the first `count` characters; the caret sits right after the last one shown. */
  function show(count: number): void {
    let offset = 0;
    let caretPlaced = false;
    for (const { typed, untyped, full } of stretches) {
      const shown = Math.min(full.length, Math.max(0, count - offset));
      typed.data = full.slice(0, shown);
      untyped.textContent = full.slice(shown);
      if (!caretPlaced && shown < full.length) {
        untyped.before(caret);
        caretPlaced = true;
      }
      offset += full.length;
    }
    if (!caretPlaced) caret.remove();
  }

  function finish(): void {
    clearTimeout(timer);
    show(text.length);
    setState(terminal, "done");
  }

  function play(): void {
    const steps = typingSteps(text);
    setState(terminal, "typing");
    let index = 0;
    let previousAt = 0;
    const next = (): void => {
      const step = steps[index];
      if (!step) {
        finish();
        return;
      }
      timer = window.setTimeout(() => {
        show(step.shown);
        index += 1;
        next();
      }, step.at - previousAt);
      previousAt = step.at;
    };
    next();
  }

  show(0);
  setState(terminal, "waiting");
  return { play, finish };
}

function setUpTyping(terminals: readonly HTMLElement[]): void {
  const typings = new Map<Element, Typing>();

  /* Whichever observer sees a waiting terminal far enough in view first starts it, and both
     stop watching it. */
  const startObservers = startWatches.map(
    ({ options, inView }) =>
      new IntersectionObserver((entries) => {
        for (const entry of entries) {
          const terminal = entry.target as HTMLElement;
          if (!inView(entry) || terminal.dataset["typing"] !== "waiting") {
            continue;
          }
          for (const observer of startObservers) observer.unobserve(terminal);
          typings.get(terminal)?.play();
        }
      }, options),
  );

  /* The first report says where each terminal is as the page loads: one on screen stays as it
     is; one off-screen hides its lines and types them once it comes into view. */
  const firstLook = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      firstLook.unobserve(entry.target);
      const terminal = entry.target as HTMLElement;
      const code = terminal.querySelector<HTMLElement>("[data-usage-code]");
      if (entry.isIntersecting || !code) {
        setState(terminal, "still");
        continue;
      }
      typings.set(terminal, prepareTyping(terminal, code));
      for (const observer of startObservers) observer.observe(terminal);
    }
  });
  for (const terminal of terminals) firstLook.observe(terminal);

  reducedMotion.addEventListener("change", () => {
    if (!reducedMotion.matches) return;
    firstLook.disconnect();
    for (const observer of startObservers) observer.disconnect();
    for (const typing of typings.values()) typing.finish();
  });
}

const terminals = [
  ...document.querySelectorAll<HTMLElement>("[data-usage-terminal]"),
];
if (
  terminals.length > 0 &&
  !reducedMotion.matches &&
  "IntersectionObserver" in window
) {
  setUpTyping(terminals);
}
