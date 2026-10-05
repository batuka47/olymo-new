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
import { CharacterCount } from "@/components/ui/character-count";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { FormMessage } from "@/components/ui/form-message";
import { SelectField } from "@/components/ui/select-field";
import { fieldLabelClasses, TextField } from "@/components/ui/text-field";
import { TextAreaField } from "@/components/ui/textarea-field";
import { adminRoutes } from "@/config/admin";
import { eventPath, eventTypeLabelKeys, eventTypes, type EventType } from "@/config/events";
import { articleState } from "@/lib/articles/status";
import { toEventInput, type EventFormValues } from "@/lib/events/form";
import { useLeaveGuard } from "@/lib/hooks/use-leave-guard";
import { t } from "@/lib/i18n";
import { eventCoverPath, eventFolder } from "@/lib/media";
import type { PublishIntent } from "@/lib/publishing";
import { SLUG_PATTERN, slugify } from "@/lib/slug";
import { checkEventSlugAvailability, saveEvent } from "./actions";

const EXCERPT_LIMIT = 200;

interface SavedState {
  /** JSON of the form values as last saved; the form is "dirty" when it differs. */
  snapshot: string;
  exists: boolean;
  status: string;
  publishAt: string | null;
  slug: string;
}

/** The fields a draft needs before autosave can store it; the rest is checked on save. */
function canAutosave(values: EventFormValues): boolean {
  return (
    values.title.trim() !== "" &&
    SLUG_PATTERN.test(values.slug) &&
    values.startsAt !== "" &&
    (!values.coverPath || values.coverAlt.trim() !== "")
  );
}

interface EventEditorProps {
  eventId: string;
  initialValues: EventFormValues;
  saved: Omit<SavedState, "snapshot">;
}

