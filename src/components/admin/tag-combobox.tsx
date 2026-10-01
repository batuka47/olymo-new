"use client";

import { useState, type KeyboardEvent } from "react";
import { fieldLabelClasses } from "@/components/ui/text-field";
import type { TagValue } from "@/lib/articles/schema";
import { cx } from "@/lib/cx";
import { t } from "@/lib/i18n";
import { slugify } from "@/lib/slug";

interface TagComboboxProps {
  id: string;
  value: TagValue[];
  options: TagValue[];
  onChange: (tags: TagValue[]) => void;
}

interface Suggestion {
  tag: TagValue;
  isNew: boolean;
}

/**
 * Picks existing tags or creates new ones as you type. Enter or comma adds the highlighted
 * suggestion; Backspace in an empty field removes the last tag.
 */
export function TagCombobox({ id, value, options, onChange }: TagComboboxProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const listId = `${id}-list`;
  const hintId = `${id}-hint`;

  const suggestions = buildSuggestions(query, value, options);
  const showList = open && query.trim() !== "" && suggestions.length > 0;

  function add(tag: TagValue) {
    onChange([...value, tag]);
    setQuery("");
    setActiveIndex(0);
  }

  function remove(slug: string) {
    onChange(value.filter((tag) => tag.slug !== slug));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      const suggestion = suggestions[activeIndex];
      if (query.trim() && suggestion) add(suggestion.tag);
    } else if (event.key === "Escape") {
      setOpen(false);
    } else if (event.key === "Backspace" && query === "" && value.length > 0) {
      remove(value[value.length - 1].slug);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={fieldLabelClasses}>
        {t("admin.articles.editor.tags")}
      </label>
      <div className="relative">
        <div className="flex min-h-12 flex-wrap items-center gap-2 border border-ink bg-white px-2 py-1.5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent">
          {value.map((tag) => (
            <span
              key={tag.slug}
              className="inline-flex h-8 items-center gap-1 border border-ink pl-2 text-sm"
            >
              {tag.label}
              <button
                type="button"
                onClick={() => remove(tag.slug)}
                aria-label={`${t("admin.articles.editor.removeTag")}: ${tag.label}`}
                className="flex size-8 cursor-pointer items-center justify-center hover:bg-ink hover:text-paper"
              >
                ×
              </button>
            </span>
          ))}
          <input
            id={id}
            role="combobox"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={showList ? `${id}-option-${activeIndex}` : undefined}
            aria-describedby={hintId}
            value={query}
            placeholder={
              value.length === 0 ? t("admin.articles.editor.tagsPlaceholder") : undefined
            }
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
              setOpen(true);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            className="h-8 min-w-40 flex-1 bg-transparent px-1 text-base focus-visible:outline-none"
          />
        </div>
        {showList && (
          <ul
            id={listId}
            role="listbox"
            className="absolute inset-x-0 top-full z-20 max-h-60 overflow-auto border border-t-0 border-ink bg-white"
          >
            {suggestions.map((suggestion, index) => (
              <li
                key={suggestion.tag.slug}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                onMouseDown={(event) => {
                  event.preventDefault();
                  add(suggestion.tag);
                }}
                className={cx(
                  "flex min-h-11 cursor-pointer items-center px-3 text-sm",
                  index === activeIndex && "bg-stone",
                )}
              >
                {suggestion.isNew
                  ? `+ ${t("admin.articles.editor.createTag")}: ${suggestion.tag.label}`
                  : suggestion.tag.label}
              </li>
            ))}
          </ul>
        )}
      </div>
      <p id={hintId} className="text-xs text-muted">
        {t("admin.articles.editor.tagsHint")}
      </p>
    </div>
  );
}

/** Exact match first, then "create", then partial matches, so Enter does what was typed. */
function buildSuggestions(query: string, selected: TagValue[], options: TagValue[]): Suggestion[] {
  const text = query.trim();
  const slug = slugify(text);
  if (!text || !slug) {
    return [];
  }

  const lowerText = text.toLowerCase();
  const isSameTag = (tag: TagValue) => tag.slug === slug || tag.label.toLowerCase() === lowerText;
  const selectedSlugs = new Set(selected.map((tag) => tag.slug));
  const available = options.filter((tag) => !selectedSlugs.has(tag.slug));
  const exact = available.find(isSameTag);
  const partial = available
    .filter(
      (tag) =>
        tag !== exact && (tag.label.toLowerCase().includes(lowerText) || tag.slug.includes(slug)),
    )
    .slice(0, 7);
  const canCreate = !exact && !selectedSlugs.has(slug) && !options.some(isSameTag);

  return [
    ...(exact ? [{ tag: exact, isNew: false }] : []),
    ...(canCreate ? [{ tag: { slug, label: text.slice(0, 60) }, isNew: true }] : []),
    ...partial.map((tag) => ({ tag, isNew: false })),
  ];
}
