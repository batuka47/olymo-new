import { createClient } from "@supabase/supabase-js";
import { expect, type Page } from "@playwright/test";
import { adminRoutes } from "@/config/admin";
import { t } from "@/lib/i18n";

function env(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set (see "Browser tests" in README.md).`);
  }
  return value;
}

/** Service-role client for removing what a test created. Local or CI database only. */
export function adminDatabase() {
  return createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SECRET_KEY"), {
    auth: { persistSession: false },
  });
}

/** Turnstile's test keys always pass, but the token still arrives a moment after the page. */
export async function waitForTurnstile(page: Page) {
  await expect(page.locator('[name="cf-turnstile-response"]')).not.toHaveValue("", {
    timeout: 20_000,
  });
}

export async function signInAsStaff(page: Page) {
  await page.goto(adminRoutes.login);
  await waitForTurnstile(page);
  await page.getByLabel(t("admin.login.email")).fill(env("E2E_ADMIN_EMAIL"));
  await page.getByLabel(t("admin.login.password")).fill(env("E2E_ADMIN_PASSWORD"));
  await page.getByRole("button", { name: t("admin.login.submit") }).click();
  await expect(page).toHaveURL(adminRoutes.dashboard);
}

/** Article pages are /{category}/{slug}; events live under /events/. */
export function isArticlePath(href: string | null): href is string {
  return href !== null && /^\/[a-z]+\/[a-z0-9-]+$/.test(href) && !href.startsWith("/events/");
}

/** The first article and event linked from the home page, for tests that need real pages. */
export async function findContentPaths(page: Page) {
  await page.goto("/");
  const hrefs = await page
    .locator("main a[href]")
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  await page.goto("/events");
  const eventHrefs = await page
    .locator("main a[href^='/events/']")
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  return {
    article: hrefs.find(isArticlePath) ?? null,
    event: eventHrefs.find((href) => href && /^\/events\/[a-z0-9-]+$/.test(href)) ?? null,
  };
}
