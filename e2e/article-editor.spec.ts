import { expect, test, type Page } from "@playwright/test";
import { adminRoutes } from "@/config/admin";
import { t } from "@/lib/i18n";
import { adminDatabase, signInAsStaff } from "./helpers";

// The block editor end to end: every block goes in through the "/" menu or the toolbar, the
// article is published, and its public page shows each block at phone and desktop width.

const YOUTUBE_LINK = "https://youtu.be/dQw4w9WgXcQ?t=42";
const X_POST = "https://x.com/nasa/status/1234567890123456789";
const MAP_CODE =
  '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy"></iframe>';
const WIDGET_CODE =
  '<div id="widget" style="height:520px">Виджет</div><script>document.getElementById("widget").textContent = "Скрипт ажилласан";</script>';
const EXCERPT =
  "Блок засварлагчийн туршилт: зураг, слайдер, хүснэгт, видео, пост, embed бүгд нэг мэдээнд.";

// Pages from these services are not part of the test; the network stays local and predictable.
const OUTSIDE_SERVICES =
  /^https:\/\/(platform\.twitter\.com|i\.ytimg\.com|www\.youtube-nocookie\.com|www\.google\.com\/maps)\//;

interface UploadFile {
  name: string;
  mimeType: string;
  buffer: Buffer;
}

/** A PNG drawn in the browser, like a phone photo but without a fixture file. */
async function pngFile(page: Page, name: string, width: number, height: number) {
  const dataUrl = await page.evaluate(
    ([w, h]) => {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const context = canvas.getContext("2d")!;
      const gradient = context.createLinearGradient(0, 0, w, h);
      gradient.addColorStop(0, "#2e3bff");
      gradient.addColorStop(1, "#c8f031");
      context.fillStyle = gradient;
      context.fillRect(0, 0, w, h);
      return canvas.toDataURL("image/png");
    },
    [width, height],
  );
  return { name, mimeType: "image/png", buffer: Buffer.from(dataUrl.split(",")[1], "base64") };
}

function bodyEditor(page: Page) {
  return page.getByRole("textbox", { name: t("admin.articles.editor.body") });
}

function toolbar(page: Page) {
  return page.getByRole("toolbar", { name: t("editor.toolbar.label") });
}

/**
 * Puts the cursor on an empty line at the end of the text. The editor always ends with a line
 * after a block, so clicking it also moves the selection off a block just inserted.
 */
async function goToEmptyLastLine(page: Page) {
  const last = bodyEditor(page).locator(":scope > *").last();
  const empty = await last.evaluate((line) => line.tagName === "P" && line.textContent === "");
  if (empty) {
    await last.click();
  } else {
    await bodyEditor(page).press("Control+End");
    await page.keyboard.press("Enter");
  }
}

/** Picks a block from the "/" menu on a new line at the end of the text. */
async function slash(page: Page, query: string) {
  await goToEmptyLastLine(page);
  await page.keyboard.type(`/${query}`);
  await expect(page.getByRole("listbox", { name: t("editor.menu.label") })).toBeVisible();
  await page.keyboard.press("Enter");
}

/** A block that asks for a file: the "/" menu opens the file picker. */
async function slashWithFiles(page: Page, query: string, files: UploadFile[]) {
  const chooser = page.waitForEvent("filechooser");
  await slash(page, query);
  await (await chooser).setFiles(files);
}

async function fillDialog(page: Page, label: string, value: string) {
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel(label).fill(value);
  await dialog.getByRole("button", { name: t("editor.dialog.insert") }).click();
  await expect(dialog).toBeHidden();
}

async function writeText(page: Page) {
  const bar = toolbar(page);
  await bodyEditor(page).click();
  await page.keyboard.type("Оршил: ");
  for (const [mark, text] of [
    ["bold", "тод"],
    ["italic", "налуу"],
    ["underline", "доогуур"],
    ["strike", "дундуур"],
  ] as const) {
    await bar.getByRole("button", { name: t(`editor.toolbar.${mark}`), exact: true }).click();
    await page.keyboard.type(text);
    await bar.getByRole("button", { name: t(`editor.toolbar.${mark}`), exact: true }).click();
    await page.keyboard.type(" ");
  }
  await page.keyboard.type("холбоос");
  for (let i = 0; i < "холбоос".length; i++) await page.keyboard.press("Shift+ArrowLeft");
  await bar.getByRole("button", { name: t("editor.toolbar.link") }).click();
  await fillDialog(page, t("admin.articles.link.url"), "https://example.mn/");

  await slash(page, "гарчиг 1");
  await page.keyboard.type("Нэгдүгээр гарчиг");
  await slash(page, "гарчиг 2");
  await page.keyboard.type("Хоёрдугаар гарчиг");
  await slash(page, "гарчиг 3");
  await page.keyboard.type("Гуравдугаар гарчиг");
  await slash(page, "жижиг");
  await page.keyboard.type("Жижиг тайлбар текст.");
  await slash(page, "энгийн");
  await page.keyboard.type("Голлуулсан догол мөр.");
  await bar.getByRole("button", { name: t("editor.align.center") }).click();
  // Latin search words work too.
  await slash(page, "tekst");
  await page.keyboard.type("Хоёр талдаа тэгшилсэн урт догол мөр.");
  await bar.getByRole("button", { name: t("editor.align.justify") }).click();
}

