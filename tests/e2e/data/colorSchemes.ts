export type ColorScheme = "light" | "dark";

export const colorSchemes: readonly ColorScheme[] = ["light", "dark"];

export const oppositeOf = (scheme: ColorScheme): ColorScheme =>
  scheme === "light" ? "dark" : "light";
