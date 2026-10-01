"use client";

import { Modal } from "@/components/admin/modal";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  pendingLabel?: string;
  pending?: boolean;
  danger?: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  pendingLabel,
  pending = false,
  danger = false,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      description={message}
      onClose={onCancel}
      dismissible={!pending}
    >
      {error && (
        <p role="alert" className="mb-4 border-l-2 border-danger pl-3 text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={pending}>
          {t("admin.dialog.cancel")}
        </Button>
        <Button variant={danger ? "danger" : "ink"} onClick={onConfirm} disabled={pending}>
          {pending && pendingLabel ? pendingLabel : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
