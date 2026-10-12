import { Button } from "@/components/ui/button";
import { adminRoutes } from "@/config/admin";
import { t } from "@/lib/i18n";

/** Unknown admin address, or a deleted article or event: inside the admin menu, not the site. */
export default function AdminNotFound() {
  return (
    <div className="flex max-w-160 flex-col items-start gap-5">
      <p
        aria-hidden="true"
        className="font-display text-[96px] leading-none font-extrabold tracking-display lg:text-[160px]"
      >
        404
      </p>
      <h1 className="font-display text-2xl font-bold lg:text-[32px]">{t("notFound.title")}</h1>
      <p className="text-graphite">{t("notFound.adminLead")}</p>
      <Button href={adminRoutes.dashboard} variant="outline">
        {t("notFound.dashboard")}
      </Button>
    </div>
  );
}
