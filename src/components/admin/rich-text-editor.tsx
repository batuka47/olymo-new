"use client";

import { Placeholder } from "@tiptap/extensions";
import {
  EditorContent,
  useEditor,
  useEditorState,
  type Editor,
  type JSONContent,
} from "@tiptap/react";
import { useState, type FormEvent } from "react";
import { Modal } from "@/components/admin/modal";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { fieldLabelClasses, TextField } from "@/components/ui/text-field";
import { cx } from "@/lib/cx";
import { articleExtensions } from "@/lib/editor/extensions";
import { t } from "@/lib/i18n";
import { uploadVariants } from "@/lib/images/upload";
import { ACCEPTED_IMAGE_TYPES, encodeImageVariants, MAX_SOURCE_BYTES } from "@/lib/images/encode";
import { articleFolder, responsiveImageSources } from "@/lib/media";

interface RichTextEditorProps {
  articleId: string;
  initialContent: JSONContent;
  onChange: (content: JSONContent) => void;
  labelId: string;
}

export function RichTextEditor({
  articleId,
  initialContent,
  onChange,
  labelId,
}: RichTextEditorProps) {
  const [dialog, setDialog] = useState<"link" | "image" | null>(null);

  const editor = useEditor({
    extensions: [
      ...articleExtensions,
      Placeholder.configure({ placeholder: t("admin.articles.editor.bodyPlaceholder") }),
    ],
    content: initialContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "article-body min-h-96 px-5 py-4",
        role: "textbox",
        "aria-multiline": "true",
        "aria-labelledby": labelId,
      },
    },
    onUpdate: ({ editor: current }) => onChange(current.getJSON()),
  });

  return (
    <div className="border border-ink bg-white">
      {editor && <Toolbar editor={editor} onOpenDialog={setDialog} />}
      <EditorContent editor={editor} />
      {editor && (
        <>
          <LinkDialog editor={editor} open={dialog === "link"} onClose={() => setDialog(null)} />
          <ImageDialog
            editor={editor}
            articleId={articleId}
            open={dialog === "image"}
            onClose={() => setDialog(null)}
          />
        </>
      )}
    </div>
  );
}

function Toolbar({
  editor,
  onOpenDialog,
}: {
  editor: Editor;
  onOpenDialog: (dialog: "link" | "image") => void;
}) {
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      h2: current.isActive("heading", { level: 2 }),
      h3: current.isActive("heading", { level: 3 }),
      bold: current.isActive("bold"),
      italic: current.isActive("italic"),
      link: current.isActive("link"),
      bulletList: current.isActive("bulletList"),
      orderedList: current.isActive("orderedList"),
      blockquote: current.isActive("blockquote"),
      canUndo: current.can().undo(),
      canRedo: current.can().redo(),
    }),
  });
  const chain = () => editor.chain().focus();

  return (
    <div
      role="toolbar"
      aria-label={t("admin.articles.toolbar.label")}
      className="flex flex-wrap gap-1 border-b border-line bg-paper p-2"
    >
      <ToolbarButton
        label={t("admin.articles.toolbar.h2")}
        active={state.h2}
        onClick={() => chain().toggleHeading({ level: 2 }).run()}
      />
      <ToolbarButton
        label={t("admin.articles.toolbar.h3")}
        active={state.h3}
        onClick={() => chain().toggleHeading({ level: 3 }).run()}
      />
      <ToolbarButton
        label={t("admin.articles.toolbar.bold")}
        active={state.bold}
        onClick={() => chain().toggleBold().run()}
        className="font-bold"
      />
      <ToolbarButton
        label={t("admin.articles.toolbar.italic")}
        active={state.italic}
        onClick={() => chain().toggleItalic().run()}
        className="italic"
      />
      <ToolbarButton
        label={t("admin.articles.toolbar.link")}
        active={state.link}
        onClick={() => onOpenDialog("link")}
      />
      <ToolbarButton
        label={t("admin.articles.toolbar.bulletList")}
        active={state.bulletList}
        onClick={() => chain().toggleBulletList().run()}
      />
      <ToolbarButton
        label={t("admin.articles.toolbar.orderedList")}
        active={state.orderedList}
        onClick={() => chain().toggleOrderedList().run()}
      />
      <ToolbarButton
        label={t("admin.articles.toolbar.blockquote")}
        active={state.blockquote}
        onClick={() => chain().toggleBlockquote().run()}
      />
      <ToolbarButton
        label={t("admin.articles.toolbar.image")}
        onClick={() => onOpenDialog("image")}
      />
      <ToolbarButton
        label={t("admin.articles.toolbar.rule")}
        onClick={() => chain().setHorizontalRule().run()}
      />
      <ToolbarButton
        label={`↶ ${t("admin.articles.toolbar.undo")}`}
        disabled={!state.canUndo}
        onClick={() => chain().undo().run()}
      />
      <ToolbarButton
        label={`↷ ${t("admin.articles.toolbar.redo")}`}
        disabled={!state.canRedo}
        onClick={() => chain().redo().run()}
      />
    </div>
  );
}

