import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { adminRoutes } from "@/config/admin";
import { t } from "@/lib/i18n";
import { adminDatabase, signInAsStaff } from "./helpers";

// A quiz from start to finish: built in /admin/quizzes, put in an article with the "/" menu,
// answered by a reader on a phone, then deleted while the article still uses it.

const EXCERPT =
  "Quiz-тэй туршилтын мэдээ: уншигч хариулж, зөв бурууг нь шууд харна, дүнгээ хуваалцана.";

/** axe (WCAG 2.1 AA and best practices) on the quiz card as it is now. */
async function quizViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .include("figure[data-quiz]")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"])
    .analyze();
  return results.violations.map((violation) => `${violation.id}: ${violation.help}`);
}

function question(page: Page, number: number) {
  return page.locator(`section[data-question="${number}"]`);
}

async function fillQuestion(section: Locator, text: string, options: string[], correct: number) {
  await section
    .getByLabel(`${t("admin.quizzes.editor.questionText")} *`, { exact: true })
    .fill(text);
  for (const [index, option] of options.entries()) {
    const name = t("admin.quizzes.editor.option", { number: index + 1 });
    if ((await section.getByLabel(name, { exact: true }).count()) === 0) {
      await section.getByRole("button", { name: t("admin.quizzes.editor.addOption") }).click();
    }
    await section.getByLabel(name, { exact: true }).fill(option);
  }
  await section
    .getByRole("radio", {
      name: `${t("admin.quizzes.editor.correct")}: ${t("admin.quizzes.editor.option", { number: correct })}`,
    })
    .check();
}

