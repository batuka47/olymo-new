import { beforeEach, describe, expect, it, vi } from "vitest";
import { t } from "@/lib/i18n";
import { argsOf, called, fakeSupabase, type FakeQuery } from "@/test/fake-supabase";

const clients = vi.hoisted(() => ({ session: null as unknown, service: null as unknown }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => clients.session }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => clients.service }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { deleteAccount, updateDisplayName } = await import("./actions");

const READER = "6f1c2c5e-8f43-4d6a-9a6b-1c2d3e4f5aa1";

function signIn(userId: string | null, profile: Record<string, unknown> | null) {
  const fake = fakeSupabase({
    userId,
    respond: (query: FakeQuery) =>
      query.table === "profiles" && called(query, "maybeSingle") ? { data: profile } : undefined,
  });
  clients.session = fake.client;
  return fake;
}

function nameForm(name: string) {
  const formData = new FormData();
  formData.set("displayName", name);
  return formData;
}

let service: ReturnType<typeof fakeSupabase>;

beforeEach(() => {
  service = fakeSupabase();
  clients.service = service.client;
});

describe("updateDisplayName", () => {
  it("refuses a visitor who is not signed in", async () => {
    const fake = signIn(null, null);
    expect(await updateDisplayName({}, nameForm("Бат"))).toEqual({
      error: t("account.errors.signedOut"),
    });
    expect(fake.writes()).toHaveLength(0);
  });

  it("refuses a second change", async () => {
    const fake = signIn(READER, { name_changed_at: "2026-10-01T00:00:00Z" });
    expect(await updateDisplayName({}, nameForm("Шинэ нэр"))).toEqual({
      error: t("account.errors.nameLocked"),
    });
    expect(fake.writes()).toHaveLength(0);
  });

  it("changes the reader's own name once", async () => {
    const fake = signIn(READER, { name_changed_at: null });
    expect(await updateDisplayName({}, nameForm("  Шинэ нэр  "))).toEqual({
      success: t("account.nameSaved"),
    });
    const update = fake.writes()[0];
    expect(argsOf(update, "update")?.[0]).toEqual({ display_name: "Шинэ нэр" });
    expect(argsOf(update, "eq")).toEqual(["id", READER]);
  });
});

describe("deleteAccount", () => {
  it("refuses a visitor who is not signed in", async () => {
    signIn(null, null);
    expect(await deleteAccount()).toEqual({ ok: false, error: t("account.errors.signedOut") });
    expect(service.client.auth.admin.deleteUser).not.toHaveBeenCalled();
  });

  it.each(["editor", "admin"])("never deletes a staff account (%s)", async (role) => {
    signIn(READER, { role });
    expect(await deleteAccount()).toEqual({ ok: false, error: t("account.errors.staffAccount") });
    expect(service.client.auth.admin.deleteUser).not.toHaveBeenCalled();
  });

  it("deletes only the signed-in reader's own account", async () => {
    signIn(READER, { role: "reader" });
    expect(await deleteAccount()).toEqual({ ok: true });
    expect(service.client.auth.admin.deleteUser).toHaveBeenCalledExactlyOnceWith(READER);
  });
});
