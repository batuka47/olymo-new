"use client";

import type { Content } from "@tiptap/react";
import { useId, useRef, useState } from "react";
import { EditorBar } from "@/components/admin/editor/editor-bar";
import { EditorPanel } from "@/components/admin/editor/editor-panel";
import { LeaveGuardDialog } from "@/components/admin/editor/leave-guard-dialog";
import { SaveStatus, type LastSave } from "@/components/admin/editor/save-status";
import { ImageDropZone } from "@/components/admin/image-drop-zone";
import { ListEditor } from "@/components/admin/list-editor";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { Button, buttonClasses } from "@/components/ui/button";
import { CharacterCount } from "@/components/ui/character-count";
import { FormMessage } from "@/components/ui/form-message";
import { fieldLabelClasses, TextField } from "@/components/ui/text-field";
import { TextAreaField } from "@/components/ui/textarea-field";
import { hasPart, sitePageHref, type SitePageSlug } from "@/config/site-pages";
import { useLeaveGuard } from "@/lib/hooks/use-leave-guard";
import { t } from "@/lib/i18n";
import { encodeImageVariants } from "@/lib/images/encode";
import { uploadVariants } from "@/lib/images/upload";
import { sitePageFolder, teamPhotoPath } from "@/lib/media";
import {
  BLOCK_TEXT_MAX,
  BLOCK_TITLE_MAX,
  MAX_BLOCKS,
  STATEMENT_MAX,
} from "@/lib/site-pages/blocks";
import {
  newBlock,
  toSitePageInput,
  type BlockValues,
  type SitePageFormValues,
} from "@/lib/site-pages/form";
import {
  ANSWER_MAX,
  DESCRIPTION_MAX,
  NAME_MAX,
  QUESTION_MAX,
  ROLE_MAX,
  TITLE_MAX,
} from "@/lib/site-pages/schema";
import { LEGAL_NAME_TOKEN, SITE_NAME_TOKEN } from "@/lib/site-pages/text";
import { saveSitePage } from "./actions";

interface SitePageEditorProps {
  slug: SitePageSlug;
  initialValues: SitePageFormValues;
  /** Saved JSON, or the seeded HTML before the body was first edited. */
  initialBody: Content;
}

const tokensHint = t("admin.pages.tokensHint", {
  siteToken: SITE_NAME_TOKEN,
  legalToken: LEGAL_NAME_TOKEN,
});

function BlockList({
  prefix,
  blocks,
  onChange,
}: {
  prefix: string;
  blocks: BlockValues[];
  onChange: (blocks: BlockValues[]) => void;
}) {
  return (
    <ListEditor
      items={blocks}
      onChange={onChange}
      create={newBlock}
      max={MAX_BLOCKS}
      addLabel={t("admin.pages.blocks.add")}
      itemLabel={(index) => t("admin.pages.blocks.item", { number: index + 1 })}
      renderItem={(block, change) => (
        <div className="flex flex-col gap-4">
          <TextField
            label={t("admin.pages.blocks.title")}
            name={`${prefix}-${block.id}-title`}
            value={block.title}
            maxLength={BLOCK_TITLE_MAX}
            onChange={(event) => change({ title: event.target.value })}
          />
          <TextAreaField
            label={t("admin.pages.blocks.text")}
            name={`${prefix}-${block.id}-text`}
            value={block.text}
            rows={3}
            maxLength={BLOCK_TEXT_MAX}
            onChange={(event) => change({ text: event.target.value })}
          />
        </div>
      )}
    />
  );
}

