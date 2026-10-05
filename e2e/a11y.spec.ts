import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { findContentPaths } from "./helpers";

// axe-core on the public pages: WCAG 2.1 A and AA, plus its best practices (heading order,
// landmarks). Left out: Turnstile's frame (Cloudflare's), and the huge faded site name in the
// footer, a decorative logotype hidden from screen readers (WCAG 1.4.3 exempts both).

const PAGES = [
  "/",
  "/olympiad",
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

async function expectNoViolations(page: Page, path: string) {
  await page.goto(path);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"])
    .exclude(".cf-turnstile")
    .exclude("footer p[aria-hidden='true']")
    .analyze();
  const problems = results.violations.map(
    (violation) =>
      `${violation.id} (${violation.impact}): ${violation.help}\n    ${violation.nodes
        .slice(0, 5)
        .map((node) => node.target.join(" "))
        .join("\n    ")}`,
  );
  expect(problems, `axe on ${path}`).toEqual([]);
}

for (const path of PAGES) {
  test(`no axe violations on ${path}`, async ({ page }) => {
    await expectNoViolations(page, path);
  });
}

test("no axe violations on an article and an event", async ({ page }) => {
  const { article, event } = await findContentPaths(page);
  expect(article, "an article is linked from the home page").toBeTruthy();
  expect(event, "an event is listed on /events").toBeTruthy();
  await expectNoViolations(page, article!);
  await expectNoViolations(page, event!);
});
