import type { Metadata } from "next";
import type { ComponentType, SVGProps } from "react";
import { MailIcon, MapPinIcon, PhoneIcon } from "@/components/icons";
import { FormPlaceholder } from "@/components/site/form-placeholder";
import { InfoPageLayout } from "@/components/site/info-page-layout";
import { routes } from "@/config/navigation";
import { isPlaceholder, siteConfig } from "@/config/site";
import { t } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";
import { telHref } from "@/lib/phone";
import { mapsHref } from "@/lib/url";

// The contact form comes in step 13.
export const metadata: Metadata = pageMetadata({
  url: routes.contact,
  title: t("pages.contact"),
  description: t("contactPage.description"),
});

interface ContactDetail {
  label: string;
  value: string;
  href: string | null;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

/** Address, email and phone from siteConfig; values still "[...]" are left out. */
function contactDetails(): ContactDetail[] {
  const details: ContactDetail[] = [
    {
      label: t("contactPage.address"),
      value: siteConfig.address,
      href: mapsHref(siteConfig.address),
      icon: MapPinIcon,
    },
    {
      label: t("contactPage.email"),
      value: siteConfig.email,
      href: `mailto:${siteConfig.email}`,
      icon: MailIcon,
    },
    {
      label: t("contactPage.phone"),
      value: siteConfig.phone,
      href: telHref(siteConfig.phone),
      icon: PhoneIcon,
    },
  ];
  return details.filter((detail) => detail.value !== "" && !isPlaceholder(detail.value));
}

function ContactDetails({ details }: { details: ContactDetail[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-3">
      {details.map((detail) => (
        <li key={detail.label} className="flex flex-col gap-3 border border-line p-5">
          <detail.icon className="size-5 text-accent" />
          <span className="font-mono text-[11px] tracking-label text-muted uppercase">
            {detail.label}
          </span>
          {detail.href ? (
            <a
              href={detail.href}
              className="inline-flex min-h-11 items-center text-[17px] font-semibold break-all underline underline-offset-4"
            >
              {detail.value}
            </a>
          ) : (
            <span className="text-[17px] font-semibold">{detail.value}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function ContactPage() {
  const details = contactDetails();
  return (
    <InfoPageLayout
      href={routes.contact}
      title={t("pages.contact")}
      lead={t("contactPage.description")}
    >
      {details.length > 0 && <ContactDetails details={details} />}
      <FormPlaceholder title={t("contactPage.formTitle")} />
    </InfoPageLayout>
  );
}
