"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";

interface ListEditorProps<T extends { id: string }> {
  items: T[];
  onChange: (items: T[]) => void;
  /** An empty row for the add button. */
  create: () => T;
  addLabel: string;
  /** Names row `index` for screen readers, e.g. "Асуулт 2". */
  itemLabel: (index: number) => string;
  max?: number;
  emptyText?: string;
  renderItem: (item: T, change: (changes: Partial<T>) => void) => ReactNode;
}

/** Rows to add, move up or down, and remove. The order shown is the order saved. */
export function ListEditor<T extends { id: string }>({
  items,
  onChange,
  create,
  addLabel,
  itemLabel,
  max,
  emptyText,
  renderItem,
}: ListEditorProps<T>) {
  function change(index: number, changes: Partial<T>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...changes } : item)));
  }

  function move(index: number, offset: -1 | 1) {
    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(index + offset, 0, item);
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-4">
      {items.length === 0 && emptyText && <p className="text-sm text-muted">{emptyText}</p>}
      {items.length > 0 && (
        <ol className="flex flex-col gap-4">
          {items.map((item, index) => {
            const label = itemLabel(index);
            return (
              <li key={item.id} aria-label={label} className="border border-line bg-white">
                <div className="flex items-center justify-between gap-3 border-b border-line py-1 pr-1 pl-4">
                  <span className="font-mono text-xs text-accent">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      aria-label={t("admin.list.moveUp", { item: label })}
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                    >
                      ↑
                    </Button>
                    <Button
                      variant="outline"
                      aria-label={t("admin.list.moveDown", { item: label })}
                      disabled={index === items.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      ↓
                    </Button>
                    <Button
                      variant="outline"
                      aria-label={t("admin.list.removeItem", { item: label })}
                      onClick={() => onChange(items.filter((_, i) => i !== index))}
                    >
                      {t("admin.list.remove")}
                    </Button>
                  </div>
                </div>
                <div className="p-4">{renderItem(item, (changes) => change(index, changes))}</div>
              </li>
            );
          })}
        </ol>
      )}
      {(max === undefined || items.length < max) && (
        <Button
          variant="outline"
          className="self-start"
          onClick={() => onChange([...items, create()])}
        >
          + {addLabel}
        </Button>
      )}
    </div>
  );
}
