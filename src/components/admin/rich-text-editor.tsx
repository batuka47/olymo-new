"use client";

import {
  EditorContent,
  useEditor,
  type Content,
  type Editor,
  type JSONContent,
} from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import { BlockHandle } from "@/components/admin/body-editor/block-handle";
import type { BlockDialog } from "@/components/admin/body-editor/blocks";
import { EmbedDialog, LinkDialog, PostLinkDialog } from "@/components/admin/body-editor/dialogs";
import { onDialogRequest, onImageFiles } from "@/components/admin/body-editor/editor-events";
import { editorExtensions } from "@/components/admin/body-editor/editor-extensions";
import {
  ImageUploadsContext,
  useImageUploads,
  type UploadedImage,
} from "@/components/admin/body-editor/image-uploads";
import { Toolbar } from "@/components/admin/body-editor/toolbar";
import { galleryImage } from "@/components/admin/body-editor/views/gallery-view";
import { FormMessage } from "@/components/ui/form-message";
import { t } from "@/lib/i18n";
import { IMAGE_INPUT_ACCEPT } from "@/lib/images/encode";

interface RichTextEditorProps {
  /** Media bucket folder for images added to the text, e.g. articles/{id}. */
  imageFolder: string;
  /** Saved JSON, or HTML for text that has not been through the editor yet (seeded pages). */
  initialContent: Content;
  onChange: (content: JSONContent) => void;
  labelId: string;
  placeholder?: string;
}

type Dialog = "link" | "youtube" | "social" | "embed";

function imageNode(image: UploadedImage) {
  return {
    type: "image",
    attrs: {
      src: image.src,
      srcset: image.srcset,
      alt: "",
      width: image.width,
      height: image.height,
    },
  };
}

function imageFiles(list: FileList | null | undefined): File[] {
  return [...(list ?? [])];
}

/**
 * The body editor of articles, events and info pages: a block editor ("/" menu, "+" and drag
 * handle beside each block) with a fixed toolbar on top. Images can also be pasted or dropped.
 */
export function RichTextEditor({
  imageFolder,
  initialContent,
  onChange,
  labelId,
  placeholder = t("admin.articles.editor.bodyPlaceholder"),
}: RichTextEditorProps) {
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const uploads = useImageUploads(imageFolder);
  const filePicker = useRef<HTMLInputElement>(null);
  const pickingFor = useRef<"image" | "gallery">("image");

  const editor = useEditor({
    extensions: editorExtensions(placeholder),
    content: initialContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "article-body min-h-96 py-4 pr-5 pl-16",
        role: "textbox",
        "aria-multiline": "true",
        "aria-labelledby": labelId,
      },
    },
    onUpdate: ({ editor: current }) => onChange(current.getJSON()),
  });

  async function insertImages(editorInstance: Editor, files: File[], at?: number) {
    const images = await uploads.upload(files);
    if (images.length === 0) return;
    const position = Math.min(
      at ?? editorInstance.state.selection.to,
      editorInstance.state.doc.content.size,
    );
    editorInstance.chain().focus().insertContentAt(position, images.map(imageNode)).run();
  }

  async function insertGallery(editorInstance: Editor, files: File[]) {
    const images = await uploads.upload(files);
    if (images.length === 0) return;
    editorInstance
      .chain()
      .focus()
      .insertContent({ type: "gallery", attrs: { images: images.map(galleryImage) } })
      .run();
  }

  function openDialog(next: BlockDialog | "link") {
    if (next === "image" || next === "gallery") {
      pickingFor.current = next;
      if (filePicker.current) filePicker.current.multiple = next === "gallery";
      filePicker.current?.click();
    } else {
      setDialog(next);
    }
  }

  // The "/" menu and pasted or dropped images reach here as events (see editor-events.ts).
  useEffect(() => {
    if (!editor) return;
    const stopDialogs = onDialogRequest(editor, openDialog);
    const stopFiles = onImageFiles(editor, ({ files, at }) => void insertImages(editor, files, at));
    return () => {
      stopDialogs();
      stopFiles();
    };
  });

  return (
    <ImageUploadsContext.Provider value={uploads}>
      <div className="border border-ink bg-white">
        {editor && <Toolbar editor={editor} onOpenDialog={openDialog} />}
        {uploads.progress !== null && (
          <div
            role="status"
            className="flex items-center gap-3 border-b border-line bg-paper px-4 py-2"
          >
            <span className="font-mono text-xs">
              {t("editor.image.progress", { percent: Math.round(uploads.progress * 100) })}
            </span>
            <span aria-hidden="true" className="h-1 flex-1 bg-line">
              <span
                className="block h-full bg-accent transition-[width]"
                style={{ width: `${Math.round(uploads.progress * 100)}%` }}
              />
            </span>
          </div>
        )}
        <FormMessage state={{ error: uploads.error }} className="mx-4 mt-3" />
        <div className="relative">
          <EditorContent editor={editor} />
          {editor && <BlockHandle editor={editor} />}
        </div>
        <input
          ref={filePicker}
          type="file"
          accept={IMAGE_INPUT_ACCEPT}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          name="bodyImage"
          onChange={(event) => {
            const files = imageFiles(event.target.files);
            event.target.value = "";
            if (!editor || files.length === 0) return;
            void (pickingFor.current === "gallery"
              ? insertGallery(editor, files)
              : insertImages(editor, files));
          }}
        />
        {editor && (
          <>
            <LinkDialog editor={editor} open={dialog === "link"} onClose={() => setDialog(null)} />
            <PostLinkDialog
              editor={editor}
              kind="youtube"
              open={dialog === "youtube"}
              onClose={() => setDialog(null)}
            />
            <PostLinkDialog
              editor={editor}
              kind="social"
              open={dialog === "social"}
              onClose={() => setDialog(null)}
            />
            <EmbedDialog
              editor={editor}
              open={dialog === "embed"}
              onClose={() => setDialog(null)}
            />
          </>
        )}
      </div>
    </ImageUploadsContext.Provider>
  );
}
