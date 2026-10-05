import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { routes } from "@/config/navigation";
import { loginHref } from "@/lib/auth/reader";
import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { DeleteAccountButton, DisplayNameForm, SignOutButton } from "./account-forms";

export const metadata: Metadata = {
  title: t("account.title"),
  alternates: { canonical: routes.account },
  robots: { index: false, follow: false },
};

const sectionClasses = "flex flex-col gap-4 border-t border-line pt-6";
const sectionTitleClasses = "font-mono text-xs tracking-[0.08em] text-muted uppercase";

/** The reader's own account: the name shown with comments, signing out, and deleting it all. */
export default async function AccountPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) {
    redirect(loginHref(routes.account));
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, name_changed_at, role, banned")
    .eq("id", claims.sub)
    .maybeSingle();
  const isReader = profile?.role === "reader";

  return (
    <Container className="py-12 lg:py-20">
      <div className="mx-auto flex max-w-xl flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-3xl font-bold tracking-display lg:text-4xl">
            {t("account.title")}
          </h1>
          <p className="text-[15px] break-all text-graphite">{claims.email}</p>
        </div>

        {profile?.banned && (
          <p role="status" className="border-l-2 border-danger pl-3 text-sm text-danger">
            {t("account.banned")}
          </p>
        )}

        <section className={sectionClasses}>
          <h2 className={sectionTitleClasses}>{t("account.displayName")}</h2>
          {profile?.name_changed_at || !isReader ? (
            <>
              <p className="text-lg font-semibold">{profile?.display_name}</p>
              {isReader && <p className="text-sm text-muted">{t("account.nameLocked")}</p>}
            </>
          ) : (
            <DisplayNameForm name={profile?.display_name ?? ""} />
          )}
        </section>

        <section className={sectionClasses}>
          <h2 className={sectionTitleClasses}>{t("account.session")}</h2>
          <div>
            <SignOutButton />
          </div>
        </section>

        <section className={sectionClasses}>
          <h2 className={sectionTitleClasses}>{t("account.deleteTitle")}</h2>
          {isReader ? (
            <>
              <p className="text-sm leading-relaxed text-graphite">{t("account.deleteMessage")}</p>
              <DeleteAccountButton />
            </>
          ) : (
            <p className="text-sm text-muted">{t("account.errors.staffAccount")}</p>
          )}
        </section>
      </div>
    </Container>
  );
}
