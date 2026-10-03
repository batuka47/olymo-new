"use client";

import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { t } from "@/lib/i18n";
import type { useLeaveGuard } from "@/lib/hooks/use-leave-guard";

/** Asks before an in-app link leaves an editor with unsaved changes (see useLeaveGuard). */
export function LeaveGuardDialog({ guard }: { guard: ReturnType<typeof useLeaveGuard> }) {
  return (
    <ConfirmDialog
      open={guard.pendingHref !== null}
      title={t("admin.leave.title")}
      message={t("admin.leave.message")}
      confirmLabel={t("admin.leave.confirm")}
      danger
      onConfirm={guard.leave}
      onCancel={guard.stay}
    />
  );
}
