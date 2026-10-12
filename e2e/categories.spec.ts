import { expect, test, type Browser, type Page } from "@playwright/test";
import { adminRoutes } from "@/config/admin";
import { t } from "@/lib/i18n";
import { adminDatabase, signInAsStaff } from "./helpers";

// Categories are data: an admin adds one, an article is published in it (with a secondary
// category), it shows in the menu and on its page; then it is renamed, hidden, reordered and
// deleted with its articles moved.

const EXCERPT =
  "Шинэ ангиллын туршилтын мэдээ: цэс, ангиллын хуудас, хоёрдогч ангилал бүгд шалгагдана.";

/** A visitor's view, without the admin session. */
async function readerPage(browser: Browser) {
  return browser.newPage({ viewport: { width: 1440, height: 900 } });
}

function categoryRow(page: Page, slug: string) {
  return page.locator(`li[data-category="${slug}"]`);
}

/** The header menu's links, in order. */
async function menuLinks(page: Page) {
  return page
    .getByRole("navigation", { name: t("nav.categories") })
    .first()
    .getByRole("link")
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
}

test("admins add, rename, hide, reorder and delete categories", async ({ page, browser }) => {
  test.setTimeout(240_000);
  const stamp = Date.now();
  const label = `Туршилт ангилал ${stamp}`;
  const slug = `turshilt-angilal-${stamp}`;
  const title = `Ангиллын туршилт ${stamp}`;
  let articleId: string | undefined;

  try {
    await signInAsStaff(page);

    // Add: the address follows the name in Latin; a reserved one is refused.
    await page.goto(`${adminRoutes.categories}/new`);
    await page.getByLabel(`${t("admin.categories.form.label")} *`).fill(label);
    await expect(page.locator('input[name="slug"]')).toHaveValue(slug);
    await page.locator('input[name="slug"]').fill("search");
    await page.getByRole("button", { name: t("admin.categories.form.save") }).click();
    await expect(
      page.getByText(t("admin.categories.errors.reserved", { slug: "search" })),
    ).toBeVisible();
    await page.getByRole("button", { name: t("admin.categories.form.slugRegenerate") }).click();
    await expect(page.locator('input[name="slug"]')).toHaveValue(slug);
    await page
      .getByLabel(t("admin.categories.form.description"))
      .fill("Туршилтын ангиллын тайлбар.");
    await page.getByRole("button", { name: t("admin.categories.form.save") }).click();
    await expect(page).toHaveURL(adminRoutes.categories);
    await expect(categoryRow(page, slug)).toContainText(label);

    // Publish an article in it, also listed under Шинжлэх ухаан.
    await page.goto(`${adminRoutes.articles}/new`);
    await page.locator('input[name="title"]').fill(title);
    await page.locator('select[name="categorySlug"]').selectOption(slug);
    await page.getByRole("checkbox", { name: "Шинжлэх ухаан" }).check();
    await page.locator('textarea[name="excerpt"]').fill(EXCERPT);
    await page.getByRole("button", { name: t("admin.publish.publish"), exact: true }).click();
    await expect(page.locator("header [role=status]")).toContainText(t("admin.publish.saved"), {
      timeout: 30_000,
    });
    articleId = new URL(page.url()).pathname.split("/").pop();
    const { data: article } = await adminDatabase()
      .from("articles")
      .select("slug, category_slugs")
      .eq("id", articleId!)
      .single();
    expect(article?.category_slugs).toEqual([slug, "science"]);
    const articlePath = `/${slug}/${article!.slug}`;

    // The site: in the menu, on its page with the description, and on Шинжлэх ухаан too, with
    // the address keeping the main category.
    const reader = await readerPage(browser);
    await reader.goto("/");
    expect(await menuLinks(reader)).toContain(`/${slug}`);
    await reader.goto(`/${slug}`);
    await expect(reader.locator("h1")).toHaveText(label);
    await expect(reader.getByText("Туршилтын ангиллын тайлбар.")).toBeVisible();
    await expect(reader.locator(`main a[href="${articlePath}"]`).first()).toBeVisible();
    await reader.goto("/science");
    await expect(reader.locator(`main a[href="${articlePath}"]`).first()).toBeVisible();
    expect((await reader.goto(`/${slug}?page=1`))?.status()).toBe(200);

    // Rename: the address stays, now that an article uses it.
    await page.goto(`${adminRoutes.categories}/${slug}`);
    await expect(page.locator('input[name="slug"]')).toHaveAttribute("readonly", "");
    await page.getByLabel(`${t("admin.categories.form.label")} *`).fill(`${label} шинэ`);
    await page.getByRole("button", { name: t("admin.categories.form.save") }).click();
    await expect(categoryRow(page, slug)).toContainText(`${label} шинэ`);
    await reader.goto(`/${slug}`);
    await expect(reader.locator("h1")).toHaveText(`${label} шинэ`);
    // A long name in the menu scrolls inside it; the page never gets wider than the screen.
    await reader.setViewportSize({ width: 1024, height: 900 });
    await reader.goto("/");
    expect(
      await reader.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await reader.setViewportSize({ width: 1440, height: 900 });

    // "Нүүрэнд харуулах": the home page's "Салбар бүрээс" shows only the ticked category (and the
    // next event, as before); the olympiad band is named after the olympiad category.
    await page.goto(`${adminRoutes.categories}/${slug}`);
    await page.getByRole("checkbox", { name: t("admin.categories.form.showOnHome") }).check();
    await page.getByRole("button", { name: t("admin.categories.form.save") }).click();
    await expect(categoryRow(page, slug)).toContainText(t("admin.categories.badges.home"));
    await reader.goto("/");
    const sectors = reader
      .locator("section")
      .filter({ has: reader.getByRole("heading", { name: t("home.sectors") }) });
    const tiles = await sectors
      .locator("li a")
      .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    expect(tiles[0]).toBe(articlePath);
    expect(tiles.slice(1).every((href) => href?.startsWith("/events/"))).toBe(true);
    const olympiadBand = reader.locator("section.bg-ink h2");
    if ((await olympiadBand.count()) > 0) await expect(olympiadBand.first()).toHaveText("Олимпиад");

    // Hide: no page, not in the menu; the article still opens. Then show it again.
    await categoryRow(page, slug)
      .getByRole("button", { name: t("admin.categories.actions.hide") })
      .click();
    await expect(categoryRow(page, slug)).toContainText(t("admin.categories.badges.hidden"));
    await expect(
      page.getByRole("status").filter({ hasText: t("admin.categories.saved") }),
    ).toBeVisible();
    expect((await reader.goto(`/${slug}`))?.status()).toBe(404);
    expect(await menuLinks(reader)).not.toContain(`/${slug}`);
    expect((await reader.goto(articlePath))?.status()).toBe(200);
    await categoryRow(page, slug)
      .getByRole("button", { name: t("admin.categories.actions.show") })
      .click();
    await expect(categoryRow(page, slug)).not.toContainText(t("admin.categories.badges.hidden"));
    await expect(
      page.getByRole("status").filter({ hasText: t("admin.categories.saved") }),
    ).toBeVisible();

    // Reorder: one step up puts it before Эвентүүд in the menu.
    await page
      .getByRole("button", { name: t("admin.categories.moveUp", { name: `${label} шинэ` }) })
      .click();
    await expect(page.locator("li[data-category]").nth(-2)).toHaveAttribute("data-category", slug);
    await expect(
      page.getByRole("status").filter({ hasText: t("admin.categories.saved") }),
    ).toBeVisible();
    await reader.goto("/");
    const order = await menuLinks(reader);
    expect(order.indexOf(`/${slug}`)).toBe(order.indexOf("/events") - 1);

    // A page open on the home page prefetches the menu links; one prefetched while the category is
    // being deleted is cached as it was for up to the 60 s ISR period. Readers arriving later get
    // the 404; this test is such a reader.
    await reader.goto("about:blank");

    // Delete with move: the article goes to Боловсрол; its old address redirects there.
    await categoryRow(page, slug)
      .getByRole("button", { name: t("admin.categories.actions.delete") })
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText(t("admin.categories.deleteDialog.inUse", { count: 1 }));
    await dialog.getByLabel(t("admin.categories.deleteDialog.moveTo")).selectOption("education");
    await dialog
      .getByRole("button", { name: t("admin.categories.deleteDialog.confirmMove") })
      .click();
    await expect(dialog).toBeHidden();
    await expect(categoryRow(page, slug)).toHaveCount(0);

    const { data: moved } = await adminDatabase()
      .from("articles")
      .select("category_slugs")
      .eq("id", articleId!)
      .single();
    expect(moved?.category_slugs).toEqual(["education", "science"]);
    const redirect = await reader.request.get(articlePath, { maxRedirects: 0 });
    expect(redirect.status()).toBe(308);
    // Next.js repeats the header ("a, a") on redirects from a layout; the first is the one used.
    expect(redirect.headers().location.split(",")[0]).toBe(`/education/${article!.slug}`);
    expect((await reader.goto(`/${slug}`))?.status()).toBe(404);
    await reader.close();

    // Four ticked for the home page already: a fifth cannot be.
    await adminDatabase()
      .from("categories")
      .update({ show_on_home: true })
      .in("slug", ["education", "world", "sports", "science"]);
    await page.goto(`${adminRoutes.categories}/technology`);
    await expect(
      page.getByRole("checkbox", { name: t("admin.categories.form.showOnHome") }),
    ).toBeDisabled();
    await expect(
      page.getByText(t("admin.categories.form.showOnHomeFull", { limit: 4 })),
    ).toBeVisible();
  } finally {
    const database = adminDatabase();
    await database.from("categories").update({ show_on_home: false }).eq("show_on_home", true);
    if (articleId) await database.from("articles").delete().eq("id", articleId);
    else await database.from("articles").delete().eq("title", title);
    await database.from("categories").delete().eq("slug", slug);
  }
});
