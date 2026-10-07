"use client";

import Link from "next/link";
import { useCallback, useId, useRef, useState } from "react";
import { CoverImageField } from "@/components/admin/cover-image-field";
import { EditorPanel } from "@/components/admin/editor/editor-panel";
import { LeaveGuardDialog } from "@/components/admin/editor/leave-guard-dialog";
import { PublishBar } from "@/components/admin/editor/publish-bar";
import { PublishPanel } from "@/components/admin/editor/publish-panel";
import type { LastSave, SavingKind } from "@/components/admin/editor/save-status";
import { SlugField } from "@/components/admin/editor/slug-field";
import { useDraftAutosave } from "@/components/admin/editor/use-draft-autosave";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { SharePreview } from "@/components/admin/share-preview";
import { TagCombobox } from "@/components/admin/tag-combobox";
import { Button } from "@/components/ui/button";
import { CharacterCount } from "@/components/ui/character-count";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { FormMessage } from "@/components/ui/form-message";
import { SelectField } from "@/components/ui/select-field";
import { fieldLabelClasses, TextField } from "@/components/ui/text-field";
import { TextAreaField } from "@/components/ui/textarea-field";
import { adminRoutes } from "@/config/admin";
import { articleCategories, getCategory } from "@/config/categories";
import { siteConfig } from "@/config/site";
import { toArticleInput, type ArticleFormValues } from "@/lib/articles/form";
import { EXCERPT_LENGTH, type TagValue } from "@/lib/articles/schema";
import { articlePath, articleState } from "@/lib/articles/status";
import { formatDate } from "@/lib/dates";
import { useLeaveGuard } from "@/lib/hooks/use-leave-guard";
import { t } from "@/lib/i18n";
import { articleCoverPath, articleFolder } from "@/lib/media";
import { SLUG_PATTERN, slugFromTitle } from "@/lib/slug";
import { checkSlugAvailability, saveArticle } from "./actions";
import { CoverPositionField } from "./cover-position-field";
import { OlympiadFields } from "./olympiad-fields";
import { SeoPanel } from "./seo-panel";

interface SavedState {
  /** JSON of the form values as last saved; the form is "dirty" when it differs. */
  snapshot: string;
  exists: boolean;
  status: string;
  publishAt: string | null;
  slug: string;
  categorySlug: string;
}

interface ArticleEditorProps {
  articleId: string;
  initialValues: ArticleFormValues;
  saved: Omit<SavedState, "snapshot">;
  availableTags: TagValue[];
}

function canAutosave(values: ArticleFormValues): boolean {
  return (
    values.title.trim() !== "" &&
    values.categorySlug !== "" &&
    SLUG_PATTERN.test(values.slug) &&
    (!values.coverPath || values.coverAlt.trim() !== "")
  );
}

