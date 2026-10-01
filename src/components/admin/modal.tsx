"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  /** Called on Esc; ignored while `dismissible` is false (for example during a save). */
  onClose: () => void;
  dismissible?: boolean;
  children: ReactNode;
}

/** Modal built on <dialog>: the rest of the page is inert, focus stays inside, Esc closes. */
export function Modal({
  open,
  title,
  description,
  onClose,
  dismissible = true,
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && !dialog?.open) {
      dialog?.showModal();
    } else if (!open && dialog?.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        if (dismissible) onClose();
      }}
      className="m-auto w-[min(32rem,calc(100%-2rem))] border border-ink bg-paper p-6 text-ink backdrop:bg-ink/60"
    >
      <h2 id={titleId} className="font-display text-xl font-bold">
        {title}
      </h2>
      {description && (
        <p id={descriptionId} className="mt-3 text-sm leading-relaxed text-muted">
          {description}
        </p>
      )}
      {open && <div className="mt-5">{children}</div>}
    </dialog>
  );
}
