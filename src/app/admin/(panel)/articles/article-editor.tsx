"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ArticleStateBadge } from "@/components/admin/article-state-badge";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { TagCombobox } from "@/components/admin/tag-combobox";
import { Button, buttonClasses } from "@/components/ui/button";
import { CharacterCount } from "@/components/ui/character-count";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { FormMessage } from "@/components/ui/form-message";
import { SelectField } from "@/components/ui/select-field";
import { fieldLabelClasses, TextField } from "@/components/ui/text-field";
import { TextAreaField } from "@/components/ui/textarea-field";
import { adminRoutes } from "@/config/admin";
import { categories } from "@/config/categories";
import { toArticleInput, type ArticleFormValues } from "@/lib/articles/form";
import type { TagValue } from "@/lib/articles/schema";
import { articlePath, articleState } from "@/lib/articles/status";
import { cx } from "@/lib/cx";
import { formatDateTime, toUlaanbaatarInputValue } from "@/lib/dates";
import { useLeaveGuard } from "@/lib/hooks/use-leave-guard";
import { t } from "@/lib/i18n";
import { SLUG_PATTERN, slugify } from "@/lib/slug";
import { checkSlugAvailability, saveArticle } from "./actions";
import { CoverImageField } from "./cover-image-field";
import { OlympiadFields } from "./olympiad-fields";
import { SeoPanel } from "./seo-panel";