interface ToolbarButtonProps {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  className?: string;
}

function ToolbarButton({ label, onClick, active, disabled, className }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cx(
        "h-10 cursor-pointer border px-3 text-sm whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-40",
        active ? "border-ink bg-ink text-paper" : "border-line bg-white hover:border-ink",
        className,
      )}
    >
      {label}
    </button>
  );
}

/** Accepts http(s) and mailto links; "example.mn" becomes "https://example.mn". */
function normalizeLink(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  try {
    const url = new URL(/^[a-z][a-z+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`);
    return ["http:", "https:", "mailto:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function LinkDialog({
  editor,
  open,
  onClose,
}: {
  editor: Editor;
  open: boolean;
  onClose: () => void;
}) {
  const [error, setError] = useState<string>();
  const currentHref = editor.getAttributes("link").href as string | undefined;

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const href = normalizeLink(String(new FormData(event.currentTarget).get("href") ?? ""));
    if (!href) {
      setError(t("admin.articles.link.invalid"));
      return;
    }
    if (editor.state.selection.empty && !editor.isActive("link")) {
      editor
        .chain()
        .focus()
        .insertContent({ type: "text", text: href, marks: [{ type: "link", attrs: { href } }] })
        .run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    }
    close();
  }

  function remove() {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    close();
  }

  function close() {
    setError(undefined);
    onClose();
  }

  return (
    <Modal open={open} title={t("admin.articles.link.title")} onClose={close}>
      <form onSubmit={apply} className="flex flex-col gap-4" noValidate>
        <TextField
          label={t("admin.articles.link.url")}
          name="href"
          type="url"
          inputMode="url"
          defaultValue={currentHref ?? "https://"}
          autoFocus
        />
        <FormMessage state={{ error }} />
        <div className="flex flex-wrap justify-end gap-3">
          {currentHref && (
            <Button variant="outline" onClick={remove}>
              {t("admin.articles.link.remove")}
            </Button>
          )}
          <Button variant="outline" onClick={close}>
            {t("admin.dialog.cancel")}
          </Button>
          <Button type="submit" variant="ink">
            {t("admin.articles.link.apply")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

interface ImageDialogProps {
  editor: Editor;
  articleId: string;
  open: boolean;
  onClose: () => void;
}

function ImageDialog({ editor, articleId, open, onClose }: ImageDialogProps) {
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string>();

  async function insert(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const file = form.get("image");
    const alt = String(form.get("alt") ?? "").trim();

    if (!(file instanceof File) || !ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError(t("admin.articles.cover.invalidType"));
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      setError(t("admin.articles.cover.tooLarge"));
      return;
    }

    setWorking(true);
    setError(undefined);
    try {
      const image = await encodeImageVariants(file);
      const name = `body-${Date.now().toString(36)}`;
      const path = await uploadVariants(
        image,
        (width, extension) => `${articleFolder(articleId)}/${name}-${width}.${extension}`,
      );
      const { src, srcSet } = responsiveImageSources(path);
      editor
        .chain()
        .focus()
        .insertContent({
          type: "image",
          attrs: { src, srcset: srcSet, sizes: "(min-width: 1024px) 760px, 100vw", alt },
        })
        .run();
      onClose();
    } catch {
      setError(t("admin.articles.cover.failed"));
    } finally {
      setWorking(false);
    }
  }

  return (
    <Modal
      open={open}
      title={t("admin.articles.image.title")}
      onClose={onClose}
      dismissible={!working}
    >
      <form onSubmit={insert} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-2">
          <label htmlFor="body-image" className={fieldLabelClasses}>
            {t("admin.articles.image.file")}
          </label>
          <input
            id="body-image"
            name="image"
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            className="text-sm file:mr-3 file:h-11 file:cursor-pointer file:border file:border-ink file:bg-white file:px-4"
            required
          />
        </div>
        <TextField
          label={t("admin.articles.image.alt")}
          name="alt"
          hint={t("admin.articles.image.altHint")}
        />
        <FormMessage state={{ error }} />
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={working}>
            {t("admin.dialog.cancel")}
          </Button>
          <Button type="submit" variant="ink" disabled={working}>
            {working ? t("admin.articles.image.working") : t("admin.articles.image.insert")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