test.describe("article body editor", () => {
  test.setTimeout(300_000);

  test("every block goes in, saves, and shows on the article page at 390 and 1440 px", async ({
    page,
    browser,
  }) => {
    const title = `Блок засварлагч ${Date.now()}`;
    let articleId: string | undefined;
    await page.context().route(OUTSIDE_SERVICES, (route) => route.fulfill({ body: "" }));

    try {
      await signInAsStaff(page);
      await page.goto(`${adminRoutes.articles}/new`);
      await page.locator('input[name="title"]').fill(title);
      // The link is Latin from the start; the category shows as "…" until one is chosen.
      await expect(page.getByTestId("article-url")).toHaveText(/\/…\/blok-zasvarlagch-\d+$/);
      await page.locator('select[name="categorySlug"]').selectOption("education");
      await expect(page.getByTestId("article-url")).toHaveText(
        /\/education\/blok-zasvarlagch-\d+$/,
      );
      await page.locator('textarea[name="excerpt"]').fill(EXCERPT);
      const card = page.getByRole("figure").filter({ hasText: t("admin.articles.seo.preview") });
      await expect(card).toContainText(title);
      await expect(card).toContainText(EXCERPT);

      await page
        .locator('input[name="coverImage"]')
        .setInputFiles(await pngFile(page, "cover.png", 1800, 1200));
      await page.locator('input[name="coverAlt"]').fill("Туршилтын нүүр зураг");
      await page.getByRole("radio", { name: t("admin.cover.position.beside") }).check();

      // Text, marks, a link, the five sizes and alignment.
      await writeText(page);
      await slash(page, "жагсаалт");
      await page.keyboard.type("Цэгтэй мөр");
      await slash(page, "дугаартай");
      await page.keyboard.type("Дугаартай мөр");
      await slash(page, "эшлэл");
      await page.keyboard.type("Боловсрол бол ирээдүйн түлхүүр.");
      await page.getByLabel(t("editor.quote.author")).fill("Б. Бат");
      await goToEmptyLastLine(page);
      await toolbar(page)
        .getByRole("button", { name: t("editor.toolbar.rule") })
        .click();
      await slash(page, "хуваах");

      // Images: a 3000 px photo comes out at most 2400 px wide; anything but an image is refused.
      await slashWithFiles(page, "зураг", [await pngFile(page, "photo.png", 3000, 2000)]);
      const figure = bodyEditor(page).locator("figure.figure");
      await expect(figure.locator("img")).toHaveAttribute("srcset", /2400w/, { timeout: 60_000 });
      await figure.getByRole("button", { name: t("editor.image.layouts.full") }).click();
      await figure.getByLabel(t("editor.image.caption"), { exact: true }).fill("Нээлтийн ёслол");
      await figure.getByLabel(t("editor.image.credit"), { exact: true }).fill("Фото: Туршилт");
      await figure.getByLabel(t("editor.image.alt"), { exact: true }).fill("Сурагчид танхимд");

      await slashWithFiles(page, "зураг", [
        { name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("not an image") },
      ]);
      await expect(page.getByText(t("editor.image.notImage", { name: "notes.txt" }))).toBeVisible();

      await slashWithFiles(page, "слайдер", [
        await pngFile(page, "one.png", 1200, 800),
        await pngFile(page, "two.png", 800, 1200),
      ]);
      const gallery = bodyEditor(page).locator(".editor-gallery");
      await expect(gallery.locator("img")).toHaveCount(2, { timeout: 60_000 });
      await gallery
        .getByLabel(t("editor.gallery.caption"), { exact: true })
        .first()
        .fill("Эхний слайд");

      // A table with a row and a column added; the header row switched off and on again.
      await slash(page, "хүснэгт");
      await page.keyboard.type("Нэр");
      await page.keyboard.press("Tab");
      await page.keyboard.type("Оноо");
      const tableTools = page.getByRole("toolbar", { name: t("editor.table.label") });
      await tableTools.getByRole("button", { name: t("editor.table.addRow") }).click();
      await tableTools.getByRole("button", { name: t("editor.table.addColumn") }).click();
      await tableTools.getByRole("button", { name: t("editor.table.headerRow") }).click();
      await expect(bodyEditor(page).locator("table th")).toHaveCount(0);
      await tableTools.getByRole("button", { name: t("editor.table.headerRow") }).click();
      await expect(bodyEditor(page).locator("table th")).toHaveCount(4);
      await expect(bodyEditor(page).locator("table tr")).toHaveCount(4);

      await slash(page, "youtube");
      await fillDialog(page, t("editor.youtube.url"), YOUTUBE_LINK);
      await slash(page, "сошиал");
      await fillDialog(page, t("editor.social.url"), X_POST);
      await slash(page, "embed");
      await fillDialog(page, t("editor.embed.code"), MAP_CODE);
      await slash(page, "embed");
      await fillDialog(page, t("editor.embed.code"), WIDGET_CODE);
      await expect(bodyEditor(page).locator("[data-youtube]")).toHaveCount(1);
      await expect(bodyEditor(page).locator('[data-social="x"]')).toHaveCount(1);
      await expect(bodyEditor(page).locator('[data-embed="iframe"] iframe')).toHaveCount(1);
      await expect(bodyEditor(page).locator('[data-embed="sandbox"] iframe')).toHaveCount(1);

      await page.getByRole("button", { name: t("admin.publish.publish"), exact: true }).click();
      await expect(page.locator("header [role=status]")).toContainText(t("admin.publish.saved"), {
        timeout: 30_000,
      });
      articleId = new URL(page.url()).pathname.split("/").pop();

      const { data: row } = await adminDatabase()
        .from("articles")
        .select("slug, category_slug, status, cover_position, body_html")
        .eq("id", articleId!)
        .single();
      expect(row).toMatchObject({ status: "published", cover_position: "beside" });
      const path = `/${row!.category_slug}/${row!.slug}`;

      for (const width of [390, 1440]) {
        const reader = await browser.newPage({ viewport: { width, height: 900 } });
        await reader.context().route(OUTSIDE_SERVICES, (route) => route.fulfill({ body: "" }));
        await reader.goto(path);
        await checkArticlePage(reader, width);
        await reader.close();
      }

      await page.goto(adminRoutes.articles);
      await page.getByRole("button", { name: t("admin.articles.refresh.button") }).click();
      await expect(
        page.getByRole("status").filter({ hasText: t("admin.articles.refresh.done") }),
      ).toBeVisible();
    } finally {
      if (articleId) {
        const media = adminDatabase().storage.from("media");
        const { data: files } = await media.list(`articles/${articleId}`, { limit: 100 });
        if (files?.length) {
          await media.remove(files.map((file) => `articles/${articleId}/${file.name}`));
        }
        await adminDatabase().from("articles").delete().eq("id", articleId);
      } else {
        await adminDatabase().from("articles").delete().eq("title", title);
      }
    }
  });
});

