import { cx } from "@/lib/cx";
import { t } from "@/lib/i18n";
import { fillTokens } from "@/lib/site-pages/text";

interface Statement {
  label: string;
  text: string;
  dark: boolean;
}

/** The vision on ink, the mission outlined; either is left out while empty. */
export function VisionMission({ vision, mission }: { vision: string; mission: string }) {
  const statements: Statement[] = [
    { label: t("aboutPage.vision"), text: vision, dark: true },
    { label: t("aboutPage.mission"), text: mission, dark: false },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {statements
        .filter((statement) => statement.text !== "")
        .map((statement) => (
          <div
            key={statement.label}
            className={cx(
              "flex flex-col gap-4 p-6 lg:p-8",
              statement.dark ? "bg-ink text-paper" : "border border-ink",
            )}
          >
            <h3
              className={cx(
                "font-mono text-xs tracking-[0.08em] uppercase",
                statement.dark ? "text-lime" : "text-accent",
              )}
            >
              {statement.label}
            </h3>
            <p className="font-display text-lg leading-snug font-bold lg:text-xl">
              {fillTokens(statement.text)}
            </p>
          </div>
        ))}
    </div>
  );
}
