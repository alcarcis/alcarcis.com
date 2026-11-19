import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Locale } from "../i18n/ui";

export interface CvDownload {
  readonly href: string;
}

/** Each page offers its own language's CV, published under public/cv/. */
const cvPublicPath = (locale: Locale): string =>
  `/cv/carlos-alcala-cv-${locale}.pdf`;

/**
 * The page's CV link, or null while that PDF is not published: the site never links a file
 * the build does not ship.
 */
export function cvDownloadFor(
  locale: Locale,
  isPublished: (publicPath: string) => boolean,
): CvDownload | null {
  const href = cvPublicPath(locale);
  return isPublished(href) ? { href } : null;
}

/** Whether a public path exists in the project's public/ folder, the build's static files. */
export const isInPublicDir =
  (root: string) =>
  (publicPath: string): boolean =>
    existsSync(join(root, "public", publicPath));
