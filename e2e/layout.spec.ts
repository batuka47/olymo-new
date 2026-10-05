import { expect, test, type Page } from "@playwright/test";
import { findContentPaths } from "./helpers";

// Every public page at phone, tablet and desktop widths: nothing may stick out sideways (long
// Mongolian words included) and the page must never scroll horizontally.

const WIDTHS = [360, 390, 768, 1024, 1440];

const PAGES = [
  "/",
  "/olympiad",
  "/education",
  "/search",
  "/search?q=олимпиад",
  "/events",
  "/about",
  "/faq",
  "/editorial-policy",
  "/privacy",
  "/partner",
  "/advertise",
  "/submit",
  "/contact",
  "/login",
  "/no-such-page",
];

/** Elements whose right edge passes the viewport (scrolling rows that clip are fine). */
function overflowingElements(page: Page) {
  return page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const clipped = (element: Element) => {
      for (let parent = element.parentElement; parent; parent = parent.parentElement) {
        const { overflowX } = getComputedStyle(parent);
        if (overflowX !== "visible") return true;
      }
      return false;
    };
    return [...document.body.querySelectorAll("*")]
      .filter((element) => {
        const box = element.getBoundingClientRect();
        return box.width > 0 && box.right > width + 1 && !clipped(element);
      })
      .slice(0, 5)
      .map((element) => `${element.tagName.toLowerCase()}.${[...element.classList].join(".")}`);
  });
}

async function checkWidths(page: Page, path: string) {
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(path);
    const scroll = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(
      {
        scrollsSideways: scroll.scrollWidth > scroll.clientWidth,
        overflow: await overflowingElements(page),
      },
      `${path} at ${width}px`,
    ).toEqual({ scrollsSideways: false, overflow: [] });
  }
}

for (const path of PAGES) {
  test(`${path} fits 360–1440 px`, async ({ page }) => {
    await checkWidths(page, path);
  });
}

test("an article and an event fit 360–1440 px", async ({ page }) => {
  const { article, event } = await findContentPaths(page);
  await checkWidths(page, article!);
  await checkWidths(page, event!);
});
