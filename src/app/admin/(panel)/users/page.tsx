import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Tag } from "@/components/ui/tag";
import { isStaffRole, staffRoles, type StaffRole } from "@/lib/auth/roles";
import { requireAdmin } from "@/lib/auth/staff";
import { formatDateTime } from "@/lib/dates";
import { t } from "@/lib/i18n";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { InviteForm } from "./invite-form";
import { StaffActions } from "./staff-actions";

export const metadata: Metadata = { title: t("admin.users.title") };

interface StaffMember {
  id: string;
  email: string;
  displayName: string | null;
  role: StaffRole;
  invitePending: boolean;
  lastSignInAt: string | null;
}

async function getStaffMembers(): Promise<StaffMember[]> {
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, role")
    .in("role", staffRoles)
    .order("created_at");

  // Emails and sign-in dates live in auth.users, which only the service role can read.
  const adminClient = createAdminClient();
  const members = await Promise.all(
    (profiles ?? []).map(async (profile) => {
      const { data } = await adminClient.auth.admin.getUserById(profile.id);
      const user = data.user;
      return {
        id: profile.id,
        email: user?.email ?? "",
        displayName: profile.display_name,
        role: profile.role,
        invitePending: Boolean(user?.invited_at) && !user?.last_sign_in_at,
        lastSignInAt: user?.last_sign_in_at ?? null,
      };
    }),
  );
  return members.filter((member): member is StaffMember => isStaffRole(member.role));
}

function signInStatus(member: StaffMember): string {
  if (member.invitePending) {
    return t("admin.users.pending");
  }
  if (!member.lastSignInAt) {
    return t("admin.users.neverSignedIn");
  }
  return `${t("admin.users.lastSignIn")}: ${formatDateTime(member.lastSignInAt)}`;
}

export default async function AdminUsersPage() {
  const currentAdmin = await requireAdmin();
  const members = await getStaffMembers();
  const roleOptions = staffRoles.map((role) => ({ value: role, label: t(`admin.roles.${role}`) }));

  return (
    <>
      <AdminPageHeader title={t("admin.users.title")} intro={t("admin.users.intro")} />

      <section className="border border-ink p-5 lg:p-6">
        <h2 className="font-display text-lg font-bold">{t("admin.users.inviteTitle")}</h2>
        <p className="mt-1 mb-5 text-sm text-muted">{t("admin.users.inviteHint")}</p>
        <InviteForm
          roleOptions={roleOptions}
          labels={{
            email: t("admin.users.email"),
            role: t("admin.users.role"),
            submit: t("admin.users.invite"),
            submitting: t("admin.users.inviting"),
          }}
        />
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg font-bold">{t("admin.users.staffTitle")}</h2>
        <ul className="mt-4 border-t border-line">
          {members.map((member) => (
            <li
              key={member.id}
              className="grid gap-4 border-b border-line py-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
            >
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-semibold">{member.email}</span>
                  {member.id === currentAdmin.id && (
                    <Tag variant="lime">{t("admin.users.you")}</Tag>
                  )}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {[member.displayName, t(`admin.roles.${member.role}`), signInStatus(member)]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              {member.id !== currentAdmin.id && (
                <StaffActions
                  userId={member.id}
                  role={member.role}
                  roleOptions={roleOptions}
                  labels={{
                    role: t("admin.users.role"),
                    save: t("admin.users.save"),
                    saving: t("admin.users.saving"),
                    remove: t("admin.users.remove"),
                    removeConfirm: t("admin.users.removeConfirm"),
                  }}
                />
              )}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
