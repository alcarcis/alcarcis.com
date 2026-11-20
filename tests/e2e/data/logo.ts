import type { ColorScheme } from "./colorSchemes";

export interface LogoInks {
  /** Both slashes: the theme's copper link ink. */
  readonly slashes: string;
  /** The cursor: the theme's pass green, the colour of a passing check. */
  readonly cursor: string;
}

/** The header mark's stroke colours as computed styles report them, per theme (D61). */
export const logoInks: Readonly<Record<ColorScheme, LogoInks>> = {
  light: { slashes: "rgb(138, 85, 48)", cursor: "rgb(46, 125, 79)" },
  dark: { slashes: "rgb(200, 135, 90)", cursor: "rgb(111, 209, 140)" },
};

/** WCAG 2.2.2: blinking that starts on its own stops within five seconds. */
export const maxBlinkMilliseconds = 5000;

/** The owner link's smallest target each way, with or without the name beside the mark. */
export const minTargetPixels = 40;
