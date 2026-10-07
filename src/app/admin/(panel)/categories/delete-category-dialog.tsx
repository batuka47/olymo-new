"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/admin/modal";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { SelectField } from "@/components/ui/select-field";
import { isArticleCategory } from "@/config/categories";
import { t } from "@/lib/i18n";
import { deleteCategory } from "./actions";
import type { AdminCategory } from "./data";

interface DeleteCategoryDialogProps {
  /** The category to delete; null keeps the dialog closed. */
  category: AdminCategory | null;
  categories: AdminCategory[];
  onClose: () => void;
}

/**
 * Deletes an empty category at once; one with articles first asks where they go ("move its
 * articles to another category, then delete").
 */
export function DeleteCategoryDialog({ category, categories, onClose }: DeleteCategoryDialogProps) {
  const [moveTo, setMoveTo] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startDelete] = useTransition();
  const inUse = (category?.articleCount ?? 0) > 0;
  const targets = categories.filter(
    (other) => other.slug !== category?.slug && isArticleCategory(other),
  );

  function confirm() {
    if (!category) return;
    if (inUse && !moveTo) {
      setError(t("admin.categories.errors.moveTarget"));
      return;
    }
    setError(undefined);
    startDelete(async () => {
      const result = await deleteCategory(category.slug, inUse ? moveTo : null);
      if (result.ok) {
        onClose();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Modal
      open={category !== null}
      title={t("admin.categories.deleteDialog.title", { name: category?.label ?? "" })}
      description={
        inUse
          ? t("admin.categories.deleteDialog.inUse", { count: category?.articleCount ?? 0 })
          : t("admin.categories.deleteDialog.empty")
      }
      onClose={onClose}
      dismissible={!pending}
    >
      <div className="flex flex-col gap-5">
        {inUse && (
          <SelectField
            label={t("admin.categories.deleteDialog.moveTo")}
            name="moveTo"
            value={moveTo}
            onChange={(event) => setMoveTo(event.target.value)}
            options={[
              { value: "", label: t("admin.categories.deleteDialog.chooseTarget") },
              ...targets.map((target) => ({
                value: target.slug,
                label: target.is_active
                  ? target.label
                  : t("admin.articles.editor.hiddenCategory", { label: target.label }),
              })),
            ]}
          />
        )}
        <FormMessage state={{ error }} />
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={pending}>
            {t("admin.dialog.cancel")}
          </Button>
          <Button variant="danger" onClick={confirm} disabled={pending}>
            {pending
              ? t("admin.categories.deleteDialog.pending")
              : inUse
                ? t("admin.categories.deleteDialog.confirmMove")
                : t("admin.categories.deleteDialog.confirm")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