export function EventEditor({ eventId, initialValues, saved: initialSaved }: EventEditorProps) {
  const bodyLabelId = useId();
  const [values, setValues] = useState(initialValues);
  const [saved, setSaved] = useState<SavedState>({
    ...initialSaved,
    snapshot: JSON.stringify(initialValues),
  });
  const [slugEdited, setSlugEdited] = useState(initialSaved.exists);
  const [saving, setSaving] = useState<SavingKind>(null);
  const [lastSaved, setLastSaved] = useState<LastSave | null>(null);
  const [error, setError] = useState<string>();
  const savingRef = useRef(false);

  const dirty = JSON.stringify(values) !== saved.snapshot;
  const guard = useLeaveGuard(dirty);
  const state = saved.exists ? articleState(saved.status, saved.publishAt) : "draft";
  const isLive = saved.exists && saved.status !== "draft";
  const checkSlug = useCallback(
    (slug: string) => checkEventSlugAvailability(slug, eventId),
    [eventId],
  );

  function update<K extends keyof EventFormValues>(key: K, value: EventFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  // As with articles: the slug follows the title until edited by hand or the event goes live.
  function updateTitle(title: string) {
    const followTitle = !slugEdited && !isLive;
    setValues((current) => ({
      ...current,
      title,
      slug: followTitle ? slugify(title) : current.slug,
    }));
  }

  async function save(intent: PublishIntent, { auto = false } = {}): Promise<boolean> {
    if (savingRef.current) return false;
    savingRef.current = true;
    setSaving(auto ? "auto" : "manual");
    setError(undefined);
    const snapshot = JSON.stringify(values);

    try {
      const result = await saveEvent(toEventInput(values, eventId, intent));
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
      });
      setLastSaved({ at: result.savedAt, auto });
      return true;
    } catch {
      setError(t("admin.events.errors.saveFailed"));
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
    const url = `${adminRoutes.preview}?event=${eventId}`;
    if (previewWindow) {
      previewWindow.location.href = url;
    } else {
      window.open(url, "_blank");
    }
  }

  function textField(
    key: "location" | "organizer" | "priceText" | "contactPhone" | "registrationUrl",
  ) {
    return {
      name: key,
      value: values[key],
      onChange: (event: { target: { value: string } }) => update(key, event.target.value),
    };
  }

  return (
    <>
      <PublishBar
        title={
          saved.exists ? t("admin.events.editor.editTitle") : t("admin.events.editor.newTitle")
        }
        state={state}
        saving={saving}
        lastSaved={lastSaved}
        dirty={dirty}
        isLive={isLive}
        publishMode={values.publishMode}
        viewHref={eventPath(saved.slug)}
        error={error}
        unpublishDialog={{
          title: t("admin.events.unpublish.title"),
          message: t("admin.events.unpublish.message"),
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
            label={t("admin.events.editor.title")}
            name="title"
            value={values.title}
            maxLength={200}
            required
            onChange={(event) => updateTitle(event.target.value)}
          />

          <SlugField
            value={values.slug}
            onEdit={(slug) => {
              setSlugEdited(true);
              update("slug", slug);
            }}
            onRegenerate={() => {
              setSlugEdited(false);
              update("slug", slugify(values.title));
            }}
            checkAvailability={checkSlug}
          />

          <TextAreaField
            label={t("admin.events.editor.excerpt")}
            name="excerpt"
            value={values.excerpt}
            rows={3}
            maxLength={EXCERPT_LIMIT}
            onChange={(event) => update("excerpt", event.target.value)}
            hint={
              <span className="flex flex-wrap justify-between gap-2">
                {t("admin.events.editor.excerptHint")}
                <CharacterCount value={values.excerpt} limit={EXCERPT_LIMIT} />
              </span>
            }
          />

          <EditorPanel title={t("admin.events.editor.details")}>
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                label={`${t("admin.events.editor.startsAt")} *`}
                name="startsAt"
                type="datetime-local"
                value={values.startsAt}
                required
                onChange={(event) => update("startsAt", event.target.value)}
              />
              <TextField
                label={t("admin.events.editor.endsAt")}
                name="endsAt"
                type="datetime-local"
                value={values.endsAt}
                min={values.startsAt || undefined}
                onChange={(event) => update("endsAt", event.target.value)}
              />
              <TextField
                label={t("admin.events.editor.location")}
                maxLength={200}
                hint={t("admin.events.editor.locationHint")}
                {...textField("location")}
              />
              <TextField
                label={t("admin.events.editor.organizer")}
                maxLength={200}
                {...textField("organizer")}
              />
              <TextField
                label={t("admin.events.editor.price")}
                maxLength={100}
                placeholder={t("events.free")}
                hint={t("admin.events.editor.priceHint")}
                {...textField("priceText")}
              />
              <TextField
                label={t("admin.events.editor.phone")}
                type="tel"
                maxLength={40}
                {...textField("contactPhone")}
              />
              <TextField
                label={t("admin.events.editor.registrationUrl")}
                type="url"
                inputMode="url"
                placeholder="https://"
                maxLength={500}
                className="sm:col-span-2"
                {...textField("registrationUrl")}
              />
            </div>
            <p className="mt-4 text-xs text-muted">{t("admin.events.editor.timeZoneNote")}</p>
          </EditorPanel>

          <div className="flex flex-col gap-2">
            <span id={bodyLabelId} className={fieldLabelClasses}>
              {t("admin.events.editor.body")}
            </span>
            <RichTextEditor
              imageFolder={eventFolder(eventId)}
              initialContent={initialValues.bodyJson}
              labelId={bodyLabelId}
              onChange={(bodyJson) => update("bodyJson", bodyJson)}
            />
          </div>

          <EditorPanel title={t("admin.cover.title")}>
            <CoverImageField
              coverPath={(token, width, extension) =>
                eventCoverPath(eventId, token, width, extension)
              }
              path={values.coverPath}
              alt={values.coverAlt}
              onUploaded={(path) => update("coverPath", path)}
              onRemove={() => update("coverPath", null)}
              onAltChange={(alt) => update("coverAlt", alt)}
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

          <EditorPanel title={t("admin.events.editor.settings")}>
            <div className="flex flex-col gap-5">
              <SelectField
                label={t("admin.events.editor.type")}
                name="eventType"
                value={values.eventType}
                onChange={(event) => update("eventType", event.target.value as EventType)}
                options={eventTypes.map((type) => ({
                  value: type,
                  label: t(eventTypeLabelKeys[type]),
                }))}
              />
              <CheckboxField
                label={t("admin.events.editor.featured")}
                checked={values.isFeatured}
                onChange={(event) => update("isFeatured", event.target.checked)}
              />
            </div>
          </EditorPanel>

          <Link href={adminRoutes.events} className="text-sm underline underline-offset-4">
            ← {t("admin.events.editor.back")}
          </Link>
        </aside>
      </div>

      <LeaveGuardDialog guard={guard} />
    </>
  );
}