const AUTOSAVE_INTERVAL_MS = 30_000;
const EXCERPT_LIMIT = 200;

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
  coverVersion: string;
  availableTags: TagValue[];
  siteHost: string;
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
  coverVersion: initialCoverVersion,
  availableTags,
  siteHost,
}: ArticleEditorProps) {
  const bodyLabelId = useId();
  const [values, setValues] = useState(initialValues);
  const [saved, setSaved] = useState<SavedState>({
    ...initialSaved,
    snapshot: JSON.stringify(initialValues),
  });
  const [slugEdited, setSlugEdited] = useState(initialSaved.exists);
  const [showOlympiad, setShowOlympiad] = useState(false);
  const [coverVersion, setCoverVersion] = useState(initialCoverVersion);
  const [saving, setSaving] = useState<"manual" | "auto" | null>(null);
  const [lastSaved, setLastSaved] = useState<{ at: string; auto: boolean } | null>(null);
  const [error, setError] = useState<string>();
  const [slugCheck, setSlugCheck] = useState<{ slug: string; available: boolean | null } | null>(
    null,
  );
  const [confirmingUnpublish, setConfirmingUnpublish] = useState(false);
  const savingRef = useRef(false);

  const dirty = JSON.stringify(values) !== saved.snapshot;
  const guard = useLeaveGuard(dirty);
  const state = saved.exists ? articleState(saved.status, saved.publishAt) : "draft";
  const isLive = saved.exists && saved.status !== "draft";

  function update<K extends keyof ArticleFormValues>(key: K, value: ArticleFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  // The slug follows the title until it is edited by hand or the article goes live;
  // after that the public URL must not change behind the editor's back.
  function updateTitle(title: string) {
    const followTitle = !slugEdited && !isLive;
    setValues((current) => ({
      ...current,
      title,
      slug: followTitle ? slugify(title) : current.slug,
    }));
  }

  async function save(intent: "draft" | "publish", { auto = false } = {}): Promise<boolean> {
    if (savingRef.current) return false;
    savingRef.current = true;
    setSaving(auto ? "auto" : "manual");
    setError(undefined);
    const snapshot = JSON.stringify(values);

    try {
      const result = await saveArticle(toArticleInput(values, articleId, intent));
      if (!result.ok) {
        setError(result.error);
        return false;
      }
      setSaved({
        snapshot,
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

  // Autosave reads the latest render through a ref, so the interval never restarts.
  const latest = useRef({ values, saved, save });
  useEffect(() => {
    latest.current = { values, saved, save };
  });
  useEffect(() => {
    const timer = setInterval(() => {
      const { values: current, saved: lastSave, save: saveNow } = latest.current;
      const isDirty = JSON.stringify(current) !== lastSave.snapshot;
      if (lastSave.status === "draft" && isDirty && canAutosave(current)) {
        void saveNow("draft", { auto: true });
      }
    }, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!SLUG_PATTERN.test(values.slug)) return;
    const timer = setTimeout(async () => {
      const available = await checkSlugAvailability(values.slug, articleId);
      setSlugCheck({ slug: values.slug, available });
    }, 400);
    return () => clearTimeout(timer);
  }, [values.slug, articleId]);

  async function unpublish() {
    if (await save("draft")) {
      setConfirmingUnpublish(false);
    }
  }

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

  const showOlympiadFields =
    showOlympiad ||
    values.categorySlug === "olympiad" ||
    [values.subject, values.levelText, values.registrationDeadline, values.registrationUrl].some(
      Boolean,
    );

  return (
    <>
      <header className="sticky top-0 z-30 -mx-4 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-paper px-4 py-3 lg:-mx-8 lg:px-8">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <h1 className="font-display text-xl font-bold">
            {saved.exists
              ? t("admin.articles.editor.editTitle")
              : t("admin.articles.editor.newTitle")}
          </h1>
          <ArticleStateBadge state={state} />
          <SaveStatus saving={saving} lastSaved={lastSaved} dirty={dirty} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={openPreview} disabled={saving !== null}>
            {t("admin.articles.publish.preview")}
          </Button>
          {state === "published" && !dirty && (
            <a
              href={articlePath(saved.categorySlug, saved.slug)}
              target="_blank"
              rel="noreferrer"
              className={buttonClasses({ variant: "outline" })}
            >
              {t("admin.articles.publish.view")}
            </a>
          )}
          {isLive ? (
            <Button
              variant="outline"
              onClick={() => setConfirmingUnpublish(true)}
              disabled={saving !== null}
            >
              {t("admin.articles.publish.unpublish")}
            </Button>
          ) : (
            <Button variant="outline" onClick={() => save("draft")} disabled={saving !== null}>
              {t("admin.articles.publish.saveDraft")}
            </Button>
          )}
          <Button onClick={() => save("publish")} disabled={saving !== null}>
            {publishLabel(isLive, values.publishMode)}
          </Button>
        </div>
      </header>

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
          />

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-end gap-2">
              <TextField
                label={t("admin.articles.editor.slug")}
                name="slug"
                value={values.slug}
                maxLength={120}
                className="min-w-60 flex-1"
                onChange={(event) => {
                  setSlugEdited(true);
                  update("slug", event.target.value.toLowerCase());
                }}
              />
              <Button
                variant="outline"
                size="field"
                onClick={() => {
                  setSlugEdited(false);
                  update("slug", slugify(values.title));
                }}
              >
                {t("admin.articles.editor.slugRegenerate")}
              </Button>
            </div>
            <SlugStatus slug={values.slug} check={slugCheck} />
          </div>

          <TextAreaField
            label={t("admin.articles.editor.excerpt")}
            name="excerpt"
            value={values.excerpt}
            rows={3}
            maxLength={EXCERPT_LIMIT}
            onChange={(event) => update("excerpt", event.target.value)}
            hint={
              <span className="flex flex-wrap justify-between gap-2">
                {t("admin.articles.editor.excerptHint")}
                <CharacterCount value={values.excerpt} limit={EXCERPT_LIMIT} />
              </span>
            }
          />

          <div className="flex flex-col gap-2">
            <span id={bodyLabelId} className={fieldLabelClasses}>
              {t("admin.articles.editor.body")}
            </span>
            <RichTextEditor
              articleId={articleId}
              initialContent={initialValues.bodyJson}
              labelId={bodyLabelId}
              onChange={(bodyJson) => update("bodyJson", bodyJson)}
            />
          </div>

          <Panel title={t("admin.articles.cover.title")}>
            <CoverImageField
              articleId={articleId}
              path={values.coverPath}
              alt={values.coverAlt}
              version={coverVersion}
              onUploaded={(path, version) => {
                update("coverPath", path);
                setCoverVersion(version);
              }}
              onRemove={() => update("coverPath", null)}
              onAltChange={(alt) => update("coverAlt", alt)}
            />
          </Panel>

          <Panel title={t("admin.articles.olympiad.title")}>
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
          </Panel>

          <Panel title={t("admin.articles.seo.title")}>
            <SeoPanel
              title={values.title}
              excerpt={values.excerpt}
              seoTitle={values.seoTitle}
              seoDescription={values.seoDescription}
              coverPath={values.coverPath}
              coverVersion={coverVersion}
              siteHost={siteHost}
              onSeoTitleChange={(value) => update("seoTitle", value)}
              onSeoDescriptionChange={(value) => update("seoDescription", value)}
            />
          </Panel>
        </div>

        <aside className="flex flex-col gap-6">
          <Panel title={t("admin.articles.publish.title")}>
            <fieldset className="flex flex-col gap-1">
              <legend className="sr-only">{t("admin.articles.publish.title")}</legend>
              <RadioOption
                name="publishMode"
                checked={values.publishMode === "now"}
                onChange={() => update("publishMode", "now")}
                label={t("admin.articles.publish.now")}
              />
              <RadioOption
                name="publishMode"
                checked={values.publishMode === "schedule"}
                onChange={() => update("publishMode", "schedule")}
                label={t("admin.articles.publish.schedule")}
              />
            </fieldset>
            {values.publishMode === "schedule" && (
              <TextField
                label={t("admin.articles.publish.scheduleAt")}
                name="scheduleAt"
                type="datetime-local"
                value={values.scheduleAt}
                min={toUlaanbaatarInputValue(new Date())}
                onChange={(event) => update("scheduleAt", event.target.value)}
                className="mt-3"
              />
            )}
            <p className="mt-4 text-xs leading-relaxed text-muted">
              {isLive
                ? t("admin.articles.publish.previewNote")
                : t("admin.articles.publish.autosaveNote")}
            </p>
          </Panel>

          <Panel title={t("admin.articles.editor.settings")}>
            <div className="flex flex-col gap-5">
              <SelectField
                label={t("admin.articles.editor.category")}
                name="categorySlug"
                value={values.categorySlug}
                onChange={(event) => update("categorySlug", event.target.value)}
                options={[
                  { value: "", label: t("admin.articles.editor.chooseCategory") },
                  ...categories.map((category) => ({
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
          </Panel>

          <Panel title={t("admin.articles.flags.title")}>
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
          </Panel>

          <Link href={adminRoutes.articles} className="text-sm underline underline-offset-4">
            ← {t("admin.articles.editor.back")}
          </Link>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmingUnpublish}
        title={t("admin.articles.unpublish.title")}
        message={t("admin.articles.unpublish.message")}
        confirmLabel={t("admin.articles.unpublish.confirm")}
        pendingLabel={t("admin.articles.unpublish.pending")}
        pending={saving !== null}
        error={confirmingUnpublish ? error : undefined}
        danger
        onConfirm={unpublish}
        onCancel={() => setConfirmingUnpublish(false)}
      />

      <ConfirmDialog
        open={guard.pendingHref !== null}
        title={t("admin.articles.leave.title")}
        message={t("admin.articles.leave.message")}
        confirmLabel={t("admin.articles.leave.confirm")}
        danger
        onConfirm={guard.leave}
        onCancel={guard.stay}
      />
    </>
  );
}

function publishLabel(isLive: boolean, mode: ArticleFormValues["publishMode"]): string {
  if (isLive) return t("admin.articles.publish.update");
  return mode === "schedule"
    ? t("admin.articles.publish.scheduleButton")
    : t("admin.articles.publish.publish");
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border border-line p-5">
      <h2 className="mb-4 font-display text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

interface RadioOptionProps {
  name: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}

function RadioOption({ name, label, checked, onChange }: RadioOptionProps) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px]">
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="size-5 cursor-pointer accent-accent"
      />
      {label}
    </label>
  );
}

interface SaveStatusProps {
  saving: "manual" | "auto" | null;
  lastSaved: { at: string; auto: boolean } | null;
  dirty: boolean;
}

function SaveStatus({ saving, lastSaved, dirty }: SaveStatusProps) {
  let text = "";
  if (saving) {
    text = t("admin.articles.publish.saving");
  } else if (dirty) {
    text = t("admin.articles.publish.unsaved");
  } else if (lastSaved) {
    const label = lastSaved.auto
      ? t("admin.articles.publish.autosaved")
      : t("admin.articles.publish.saved");
    text = `${label} · ${formatDateTime(lastSaved.at)}`;
  }

  return (
    <span
      role="status"
      className={cx("font-mono text-[11px]", dirty && !saving ? "text-danger" : "text-muted")}
    >
      {text}
    </span>
  );
}

function SlugStatus({
  slug,
  check,
}: {
  slug: string;
  check: { slug: string; available: boolean | null } | null;
}) {
  if (!slug) {
    return <p className="text-xs text-muted">{t("admin.articles.editor.slugHint")}</p>;
  }
  if (!SLUG_PATTERN.test(slug)) {
    return <p className="text-xs text-danger">{t("admin.articles.errors.slug")}</p>;
  }
  if (check?.slug !== slug) {
    return <p className="text-xs text-muted">{t("admin.articles.editor.slugChecking")}</p>;
  }
  return check.available ? (
    <p className="text-xs text-muted">✓ {t("admin.articles.editor.slugAvailable")}</p>
  ) : (
    <p className="text-xs text-danger">{t("admin.articles.errors.slugTaken")}</p>
  );
}
