import { Extension, type Editor } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";
import type { BlockDialog } from "./blocks";

// The editor's plugins are built once, before the component around them has its state. They talk
// to it with DOM events on the editor element instead of callbacks.

const DIALOG_EVENT = "body-editor:dialog";
const IMAGE_FILES_EVENT = "body-editor:image-files";

export interface ImageFilesRequest {
  files: File[];
  /** Where they were dropped; pasted files go to the cursor. */
  at?: number;
}

/** Asks the editor component to open the dialog (or file picker) a block needs. */
export function requestDialog(editor: Editor, dialog: BlockDialog) {
  editor.view.dom.dispatchEvent(new CustomEvent(DIALOG_EVENT, { detail: dialog }));
}

export function onDialogRequest(editor: Editor, handle: (dialog: BlockDialog) => void) {
  const listener = (event: Event) => handle((event as CustomEvent<BlockDialog>).detail);
  editor.view.dom.addEventListener(DIALOG_EVENT, listener);
  return () => editor.view.dom.removeEventListener(DIALOG_EVENT, listener);
}

export function onImageFiles(editor: Editor, handle: (request: ImageFilesRequest) => void) {
  const listener = (event: Event) => handle((event as CustomEvent<ImageFilesRequest>).detail);
  editor.view.dom.addEventListener(IMAGE_FILES_EVENT, listener);
  return () => editor.view.dom.removeEventListener(IMAGE_FILES_EVENT, listener);
}

/** Images pasted or dropped into the text are uploaded like the "Зураг" block. */
export const ImageFiles = Extension.create({
  name: "imageFiles",
  addProseMirrorPlugins() {
    const send = (dom: HTMLElement, request: ImageFilesRequest) =>
      dom.dispatchEvent(new CustomEvent(IMAGE_FILES_EVENT, { detail: request }));
    return [
      new Plugin({
        props: {
          handlePaste: (view, event) => {
            const files = [...(event.clipboardData?.files ?? [])];
            if (files.length === 0) return false;
            send(view.dom, { files });
            return true;
          },
          handleDrop: (view, event, _slice, moved) => {
            const files = [...(event.dataTransfer?.files ?? [])];
            if (moved || files.length === 0) return false;
            event.preventDefault();
            const at = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
            send(view.dom, { files, at });
            return true;
          },
        },
      }),
    ];
  },
});
