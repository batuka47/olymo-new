"use client";

import Link from "next/link";
import { useState, useTransition, type DragEvent } from "react";
import { Button, buttonClasses } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Tag } from "@/components/ui/tag";
import { adminRoutes } from "@/config/admin";
import { EVENTS_CATEGORY_SLUG } from "@/config/categories";
import { cx } from "@/lib/cx";
import { t } from "@/lib/i18n";
import { reorderCategories, setCategoryActive } from "./actions";
import type { AdminCategory } from "./data";
import { DeleteCategoryDialog } from "./delete-category-dialog";

const arrowClasses =
  "flex size-11 cursor-pointer items-center justify-center text-muted hover:bg-stone hover:text-ink disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent";

/**
 * The categories in menu order. Rows are dragged into place, or moved with the arrows (keyboard
 * and touch); each move is saved at once. Also hides, shows and deletes.
 */
export function CategoryManager({ categories }: { categories: AdminCategory[] }) {
  // The order as shown: moves apply at once and the saved list replaces it when it arrives.
  const [arranged, setArranged] = useState({ from: categories, rows: categories });
  const rows = arranged.from === categories ? arranged.rows : categories;
  const [dragging, setDragging] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<AdminCategory | null>(null);
  const [status, setStatus] = useState<{ error?: string; success?: string }>({});
  const [, startSaving] = useTransition();

  function save(action: () => Promise<{ ok: boolean; error?: string }>, undo: () => void) {
    setStatus({});
    startSaving(async () => {
      const result = await action();
      if (result.ok) {
        setStatus({ success: t("admin.categories.saved") });
      } else {
        setStatus({ error: result.error });
        undo();
      }
    });
  }

  function move(from: number, to: number) {
    if (from === to || to < 0 || to >= rows.length) return;
    const next = [...rows];
    const [row] = next.splice(from, 1);
    next.splice(to, 0, row);
    setArranged({ from: categories, rows: next });
    save(
      () => reorderCategories(next.map((category) => category.slug)),
      () => setArranged({ from: categories, rows: categories }),
    );
  }

  function toggleActive(category: AdminCategory) {
    const next = rows.map((row) =>
      row.slug === category.slug ? { ...row, is_active: !row.is_active } : row,
    );
    setArranged({ from: categories, rows: next });
    save(
      () => setCategoryActive(category.slug, !category.is_active),
      () => setArranged({ from: categories, rows: categories }),
    );
  }

  function drop(event: DragEvent, index: number) {
    event.preventDefault();
    if (dragging !== null) move(dragging, index);
    setDragging(null);
    setDropTarget(null);
  }

  return (
    <>
      <FormMessage state={status} className="mb-4" />
      <ol className="border-t border-ink">
        {rows.map((category, index) => (
          <li
            key={category.slug}
            data-category={category.slug}
            draggable
            onDragStart={(event) => {
              setDragging(index);
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", category.slug);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setDropTarget(index);
            }}
            onDrop={(event) => drop(event, index)}
            onDragEnd={() => {
              setDragging(null);
              setDropTarget(null);
            }}
            className={cx(
              "grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 border-b border-line bg-paper py-2 md:grid-cols-[auto_minmax(0,1fr)_auto]",
              dragging === index && "opacity-40",
              dropTarget === index &&
                dragging !== null &&
                dragging !== index &&
                "border-t-2 border-t-accent",
            )}
          >
            <div className="flex items-center">
              <span
                aria-hidden="true"
                title={t("admin.categories.drag")}
                className="flex size-11 cursor-grab items-center justify-center text-muted active:cursor-grabbing"
              >
                <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
                  <circle cx="2" cy="3" r="1.5" />
                  <circle cx="8" cy="3" r="1.5" />
                  <circle cx="2" cy="8" r="1.5" />
                  <circle cx="8" cy="8" r="1.5" />
                  <circle cx="2" cy="13" r="1.5" />
                  <circle cx="8" cy="13" r="1.5" />
                </svg>
              </span>
              <button
                type="button"
                className={arrowClasses}
                aria-label={t("admin.categories.moveUp", { name: category.label })}
                disabled={index === 0}
                onClick={() => move(index, index - 1)}
              >
                <span aria-hidden="true">↑</span>
              </button>
              <button
                type="button"
                className={arrowClasses}
                aria-label={t("admin.categories.moveDown", { name: category.label })}
                disabled={index === rows.length - 1}
                onClick={() => move(index, index + 1)}
              >
                <span aria-hidden="true">↓</span>
              </button>
            </div>

            <div className="flex min-w-0 flex-col gap-1.5">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <Link
                  href={`${adminRoutes.categories}/${category.slug}`}
                  className="font-semibold underline-offset-4 hover:underline"
                >
                  {category.label}
                </Link>
                <span className="font-mono text-xs text-muted">/{category.slug}</span>
                <span className="font-mono text-xs text-muted">
                  {t("admin.categories.articleCount", { count: category.articleCount })}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {category.slug === EVENTS_CATEGORY_SLUG && (
                  <Tag>{t("admin.categories.badges.events")}</Tag>
                )}
                {!category.is_active && (
                  <Tag variant="ink">{t("admin.categories.badges.hidden")}</Tag>
                )}
                {category.is_active && !category.show_in_nav && (
                  <Tag>{t("admin.categories.badges.notInNav")}</Tag>
                )}
                {category.show_on_home && (
                  <Tag variant="accent">{t("admin.categories.badges.home")}</Tag>
                )}
                {category.has_olympiad_fields && (
                  <Tag variant="lime">{t("admin.categories.badges.olympiad")}</Tag>
                )}
              </div>
            </div>

            <div className="col-span-2 flex flex-wrap gap-2 pl-1 md:col-span-1 md:justify-end">
              <Link
                href={`${adminRoutes.categories}/${category.slug}`}
                className={buttonClasses({ variant: "ink" })}
              >
                {t("admin.categories.actions.edit")}
              </Link>
              <Button variant="outline" onClick={() => toggleActive(category)}>
                {category.is_active
                  ? t("admin.categories.actions.hide")
                  : t("admin.categories.actions.show")}
              </Button>
              {category.slug !== EVENTS_CATEGORY_SLUG && (
                <Button variant="outline" onClick={() => setDeleting(category)}>
                  {t("admin.categories.actions.delete")}
                </Button>
              )}
            </div>
          </li>
        ))}
      </ol>

      <DeleteCategoryDialog
        key={deleting?.slug ?? "closed"}
        category={deleting}
        categories={rows}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
