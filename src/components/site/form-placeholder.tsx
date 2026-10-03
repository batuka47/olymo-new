import { t } from "@/lib/i18n";

/** Holds the place of a form that comes in step 13 (advertise, submit, partner, contact). */
export function FormPlaceholder({ title }: { title: string }) {
  return (
    <section
      aria-labelledby="form-placeholder-title"
      className="flex flex-col gap-3 border border-dashed border-ink p-6 lg:p-8"
    >
      <p className="font-mono text-xs tracking-[0.08em] text-muted uppercase">
        [ {t("formPlaceholder.label")} ]
      </p>
      <h2 id="form-placeholder-title" className="font-display text-xl font-bold lg:text-2xl">
        {title}
      </h2>
      <p className="text-[15px] leading-relaxed text-graphite">{t("formPlaceholder.text")}</p>
    </section>
  );
}
