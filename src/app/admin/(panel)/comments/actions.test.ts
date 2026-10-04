import { beforeEach, describe, expect, it, vi } from "vitest";
import { t } from "@/lib/i18n";
import { argsOf, called, fakeSupabase, type FakeQuery } from "@/test/fake-supabase";

const clients = vi.hoisted(() => ({ session: null as unknown, service: null as unknown }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => clients.session }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => clients.service }));
vi.mock("@/lib/auth/staff", () => ({ requireStaff: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { requireStaff } = await import("@/lib/auth/staff");
const { deleteCommentAsStaff, setCommentVisible, setReaderBanned } = await import("./actions");

const COMMENT = "9c8b7a6d-1e2f-4a3b-9c4d-5e6f7a8b9dd4";
const USER = "2d3e4f5a-6b7c-4d8e-a9f0-1a2b3c4d5ee5";

let session: ReturnType<typeof fakeSupabase>;
let service: ReturnType<typeof fakeSupabase>;

function profileWithRole(role: string) {
  return (query: FakeQuery) =>
    query.table === "profiles" && called(query, "maybeSingle") ? { data: { role } } : undefined;
}

beforeEach(() => {
  session = fakeSupabase({
    respond: (query) =>
      called(query, "maybeSingle")
        ? { data: { id: COMMENT } }
        : called(query, "delete")
          ? { data: [{ id: COMMENT }] }
          : undefined,
  });
  service = fakeSupabase({ respond: profileWithRole("reader") });
  clients.session = session.client;
  clients.service = service.client;
  vi.mocked(requireStaff).mockReset();
});

describe("comment moderation", () => {
  // requireStaff redirects non-staff to the sign-in page, which Next.js does by throwing.
  const notStaff = () => vi.mocked(requireStaff).mockRejectedValue(new Error("NEXT_REDIRECT"));

  it.each([
    ["setCommentVisible", () => setCommentVisible(COMMENT, false)],
    ["deleteCommentAsStaff", () => deleteCommentAsStaff(COMMENT)],
    ["setReaderBanned", () => setReaderBanned(USER, true)],
  ])("%s does nothing for someone who is not staff", async (_name, run) => {
    notStaff();
    await expect(run()).rejects.toThrow("NEXT_REDIRECT");
    expect(session.writes()).toHaveLength(0);
    expect(service.writes()).toHaveLength(0);
  });

  it("hides and shows with the staff session, clearing the filter's hold", async () => {
    expect(await setCommentVisible(COMMENT, true)).toEqual({ ok: true });
    const update = session.writes()[0];
    expect(update.table).toBe("comments");
    expect(argsOf(update, "update")?.[0]).toEqual({ status: "visible", held: false });
    expect(service.writes()).toHaveLength(0);
  });

  it("deletes with the staff session", async () => {
    expect(await deleteCommentAsStaff(COMMENT)).toEqual({ ok: true });
    expect(called(session.writes()[0], "delete")).toBe(true);
  });

  it("bans a reader", async () => {
    expect(await setReaderBanned(USER, true)).toEqual({ ok: true });
    const update = service.writes()[0];
    expect(update.table).toBe("profiles");
    expect(argsOf(update, "update")?.[0]).toEqual({ banned: true });
    expect(argsOf(update, "eq")).toEqual(["id", USER]);
  });

  it.each(["editor", "admin"])("never bans a staff account (%s)", async (role) => {
    service = fakeSupabase({ respond: profileWithRole(role) });
    clients.service = service.client;
    expect(await setReaderBanned(USER, true)).toEqual({
      ok: false,
      error: t("admin.comments.errors.staffBan"),
    });
    expect(service.writes()).toHaveLength(0);
  });

  it("refuses ids that are not ids", async () => {
    expect(await setReaderBanned("everyone", true)).toEqual({
      ok: false,
      error: t("admin.comments.errors.notFound"),
    });
    expect(service.writes()).toHaveLength(0);
  });
});
