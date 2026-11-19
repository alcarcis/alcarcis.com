/*
 * Contact's copy button. It writes the address to the clipboard; when the clipboard refuses the
 * write or is missing, it selects the address instead and says how to copy it. The button's label
 * shows the outcome and a polite live region announces it, then both return to rest. It reads no
 * layout, and only its colours change, which the theme rules already govern.
 */

type Outcome = "copied" | "selected";

/** How long each outcome stays: the failure says more, so it stays longer. */
const shownForMs: Readonly<Record<Outcome, number>> = {
  copied: 1800,
  selected: 5000,
};

function wire(address: HTMLElement): void {
  const link = address.querySelector("a");
  const button = address.querySelector("button");
  const label = address.querySelector("[data-copy-label]");
  const status = address.querySelector('[role="status"]');
  if (!link || !button || !label || !status) return;

  const restingLabel = label.textContent;
  let restTimer = 0;
  let lastMessage = "";

  const report = (outcome: Outcome): void => {
    window.clearTimeout(restTimer);
    button.dataset["state"] = outcome;
    label.textContent = address.dataset[`${outcome}Label`] ?? "";
    // VoiceOver skips a message identical to the one before, even after the region was emptied;
    // a no-break space, which is not read, makes a repeat differ.
    let message = address.dataset[`${outcome}Message`] ?? "";
    if (message === lastMessage) message += " ";
    lastMessage = message;
    status.textContent = message;
    restTimer = window.setTimeout(() => {
      delete button.dataset["state"];
      label.textContent = restingLabel;
      status.textContent = "";
    }, shownForMs[outcome]);
  };

  const selectAddress = (): void => {
    const range = document.createRange();
    range.selectNodeContents(link);
    const selection = getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  };

  const copy = async (): Promise<void> => {
    try {
      // Without a clipboard (a page served without HTTPS) this throws, as a refused write rejects.
      await navigator.clipboard.writeText(link.textContent?.trim() ?? "");
      report("copied");
    } catch {
      selectAddress();
      report("selected");
    }
  };

  button.addEventListener("click", () => void copy());
}

const address = document.querySelector<HTMLElement>("[data-copy-address]");
if (address) wire(address);
