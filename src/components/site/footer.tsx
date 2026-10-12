import Link from "next/link";
import type { ReactNode } from "react";
import { MailIcon, PhoneIcon } from "@/components/icons";
import { Container } from "@/components/ui/container";
import { getPageGroups, type NavGroup, type NavLink } from "@/config/navigation";
import { isPlaceholder, siteConfig, type SocialNetwork } from "@/config/site";
import { t } from "@/lib/i18n";
import { telHref } from "@/lib/phone";

const socialNetworks: { key: SocialNetwork; name: string; shortName: string }[] = [
  { key: "facebook", name: "Facebook", shortName: "FB" },
  { key: "instagram", name: "Instagram", shortName: "IG" },
  { key: "youtube", name: "YouTube", shortName: "YT" },
  { key: "tiktok", name: "TikTok", shortName: "TT" },
];

interface ContactLink {
  href: string;
  label: string;
  icon: ReactNode;
  external?: boolean;
}

function emailLink(): ContactLink | null {
  if (isPlaceholder(siteConfig.email)) return null;
  return {
    href: `mailto:${siteConfig.email}`,
    label: siteConfig.email,
    icon: <MailIcon className="size-4.5" />,
  };
}

function phoneLink(): ContactLink | null {
  const href = isPlaceholder(siteConfig.phone) ? null : telHref(siteConfig.phone);
  if (!href) return null;
  return { href, label: siteConfig.phone, icon: <PhoneIcon className="size-4.5" /> };
}

function getContactLinks(): ContactLink[] {
  const socialLinks: ContactLink[] = socialNetworks
    .filter((network) => siteConfig.socials[network.key] !== "")
    .map((network) => ({
      href: siteConfig.socials[network.key],
      label: network.name,
      icon: network.shortName,
      external: true,
    }));

  return [emailLink(), phoneLink(), ...socialLinks].filter((link) => link !== null);
}

const columnTitleClasses =
  "sr-only font-mono text-[11px] tracking-[0.08em] text-ash uppercase lg:not-sr-only lg:mb-2";

function LinkColumn({ group, className }: { group: NavGroup; className?: string }) {
  return (
    <div className={className}>
      <h2 className={columnTitleClasses}>{group.title}</h2>
      <ul>
        {group.links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="flex min-h-11 items-center text-sm hover:underline lg:text-[15px]"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ContactColumn({ className }: { className?: string }) {
  const links = getContactLinks();
  if (links.length === 0) return null;

  return (
    <div className={className}>
      <h2 className={columnTitleClasses}>{t("footer.contact")}</h2>
      <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-0">
        {links.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
              className="flex size-11 items-center justify-center border border-ink-line font-mono text-xs hover:bg-coal lg:size-auto lg:min-h-11 lg:justify-start lg:border-0 lg:font-sans lg:text-[15px] lg:hover:bg-transparent lg:hover:underline"
            >
              <span aria-hidden="true" className="lg:hidden">
                {link.icon}
              </span>
              <span className="sr-only lg:not-sr-only">{link.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer({ categoryLinks }: { categoryLinks: NavLink[] }) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 bg-ink text-paper">
      <Container className="flex flex-col gap-6 pt-8 pb-6 lg:gap-12 lg:pt-16 lg:pb-8">
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="flex flex-col gap-4 lg:col-span-4">
            <p className="font-display text-2xl font-extrabold lg:text-[28px]">{siteConfig.name}</p>
            <p className="hidden max-w-80 text-[15px] leading-relaxed text-fog lg:block">
              {siteConfig.tagline}
            </p>
          </div>

          <LinkColumn
            group={{ title: t("nav.categories"), links: categoryLinks }}
            className="hidden lg:col-span-2 lg:block"
          />

          <div className="grid grid-cols-2 gap-x-4 lg:contents">
            {getPageGroups().map((group) => (
              <LinkColumn key={group.title} group={group} className="lg:col-span-2" />
            ))}
          </div>

          <ContactColumn className="lg:col-span-2" />
        </div>

        <p
          aria-hidden="true"
          className="hidden overflow-hidden font-display text-[clamp(120px,14vw,200px)] leading-[0.85] font-extrabold tracking-tighter whitespace-nowrap text-coal lg:block"
        >
          {siteConfig.name}
        </p>

        <div className="flex flex-col gap-1 border-t border-ink-line pt-5 font-mono text-[11px] text-ash lg:flex-row lg:justify-between lg:text-xs">
          <p>
            © {year} {siteConfig.name} · {t("footer.rights")}
          </p>
          <p>{t("footer.credit")}</p>
        </div>
      </Container>
    </footer>
  );
}
