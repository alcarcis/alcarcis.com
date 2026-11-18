import type { Locator, Page } from "@playwright/test";
import { LanguageSwitch } from "../components/LanguageSwitch";
import { SeoLinks } from "../components/SeoLinks";

export class HomePage {
  readonly document: Locator;
  readonly main: Locator;
  readonly mainHeading: Locator;
  readonly seo: SeoLinks;

  constructor(private readonly page: Page) {
    this.document = page.locator("html");
    this.main = page.getByRole("main");
    this.mainHeading = this.main.getByRole("heading", { level: 1 });
    this.seo = new SeoLinks(page);
  }

  async open(path: string): Promise<void> {
    await this.page.goto(path);
  }

  textInMain(content: string): Locator {
    return this.main.getByText(content, { exact: true });
  }

  languageSwitch(accessibleName: string): LanguageSwitch {
    return new LanguageSwitch(this.page, accessibleName);
  }
}
