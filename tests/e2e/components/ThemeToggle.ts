import type { Locator } from "@playwright/test";
import type { ColorScheme } from "../data/colorSchemes";
import type { ThemeToggleNames } from "../data/locales";

export class ThemeToggle {
  /**
   * The toggle whether or not it is rendered. A hidden control has no accessible name to find
   * it by, so this one locator uses the script's hook attribute.
   */
  readonly inMarkup: Locator;

  constructor(
    private readonly scope: Locator,
    private readonly names: ThemeToggleNames,
  ) {
    this.inMarkup = scope.locator("[data-theme-toggle]");
  }

  /** The toggle as it reads while it offers to switch to the given theme. */
  offering(theme: ColorScheme): Locator {
    const name = theme === "dark" ? this.names.toDark : this.names.toLight;
    return this.scope.getByRole("button", { name, exact: true });
  }

  /** The toggle in either state. */
  get button(): Locator {
    return this.offering("dark").or(this.offering("light"));
  }

  async switchTo(theme: ColorScheme): Promise<void> {
    await this.offering(theme).click();
  }

  /** Rests the pointer on the toggle, in either state. */
  async hover(): Promise<void> {
    await this.button.hover();
  }
}
