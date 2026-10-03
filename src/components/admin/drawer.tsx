"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { CloseIcon } from "@/components/icons";
import { t } from "@/lib/i18n";

interface DrawerProps {
  title: string;
  /** Esc, the close button and a click beside the panel call this; the parent unmounts it. */
  onClose: () => void;
  children: ReactNode;
}

/** A panel from the right edge on <dialog>: open while mounted, the page behind stays inert. */
export function Drawer({ title, onClose, children }: DrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      // The dialog itself is only hit beside the panel (the backdrop).
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-full max-w-xl border-l border-ink bg-paper p-0 text-ink backdrop:bg-ink/60"
    >
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-line py-2 pr-2 pl-5">
          <h2 id={titleId} className="font-display text-lg font-bold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("admin.dialog.close")}
            className="flex size-11 cursor-pointer items-center justify-center hover:bg-stone"
          >
            <CloseIcon className="size-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </dialog>
  );
}