export function ArticleEditor({
  articleId,
  initialValues,
  saved: initialSaved,
  availableTags,
}: ArticleEditorProps) {
  const bodyLabelId = useId();
  const [values, setValues] = useState(initialValues);
  const [saved, setSaved] = useState<SavedState>({
    ...initialSaved,
    snapshot: JSON.stringify(initialValues),
  });
  const [slugEdited, setSlugEdited] = useState(initialSaved.exists);
  const [showOlympiad, setShowOlympiad] = useState(false);
  const [saving, setSaving] = useState<SavingKind>(null);
  const [lastSaved, setLastSaved] = useState<LastSave | null>(null);
  const [error, setError] = useState<string>();
  const savingRef = useRef(false);

  const dirty = JSON.stringify(values) !== saved.snapshot;
  const guard = useLeaveGuard(dirty);
  const state = saved.exists ? articleState(saved.status, saved.publishAt) : "draft";
  const isLive = saved.exists && saved.status !== "draft";
  const slugFollowsTitle = !slugEdited && !isLive;
  const checkSlug = useCallback(
    (slug: string) => checkSlugAvailability(slug, articleId),
    [articleId],
  );

  function update<K extends keyof ArticleFormValues>(key: K, value: ArticleFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  // The slug follows the title until it is edited by hand or the article goes live;
  // after that the public URL must not change behind the editor's back.
  function updateTitle(title: string) {
    setValues((current) => ({
      ...current,
      title,
      slug: slugFollowsTitle ? slugFromTitle(title) : current.slug,
    }));
  }

  async function save(intent: "draft" | "publish", { auto = false } = {}): Promise<boolean> {
    if (savingRef.current) return false;
    savingRef.current = true;
    setSaving(auto ? "auto" : "manual");
    setError(undefined);
    try {
      const result = await saveArticle(
        toArticleInput(values, articleId, intent, { slugFollowsTitle }),
      );
      if (!result.ok) {
        setError(result.error);
        return false;
      }
      // A link made from the title may have come back with a number ("...-2"): show that one.
      const savedValues = { ...values, slug: result.slug };
      if (result.slug !== values.slug) {
        setValues((current) =>
          current.slug === values.slug ? { ...current, slug: result.slug } : current,
        );
      }
      setSaved({
        snapshot: JSON.stringify(savedValues),
        exists: true,
        status: result.status,
        publishAt: result.publishAt,
        slug: result.slug,
        categorySlug: result.categorySlug,
      });
      setLastSaved({ at: result.savedAt, auto });
      return true;
    } catch {
      setError(t("admin.articles.errors.saveFailed"));
      return false;
    } finally {
      savingRef.current = false;
      setSaving(null);
    }
  }

  useDraftAutosave(saved.status === "draft" && dirty && canAutosave(values), () => {
    void save("draft", { auto: true });
  });

  async function openPreview() {
    // Opened right away so popup blockers allow it; pointed at the preview once saved.
    const previewWindow = window.open("", "_blank");
    if (!isLive && (dirty || !saved.exists) && !(await save("draft"))) {
      previewWindow?.close();
      return;
    }
    const url = `${adminRoutes.preview}?id=${articleId}`;
    if (previewWindow) {
      previewWindow.location.href = url;
    } else {
      window.open(url, "_blank");
    }
  }

  // "…" stands in for the category or link until they are chosen.
  const articleUrl = siteConfig.url + articlePath(values.categorySlug || "…", values.slug || "…");

  const showOlympiadFields =
    showOlympiad ||
    values.categorySlug === "olympiad" ||
    [values.subject, values.levelText, values.registrationDeadline, values.registrationUrl].some(
      Boolean,
    );

  return (
    <>
      <PublishBar
        title={
          saved.exists ? t("admin.articles.editor.editTitle") : t("admin.articles.editor.newTitle")
        }
        state={state}
        saving={saving}
        lastSaved={lastSaved}
        dirty={dirty}
        isLive={isLive}
        publishMode={values.publishMode}
        viewHref={articlePath(saved.categorySlug, saved.slug)}
        error={error}
        unpublishDialog={{
          title: t("admin.articles.unpublish.title"),
          message: t("admin.articles.unpublish.message"),
        }}
        onPreview={openPreview}
        onSaveDraft={() => save("draft")}
        onPublish={() => save("publish")}
        onUnpublish={() => save("draft")}
      />

      <FormMessage state={{ error }} className="mb-6" />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-8">
          <TextField
            label={t("admin.articles.editor.title")}
            name="title"
            value={values.title}
            maxLength={200}
            required
            onChange={(event) => updateTitle(event.target.value)}
            hint={
              <span className="flex flex-wrap gap-x-2">
                {t("admin.articles.editor.address")}:
                <span className="font-mono break-all text-ink" data-testid="article-url">
                  {articleUrl}
                </span>
              </span>
            }
          />

          <SlugField
            value={values.slug}
            onEdit={(slug) => {
              setSlugEdited(true);
              update("slug", slug);
            }}
            onRegenerate={() => {
              setSlugEdited(false);
              update("slug", slugFromTitle(values.title));
            }}
            checkAvailability={checkSlug}
            numbersWhenTaken={slugFollowsTitle}
          />

          {/* Side by side once the column is wide enough for both (a container query). */}
          <div className="@container">
            <div className="grid gap-6 @2xl:grid-cols-2">
              <TextAreaField
                label={t("admin.articles.editor.excerpt")}
                name="excerpt"
                value={values.excerpt}
                rows={4}
                minLength={EXCERPT_LENGTH.min}
                maxLength={EXCERPT_LENGTH.max}
                required
                onChange={(event) => update("excerpt", event.target.value)}
                hint={
                  <span className="flex flex-wrap justify-between gap-2">
                    {t("admin.articles.editor.excerptHint", EXCERPT_LENGTH)}
                    <CharacterCount
                      value={values.excerpt}
                      min={EXCERPT_LENGTH.min}
                      limit={EXCERPT_LENGTH.max}
                    />
                  </span>
                }
              />
              <SharePreview
                coverPath={values.coverPath}
                title={values.seoTitle.trim() || values.title.trim()}
                description={values.seoDescription.trim() || values.excerpt.trim()}
                card={{
                  title: values.title.trim(),
                  label: getCategory(values.categorySlug)?.label ?? "",
                  date: saved.publishAt ? formatDate(saved.publishAt) : "",
                }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span id={bodyLabelId} className={fieldLabelClasses}>
              {t("admin.articles.editor.body")}
            </span>
            <RichTextEditor
              imageFolder={articleFolder(articleId)}
              initialContent={initialValues.bodyJson}
              labelId={bodyLabelId}
              onChange={(bodyJson) => update("bodyJson", bodyJson)}
            />
          </div>

          <EditorPanel title={t("admin.cover.title")}>
            <CoverImageField
              coverPath={(token, width, extension) =>
                articleCoverPath(articleId, token, width, extension)
              }
              path={values.coverPath}
              alt={values.coverAlt}
              onUploaded={(path) => update("coverPath", path)}
              onRemove={() => update("coverPath", null)}
              onAltChange={(alt) => update("coverAlt", alt)}
              caption={{
                value: values.coverCaption,
                onChange: (caption) => update("coverCaption", caption),
              }}
            />
            <CoverPositionField
              value={values.coverPosition}
              onChange={(position) => update("coverPosition", position)}
            />
          </EditorPanel>

          <EditorPanel title={t("admin.articles.olympiad.title")}>
            {showOlympiadFields ? (
              <OlympiadFields
                values={values}
                onSubjectChange={(subject) => update("subject", subject)}
                onChange={(key, value) => update(key, value)}
              />
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" onClick={() => setShowOlympiad(true)}>
                  + {t("admin.articles.olympiad.show")}
                </Button>
                <span className="text-sm text-muted">{t("admin.articles.olympiad.optional")}</span>
              </div>
            )}
          </EditorPanel>

          <EditorPanel title={t("admin.articles.seo.title")}>
            <SeoPanel
              seoTitle={values.seoTitle}
              seoDescription={values.seoDescription}
              onSeoTitleChange={(value) => update("seoTitle", value)}
              onSeoDescriptionChange={(value) => update("seoDescription", value)}
            />
          </EditorPanel>
        </div>

        <aside className="flex flex-col gap-6">
          <PublishPanel
            mode={values.publishMode}
            scheduleAt={values.scheduleAt}
            note={isLive ? t("admin.publish.previewNote") : t("admin.publish.autosaveNote")}
            onModeChange={(mode) => update("publishMode", mode)}
            onScheduleAtChange={(value) => update("scheduleAt", value)}
          />

          <EditorPanel title={t("admin.articles.editor.settings")}>
            <div className="flex flex-col gap-5">
              <SelectField
                label={t("admin.articles.editor.category")}
                name="categorySlug"
                value={values.categorySlug}
                onChange={(event) => update("categorySlug", event.target.value)}
                options={[
                  { value: "", label: t("admin.articles.editor.chooseCategory") },
                  ...articleCategories.map((category) => ({
                    value: category.slug,
                    label: category.label,
                  })),
                ]}
              />
              <TagCombobox
                id="article-tags"
                value={values.tags}
                options={availableTags}
                onChange={(tags) => update("tags", tags)}
              />
              <TextField
                label={t("admin.articles.editor.author")}
                name="authorName"
                value={values.authorName}
                maxLength={80}
                onChange={(event) => update("authorName", event.target.value)}
              />
            </div>
          </EditorPanel>

          <EditorPanel title={t("admin.articles.flags.title")}>
            <CheckboxField
              label={t("admin.articles.flags.featured")}
              checked={values.isFeatured}
              onChange={(event) => update("isFeatured", event.target.checked)}
            />
            <CheckboxField
              label={t("admin.articles.flags.goodToKnow")}
              checked={values.isGoodToKnow}
              onChange={(event) => update("isGoodToKnow", event.target.checked)}
            />
            <CheckboxField
              label={t("admin.articles.flags.breaking")}
              checked={values.isBreaking}
              onChange={(event) => update("isBreaking", event.target.checked)}
            />
            <CheckboxField
              label={t("admin.articles.flags.special")}
              checked={values.isSpecial}
              onChange={(event) => update("isSpecial", event.target.checked)}
            />
            {values.isSpecial && (
              <TextField
                label={t("admin.articles.flags.specialUntil")}
                name="specialUntil"
                type="date"
                value={values.specialUntil}
                onChange={(event) => update("specialUntil", event.target.value)}
                hint={t("admin.articles.flags.specialUntilHint")}
              />
            )}
            <CheckboxField
              label={t("admin.articles.flags.commentsClosed")}
              checked={values.commentsClosed}
              onChange={(event) => update("commentsClosed", event.target.checked)}
            />
          </EditorPanel>

          <Link href={adminRoutes.articles} className="text-sm underline underline-offset-4">
            ← {t("admin.articles.editor.back")}
          </Link>
        </aside>
      </div>

      <LeaveGuardDialog guard={guard} />
    </>
  );
}