test("a quiz is built, placed in an article and answered on a phone", async ({ page, browser }) => {
  test.setTimeout(240_000);
  const stamp = Date.now();
  const quizTitle = `Туршилтын quiz ${stamp}`;
  const articleTitle = `Quiz-тэй мэдээ ${stamp}`;
  let quizId: string | undefined;
  let articleId: string | undefined;

  try {
    await signInAsStaff(page);

    // Build: two questions; saving without a marked answer is refused by question number.
    await page.goto(`${adminRoutes.quizzes}/new`);
    await expect(page).toHaveURL(/\/admin\/quizzes\/[0-9a-f-]{36}\?new=1$/);
    quizId = new URL(page.url()).pathname.split("/").pop();
    await page.locator('input[name="title"]').fill(quizTitle);
    await page.locator('textarea[name="description"]').fill("Хоёр асуулттай туршилт.");

    const first = question(page, 1);
    await first
      .getByLabel(`${t("admin.quizzes.editor.questionText")} *`, { exact: true })
      .fill("Монгол Улсын нийслэл аль вэ?");
    await first.getByLabel("1-р хариулт", { exact: true }).fill("Улаанбаатар");
    await first.getByLabel("2-р хариулт", { exact: true }).fill("Дархан");
    const save = page.getByRole("button", { name: t("admin.quizzes.editor.save") });
    await save.click();
    await expect(page.getByText(t("admin.quizzes.errors.oneCorrect", { number: 1 }))).toBeVisible();
    await fillQuestion(first, "Монгол Улсын нийслэл аль вэ?", ["Улаанбаатар", "Дархан"], 1);
    await first
      .getByLabel(t("admin.quizzes.editor.explanation"), { exact: true })
      .fill("Улаанбаатар бол Монгол Улсын нийслэл.");

    await page.getByRole("button", { name: t("admin.quizzes.editor.addQuestion") }).click();
    await fillQuestion(question(page, 2), "2 + 2 хэд вэ?", ["Гурав", "Дөрөв", "Тав"], 2);

    // The live preview is the reader's card.
    const preview = page.getByTestId("quiz-preview");
    await expect(preview).toContainText(quizTitle);
    await expect(preview).toContainText("Монгол Улсын нийслэл аль вэ?");

    await save.click();
    await expect(
      page
        .getByRole("status")
        .filter({ hasText: t("admin.quizzes.editor.saved") })
        .first(),
    ).toBeVisible();

    await page.goto(adminRoutes.quizzes);
    const row = page.locator(`tr[data-quiz="${quizId}"]`);
    await expect(row).toContainText(t("admin.quizzes.questionCount", { count: 2 }));
    await expect(row).toContainText(t("admin.quizzes.usage", { count: 0 }));

    // Place it in an article with "/".
    await page.goto(`${adminRoutes.articles}/new`);
    await page.locator('input[name="title"]').fill(articleTitle);
    await page.locator('select[name="categorySlug"]').selectOption("education");
    await page.locator('textarea[name="excerpt"]').fill(EXCERPT);
    const editor = page.getByRole("textbox", { name: t("admin.articles.editor.body") });
    await editor.click();
    await page.keyboard.type("Quiz-ийн өмнөх догол мөр.");
    await page.keyboard.press("Enter");
    await page.keyboard.type("/quiz");
    await expect(page.getByRole("listbox", { name: t("editor.menu.label") })).toBeVisible();
    await page.keyboard.press("Enter");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: t("editor.quiz.choose", { title: quizTitle }) })
      .click();
    await expect(editor.locator(`[data-quiz="${quizId}"]`)).toContainText(quizTitle);

    await page.getByRole("button", { name: t("admin.publish.publish"), exact: true }).click();
    await expect(page.locator("header [role=status]")).toContainText(t("admin.publish.saved"), {
      timeout: 30_000,
    });
    articleId = new URL(page.url()).pathname.split("/").pop();
    const { data: article } = await adminDatabase()
      .from("articles")
      .select("slug, category_slug")
      .eq("id", articleId!)
      .single();
    const path = `/${article!.category_slug}/${article!.slug}`;

    // Answer it on a phone.
    const phone = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const reader = await phone.newPage();
    await reader.goto(path);
    const card = reader.locator("figure[data-quiz] section");
    await expect(card).toContainText(quizTitle);
    await expect(card.getByTestId("quiz-progress")).toHaveText("1 / 2");
    const optionHeights = await card
      .locator("ul button")
      .evaluateAll((buttons) => buttons.map((button) => button.getBoundingClientRect().height));
    expect(Math.min(...optionHeights)).toBeGreaterThanOrEqual(44);

    // Right answer: green "Зөв", the explanation, how readers did; the question is locked.
    await card.getByRole("button", { name: "Улаанбаатар" }).click();
    const feedback = card.getByTestId("quiz-feedback");
    await expect(feedback).toContainText(t("quiz.correct"));
    await expect(feedback).toContainText("Улаанбаатар бол Монгол Улсын нийслэл.");
    await expect(feedback).toContainText(t("quiz.readersCorrect", { percent: 100 }));
    await expect(card.locator('button[data-state="correct"]')).toContainText("Улаанбаатар");
    await expect(card.getByRole("button", { name: "Дархан" })).toBeDisabled();
    await expect(card.locator("[aria-live=polite]")).toHaveText(t("quiz.correct"));
    await feedback.getByRole("button", { name: t("quiz.next") }).click();

    // Wrong answer: red "Буруу" and the correct option highlighted.
    await expect(card.getByTestId("quiz-progress")).toHaveText("2 / 2");
    await card.getByRole("button", { name: "Гурав" }).click();
    await expect(feedback).toContainText(t("quiz.wrong"));
    await expect(feedback).toContainText(t("quiz.correctAnswer", { answer: "Дөрөв" }));
    await expect(card.locator('button[data-state="wrong"]')).toContainText("Гурав");
    await expect(card.locator('button[data-state="correct"]')).toContainText("Дөрөв");
    expect(await quizViolations(reader)).toEqual([]);
    await feedback.getByRole("button", { name: t("quiz.finish") }).click();

    // The end: score, a message, retry and share.
    const result = card.getByTestId("quiz-result");
    await expect(result).toContainText("1 / 2");
    await expect(result).toContainText(t("quiz.result.fair"));
    await expect(result.getByRole("button", { name: /Би 1\/2 авлаа/ })).toBeVisible();
    expect(await quizViolations(reader)).toEqual([]);
    expect(
      await reader.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await result.getByRole("button", { name: t("quiz.retry") }).click();
    await expect(card.getByTestId("quiz-progress")).toHaveText("1 / 2");
    await expect(card.getByRole("button", { name: "Улаанбаатар" })).toBeEnabled();

    // One answer was counted per question, anonymously: for the two options chosen.
    const database = adminDatabase();
    const { data: questions } = await database
      .from("quiz_questions")
      .select("id")
      .eq("quiz_id", quizId!);
    const { data: options } = await database
      .from("quiz_options")
      .select("id")
      .in(
        "question_id",
        (questions ?? []).map((row) => row.id),
      );
    const { data: counts } = await database
      .from("quiz_option_counts")
      .select("answers")
      .in(
        "option_id",
        (options ?? []).map((row) => row.id),
      );
    expect((counts ?? []).map((row) => row.answers)).toEqual([1, 1]);

    // Deleting a quiz that an article uses says so; the article then shows nothing there.
    await page.goto(adminRoutes.quizzes);
    await expect(row).toContainText(t("admin.quizzes.usage", { count: 1 }));
    await row.getByRole("button", { name: t("admin.quizzes.actions.delete") }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText(t("admin.quizzes.delete.inUse", { count: 1 }));
    await dialog.getByRole("button", { name: t("admin.quizzes.delete.confirm") }).click();
    await expect(row).toHaveCount(0);
    await reader.goto(path);
    await expect(reader.locator(".article-body")).toContainText("Quiz-ийн өмнөх догол мөр.");
    await expect(reader.locator("figure[data-quiz]")).toHaveCount(0);
    await phone.close();
  } finally {
    const database = adminDatabase();
    if (articleId) await database.from("articles").delete().eq("id", articleId);
    else await database.from("articles").delete().eq("title", articleTitle);
    if (quizId) await database.from("quizzes").delete().eq("id", quizId);
  }
});
