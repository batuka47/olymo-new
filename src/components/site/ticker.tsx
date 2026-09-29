import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Tag } from "@/components/ui/tag";
import type { NavLink } from "@/config/navigation";
import { cx } from "@/lib/cx";
import { t } from "@/lib/i18n";

const MAX_ITEMS = 3;

interface TickerProps {
  items: NavLink[];
}

export function Ticker({ items }: TickerProps) {
  const visibleItems = items.slice(0, MAX_ITEMS);
  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <section aria-label={t("ticker.label")} className="bg-ink text-paper">
      <Container className="flex h-11 items-center gap-4 font-mono text-xs tracking-label whitespace-nowrap uppercase lg:gap-6">
        <Tag variant="lime" className="shrink-0 font-bold">
          {t("ticker.new")}
        </Tag>
        <ul className="flex h-full min-w-0 items-center gap-6">
          {visibleItems.map((item, index) => (
            <li
              key={`${item.href}-${index}`}
              className={cx(
                "h-full min-w-0 items-center gap-6",
                index === 0 ? "flex" : "hidden lg:flex",
              )}
            >
              {index > 0 && (
                <span aria-hidden="true" className="opacity-40">
                  /
                </span>
              )}
              <Link href={item.href} className="flex h-full min-w-0 items-center hover:underline">
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
