import { test as base } from "@playwright/test";
import { HomePage } from "./pages/HomePage";

interface PageObjects {
  homePage: HomePage;
}

export const test = base.extend<PageObjects>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
});

export { expect } from "@playwright/test";
