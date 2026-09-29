import { categories, categoryPath } from "@/config/categories";
import { t, type MessageKey } from "@/lib/i18n";

export const routes = {
  home: "/",
  search: "/search",
  submit: "/submit",
  about: "/about",
  faq: "/faq",
  editorialPolicy: "/editorial-policy",
  privacy: "/privacy",
  advertise: "/advertise",
  partner: "/partner",
  contact: "/contact",
} as const;

export interface NavLink {
  href: string;
  label: string;
}

export interface NavGroup {
  title: string;
  links: NavLink[];
}

interface PageGroupConfig {
  titleKey: MessageKey;
  links: readonly { href: string; labelKey: MessageKey }[];
}

const pageGroups = [
  {
    titleKey: "nav.info",
    links: [
      { href: routes.about, labelKey: "pages.about" },
      { href: routes.faq, labelKey: "pages.faq" },
      { href: routes.editorialPolicy, labelKey: "pages.editorialPolicy" },
      { href: routes.privacy, labelKey: "pages.privacy" },
    ],
  },
  {
    titleKey: "nav.partner",
    links: [
      { href: routes.advertise, labelKey: "pages.advertise" },
      { href: routes.partner, labelKey: "pages.partner" },
      { href: routes.contact, labelKey: "pages.contact" },
    ],
  },
] as const satisfies readonly PageGroupConfig[];

export function getCategoryLinks(): NavLink[] {
  return categories.map((category) => ({
    href: categoryPath(category.slug),
    label: category.label,
  }));
}

export function getPageGroups(): NavGroup[] {
  return pageGroups.map((group) => ({
    title: t(group.titleKey),
    links: group.links.map((link) => ({ href: link.href, label: t(link.labelKey) })),
  }));
}