export function SitePageEditor({ slug, initialValues, initialBody }: SitePageEditorProps) {
  const bodyLabelId = useId();
  const [values, setValues] = useState(initialValues);
  const [snapshot, setSnapshot] = useState(() => JSON.stringify(initialValues));
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<LastSave | null>(null);
  const [error, setError] = useState<string>();
  const savingRef = useRef(false);

  const dirty = JSON.stringify(values) !== snapshot;
  const guard = useLeaveGuard(dirty);

  function update<K extends keyof SitePageFormValues>(key: K, value: SitePageFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setError(undefined);
    const sent = JSON.stringify(values);
    try {
      const result = await saveSitePage(toSitePageInput(slug, values));
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSnapshot(sent);
      setLastSaved({ at: result.savedAt, auto: false });
    } catch {
      setError(t("admin.pages.errors.saveFailed"));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <>
      <EditorBar
        title={t("admin.pages.editTitle", { title: initialValues.title })}
        status={
          <SaveStatus saving={saving ? "manual" : null} lastSaved={lastSaved} dirty={dirty} />
        }
        actions={
          <>
            {!dirty && (
              <a
                href={sitePageHref(slug)}
                target="_blank"
                rel="noreferrer"
                className={buttonClasses({ variant: "outline" })}
              >
                {t("admin.pages.view")}
              </a>
            )}
            <Button onClick={save} disabled={saving}>
              {t("admin.pages.save")}
            </Button>
          </>
        }
      />

      <FormMessage state={{ error }} className="mb-6" />

      <div className="flex max-w-4xl flex-col gap-8">
        <p className="text-sm text-muted">{t("admin.pages.liveNote")}</p>

        <TextField
          label={t("admin.pages.fields.title")}
          name="title"
          value={values.title}
          maxLength={TITLE_MAX}
          required
          onChange={(event) => update("title", event.target.value)}
        />

        <TextAreaField
          label={t("admin.pages.fields.description")}
          name="description"
          value={values.description}
          rows={2}
          maxLength={DESCRIPTION_MAX}
          onChange={(event) => update("description", event.target.value)}
          hint={
            <span className="flex flex-wrap justify-between gap-2">
              {t("admin.pages.fields.descriptionHint")}
              <CharacterCount value={values.description} limit={DESCRIPTION_MAX} />
            </span>
          }
        />

        <div className="flex flex-col gap-2">
          <span id={bodyLabelId} className={fieldLabelClasses}>
            {t("admin.pages.fields.body")}
          </span>
          <RichTextEditor
            imageFolder={sitePageFolder(slug)}
            initialContent={initialBody}
            labelId={bodyLabelId}
            placeholder={t("admin.pages.fields.bodyPlaceholder")}
            onChange={(bodyJson) => update("bodyJson", bodyJson)}
          />
          <p className="text-xs leading-relaxed text-muted">{tokensHint}</p>
        </div>

        {hasPart(slug, "rationale") && (
          <EditorPanel title={t("aboutPage.rationale")}>
            <BlockList
              prefix="rationale"
              blocks={values.rationale}
              onChange={(blocks) => update("rationale", blocks)}
            />
          </EditorPanel>
        )}

        {hasPart(slug, "vision") && (
          <EditorPanel title={t("aboutPage.visionMission")}>
            <div className="flex flex-col gap-5">
              <TextAreaField
                label={t("aboutPage.vision")}
                name="vision"
                value={values.vision}
                rows={3}
                maxLength={STATEMENT_MAX}
                onChange={(event) => update("vision", event.target.value)}
              />
              <TextAreaField
                label={t("aboutPage.mission")}
                name="mission"
                value={values.mission}
                rows={3}
                maxLength={STATEMENT_MAX}
                onChange={(event) => update("mission", event.target.value)}
              />
            </div>
          </EditorPanel>
        )}

        {hasPart(slug, "benefits") && (
          <EditorPanel title={t("partnerPage.benefits")}>
            <BlockList
              prefix="benefits"
              blocks={values.benefits}
              onChange={(blocks) => update("benefits", blocks)}
            />
          </EditorPanel>
        )}

        {hasPart(slug, "faq") && (
          <EditorPanel title={t("admin.pages.faq.title")}>
            <ListEditor
              items={values.faq}
              onChange={(faq) => update("faq", faq)}
              create={() => ({ id: crypto.randomUUID(), question: "", answer: "" })}
              addLabel={t("admin.pages.faq.add")}
              itemLabel={(index) => t("admin.pages.faq.item", { number: index + 1 })}
              emptyText={t("admin.pages.faq.empty")}
              renderItem={(item, change) => (
                <div className="flex flex-col gap-4">
                  <TextField
                    label={t("admin.pages.faq.question")}
                    name={`faq-${item.id}-question`}
                    value={item.question}
                    maxLength={QUESTION_MAX}
                    onChange={(event) => change({ question: event.target.value })}
                  />
                  <TextAreaField
                    label={t("admin.pages.faq.answer")}
                    name={`faq-${item.id}-answer`}
                    value={item.answer}
                    rows={4}
                    maxLength={ANSWER_MAX}
                    hint={t("admin.pages.faq.answerHint")}
                    onChange={(event) => change({ answer: event.target.value })}
                  />
                </div>
              )}
            />
          </EditorPanel>
        )}

        {hasPart(slug, "team") && (
          <EditorPanel title={t("aboutPage.team")}>
            <p className="mb-4 text-sm text-muted">{t("admin.pages.team.note")}</p>
            <ListEditor
              items={values.team}
              onChange={(team) => update("team", team)}
              create={() => ({ id: crypto.randomUUID(), name: "", role: "", photoPath: null })}
              addLabel={t("admin.pages.team.add")}
              itemLabel={(index) => t("admin.pages.team.item", { number: index + 1 })}
              emptyText={t("admin.pages.team.empty")}
              renderItem={(member, change) => (
                <div className="grid gap-5 md:grid-cols-[14rem_minmax(0,1fr)]">
                  <ImageDropZone
                    name={`team-${member.id}-photo`}
                    path={member.photoPath}
                    previewClassName="aspect-square w-full max-w-40"
                    hint={t("admin.pages.team.photoHint")}
                    encode={encodeImageVariants}
                    store={(image) =>
                      uploadVariants(image, (token, width, extension) =>
                        teamPhotoPath(member.id, token, width, extension),
                      )
                    }
                    onUploaded={(path) => change({ photoPath: path })}
                    onRemove={() => change({ photoPath: null })}
                    removeLabel={t("admin.pages.team.removePhoto")}
                  />
                  <div className="flex flex-col gap-4">
                    <TextField
                      label={t("admin.pages.team.name")}
                      name={`team-${member.id}-name`}
                      value={member.name}
                      maxLength={NAME_MAX}
                      onChange={(event) => change({ name: event.target.value })}
                    />
                    <TextField
                      label={t("admin.pages.team.role")}
                      name={`team-${member.id}-role`}
                      value={member.role}
                      maxLength={ROLE_MAX}
                      onChange={(event) => change({ role: event.target.value })}
                    />
                  </div>
                </div>
              )}
            />
          </EditorPanel>
        )}
      </div>

      <LeaveGuardDialog guard={guard} />
    </>
  );
}
