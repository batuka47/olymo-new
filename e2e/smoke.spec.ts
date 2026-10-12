import { expect, test } from "@playwright/test";
import { adminRoutes } from "@/config/admin";
import { routes } from "@/config/navigation";
import { t } from "@/lib/i18n";
import { adminDatabase, isArticlePath, signInAsStaff, waitForTurnstile } from "./helpers";

// The paths a reader and an editor take every day. They need the local sample content
// (supabase/seed.sql) and a staff account (E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD).

test("the home page loads", async ({ page }) => {
  const response = await page.goto(routes.home);
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: t("nav.skipToContent") })).toBeAttached();
});

test("an article opens from the home page", async ({ page }) => {
  await page.goto(routes.home);
  const links = page.locator("main a[href]");
  const hrefs = await links.evaluateAll((all) => all.map((link) => link.getAttribute("href")));
  const href = hrefs.find(isArticlePath);
  expect(href, "the home page links to an article").toBeTruthy();

  await page.locator(`main a[href="${href}"]`).first().click();
  await expect(page).toHaveURL(href!);
  await expect(page.locator("article h1")).toBeVisible();
  await expect(page.getByRole("navigation", { name: t("article.breadcrumb") })).toBeVisible();
});

test("search finds articles", async ({ page }) => {
  await page.goto(routes.search);
  await page.getByLabel(t("searchPage.inputLabel")).fill("олимпиад");
  await page.getByLabel(t("searchPage.inputLabel")).press("Enter");
  await expect(page).toHaveURL(/\/search\?q=/);
  await expect(page.locator("main article, main li a[href]").first()).toBeVisible();
});

test("the contact form sends a message", async ({ page }) => {
  const email = `smoke-${Date.now()}@example.com`;
  try {
    await page.goto(routes.contact);
    await page.locator('[name="firstName"]').fill("Смоук");
    await page.locator('[name="email"]').fill(email);
    await page.locator('[name="message"]').fill("Автомат шалгалтын зурвас.");
    await waitForTurnstile(page);
    // Forms sent faster than a person could type them are refused as spam.
    await page.waitForTimeout(3_500);
    await page.getByRole("button", { name: t("submissions.send") }).click();
    await expect(page.getByText(t("submissions.sent.title"))).toBeVisible({ timeout: 20_000 });
  } finally {
    await adminDatabase().from("submissions").delete().eq("email", email);
  }
});

test("staff sign in and save a draft article", async ({ page }) => {
  const title = `Смоук тест ${Date.now()}`;
  let articleId: string | undefined;
  try {
    await signInAsStaff(page);
    await page.goto(`${adminRoutes.articles}/new`);
    await page.locator('input[name="title"]').fill(title);
    await page.locator('select[name="categorySlug"]').selectOption("education");
    await page.getByRole("button", { name: t("admin.publish.saveDraft") }).click();
    await expect(page.locator("header [role=status]")).toContainText(t("admin.publish.saved"), {
      timeout: 20_000,
    });
    // A new article has its id (and address) from the start.
    await expect(page).toHaveURL(/\/admin\/articles\/[0-9a-f-]{36}/);
    articleId = new URL(page.url()).pathname.split("/").pop();

    const { data } = await adminDatabase()
      .from("articles")
      .select("title, status")
      .eq("id", articleId!)
      .single();
    expect(data).toEqual({ title, status: "draft" });
  } finally {
    if (articleId) await adminDatabase().from("articles").delete().eq("id", articleId);
    else await adminDatabase().from("articles").delete().eq("title", title);
  }
});
