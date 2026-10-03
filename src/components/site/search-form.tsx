import { routes } from "@/config/navigation";
import { cx } from "@/lib/cx";
import { QUERY_MAX_LENGTH } from "@/lib/search/params";

interface SearchFormProps {
  id: string;
  label: string;
  placeholder: string;
  submitLabel: string;
  /** large: the input at the top of /search. */
  size?: "default" | "large";
  defaultValue?: string;
  /** Filters kept when searching again (?category=, ?tag=); null ones are left out. */
  keep?: Record<string, string | null>;
  autoFocus?: boolean;
  className?: string;
}

/** A plain GET form to /search?q=, so searching works before (or without) JavaScript. */
export function SearchForm({
  id,
  label,
  placeholder,
  submitLabel,
  size = "default",
  defaultValue,
  keep = {},
  autoFocus,
  className,
}: SearchFormProps) {
  const large = size === "large";
  return (
    <form
      action={routes.search}
      role="search"
      className={cx(
        "flex border border-ink bg-white focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent",
        className,
      )}
    >
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder={placeholder}
        maxLength={QUERY_MAX_LENGTH}
        enterKeyHint="search"
        autoFocus={autoFocus}
        className={cx(
          "min-w-0 flex-1 bg-transparent outline-none",
          large
            ? "h-14 px-4 text-lg lg:h-20 lg:px-6 lg:text-2xl"
            : "h-12 px-4 text-base lg:h-14 lg:px-5",
        )}
      />
      {Object.entries(keep).map(
        ([name, value]) => value && <input key={name} type="hidden" name={name} value={value} />,
      )}
      <button
        type="submit"
        className={cx(
          "shrink-0 cursor-pointer bg-accent font-mono tracking-label text-white uppercase hover:bg-ink",
          large
            ? "h-14 px-5 text-xs lg:h-20 lg:px-10 lg:text-sm"
            : "h-12 px-5 text-xs lg:h-14 lg:px-6",
        )}
      >
        {submitLabel}
      </button>
    </form>
  );
}