async function checkArticlePage(page: Page, width: number) {
  const body = page.locator(".article-body");
  const label = `${width} px`;

  // Nothing pushes the page sideways; the wide table scrolls inside its own box.
  const tooWide = await page.evaluate(() => {
    if (document.documentElement.scrollWidth <= window.innerWidth) return [];
    // What sticks out, leaving out what scrolls inside its own box (table, slider, menus).
    const insideScrollBox = (element: Element) => {
      for (let box = element.parentElement; box; box = box.parentElement) {
        if (getComputedStyle(box).overflowX !== "visible") return true;
      }
      return false;
    };
    return [...document.querySelectorAll("body *")]
      .filter((element) => element.getBoundingClientRect().right > window.innerWidth + 1)
      .filter((element) => !insideScrollBox(element))
      .slice(0, 8)
      .map((element) => `${element.tagName.toLowerCase()}.${element.getAttribute("class") ?? ""}`);
  });
  expect(tooWide, label).toEqual([]);

  await expect(page.locator("h1")).toHaveCount(1);
  await expect(body.locator("h2")).toHaveText("Нэгдүгээр гарчиг");
  await expect(body.locator("h3")).toHaveText("Хоёрдугаар гарчиг");
  await expect(body.locator("h4")).toHaveText("Гуравдугаар гарчиг");
  await expect(body.locator("p.text-small")).toHaveText("Жижиг тайлбар текст.");
  await expect(body.locator('p[style*="center"]')).toHaveText("Голлуулсан догол мөр.");
  await expect(body.locator('p[style*="justify"]').first()).toHaveText(
    "Хоёр талдаа тэгшилсэн урт догол мөр.",
  );
  await expect(body.locator("strong")).toHaveText("тод");
  await expect(body.locator("em")).toHaveText("налуу");
  await expect(body.locator("u")).toHaveText("доогуур");
  await expect(body.locator("s")).toHaveText("дундуур");
  await expect(body.locator('a[href="https://example.mn/"]')).toHaveText("холбоос");
  await expect(body.locator("ul:not(.gallery-track) > li")).toHaveText("Цэгтэй мөр");
  await expect(body.locator("ol > li")).toHaveText("Дугаартай мөр");
  await expect(body.locator("blockquote .quote-author")).toHaveText("— Б. Бат");
  await expect(body.locator("hr")).toHaveCount(2);

  // The cover sits beside the title on desktop and under the excerpt on phones.
  const titleBox = (await page.locator("h1").boundingBox())!;
  const coverBox = (await page.locator("header figure img").boundingBox())!;
  if (width >= 1024) expect(coverBox.x, label).toBeGreaterThan(titleBox.x + titleBox.width);
  else expect(coverBox.y, label).toBeGreaterThan(titleBox.y + titleBox.height);

  const image = body.locator("figure.figure-full img");
  await expect(image).toHaveAttribute("srcset", /2400w/);
  expect(await image.getAttribute("srcset")).not.toMatch(/3000w/);
  await expect(body.locator("figure.figure-full .figure-caption")).toHaveText("Нээлтийн ёслол");
  await expect(body.locator("figure.figure-full .figure-credit")).toHaveText("Фото: Туршилт");

  const slides = body.locator(".gallery-slide img");
  await expect(slides).toHaveCount(2);
  await expect(slides.first()).toHaveAttribute("loading", "lazy");
  const track = body.locator(".gallery-track");
  await track.scrollIntoViewIfNeeded();
  await body.getByRole("button", { name: t("editor.gallery.next") }).click();
  await expect
    .poll(() => track.evaluate((element) => element.scrollLeft), label)
    .toBeGreaterThan(0);

  const table = body.locator(".tableWrapper");
  await expect(table.locator("th")).toHaveCount(4);
  if (width < 640) {
    expect(await table.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
  }

  const youtube = body.locator("[data-youtube]");
  await expect(youtube).toHaveAttribute("data-enhanced", "");
  const bodyBox = (await body.boundingBox())!;
  const previewBox = (await youtube.locator("a").boundingBox())!;
  expect(Math.abs(previewBox.width - bodyBox.width), label).toBeLessThan(1);
  expect(Math.abs(previewBox.width / previewBox.height - 16 / 9), label).toBeLessThan(0.02);
  await youtube.getByRole("link", { name: t("editor.youtube.play") }).click();
  await expect(youtube.locator("iframe")).toHaveAttribute(
    "src",
    "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0&start=42",
  );

  await expect(body.locator('[data-social="x"] blockquote.twitter-tweet a')).toHaveAttribute(
    "href",
    "https://twitter.com/nasa/status/1234567890123456789",
  );
  await expect(body.locator('[data-embed="iframe"] iframe')).toHaveAttribute(
    "src",
    "https://www.google.com/maps/embed?pb=!1m18!1m12",
  );

  // Pasted code runs only inside its sandbox, and the frame grows to the height it reports.
  const sandbox = body.locator('[data-embed="sandbox"] iframe');
  await expect(sandbox).toHaveAttribute("sandbox", "allow-scripts allow-popups allow-forms");
  await sandbox.scrollIntoViewIfNeeded();
  await expect(page.frameLocator('[data-embed="sandbox"] iframe').locator("#widget")).toHaveText(
    "Скрипт ажилласан",
  );
  await expect
    .poll(() => sandbox.evaluate((frame) => frame.getBoundingClientRect().height), label)
    .toBeGreaterThanOrEqual(520);
  expect(await page.evaluate(() => document.getElementById("widget"))).toBeNull();
}
