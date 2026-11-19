/** Runs a task once the page has loaded and the main thread is idle (or 2.5 s have passed). */
export function whenIdle(task: () => void): void {
  const schedule = () => {
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => task(), { timeout: 2500 });
    } else {
      setTimeout(task, 300);
    }
  };
  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });
}
