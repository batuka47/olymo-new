import { beforeEach, describe, expect, it, vi } from "vitest";
import { t } from "@/lib/i18n";
import {
  argsOf,
  called,
  fakeSupabase,
  type FakeQuery,
  type FakeResult,
} from "@/test/fake-supabase";

const session = vi.hoisted(() => ({ client: null as unknown }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => session.client }));

const { addComment, deleteComment, editComment, reportComment } = await import("./actions");

const READER = "6f1c2c5e-8f43-4d6a-9a6b-1c2d3e4f5aa1";
const OTHER = "0b8e7d16-2c4f-4e5a-8b7c-9d0e1f2a3bb2";
const ARTICLE = "4a3b2c1d-5e6f-4a7b-8c9d-0e1f2a3b4cc3";
const COMMENT = "9c8b7a6d-1e2f-4a3b-9c4d-5e6f7a8b9dd4";
const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

function signIn(userId: string | null, respond?: (query: FakeQuery) => FakeResult | undefined) {
  const fake = fakeSupabase({ userId, respond });
  session.client = fake.client;
  return fake;
}

/** The comment the action looks up before changing it. */
const existing = (owner: string, createdAt: string) => (query: FakeQuery) =>
  query.table === "comments" && called(query, "maybeSingle")
    ? { data: { user_id: owner, created_at: createdAt } }
    : undefined;

beforeEach(() => {
  session.client = null;
});

describe("addComment", () => {
  const input = { articleId: ARTICLE, body: "Сайхан мэдээ", parentId: null };

  it("refuses a visitor who is not signed in, without writing", async () => {
    const fake = signIn(null);
    expect(await addComment(input)).toEqual({ ok: false, error: t("comments.errors.signIn") });
    expect(fake.writes()).toHaveLength(0);
  });

  it.each([
    ["an empty comment", "   ", t("comments.errors.empty")],
    [
      "a comment over 1000 characters",
      "а".repeat(1001),
      t("comments.errors.tooLong", { max: 1000 }),
    ],
  ])("refuses %s before the database", async (_label, body, error) => {
    const fake = signIn(READER);
    expect(await addComment({ ...input, body })).toEqual({ ok: false, error });
    expect(fake.writes()).toHaveLength(0);
  });

  it("writes as the signed-in reader, whatever the browser sends", async () => {
    const fake = signIn(READER, (query) =>
      called(query, "insert")
        ? {
            data: {
              id: COMMENT,
              parent_id: null,
              body: "Сайхан мэдээ",
              status: "visible",
              created_at: minutesAgo(0),
              edited_at: null,
            },
          }
        : undefined,
    );
    const result = await addComment(input);
    const insert = fake.writes()[0];
    expect(insert.table).toBe("comments");
    expect(argsOf(insert, "insert")?.[0]).toMatchObject({ user_id: READER, article_id: ARTICLE });
    expect(result).toMatchObject({ ok: true, value: { isOwn: true, hidden: false } });
  });

  it.each([
    ["comments_rate_limited", t("comments.errors.rateLimited")],
    ["comments_banned", t("comments.errors.banned")],
    ["comments_closed", t("comments.errors.closed")],
    ["new row violates row-level security policy", t("comments.errors.failed")],
  ])("turns the database refusal %s into a message", async (message, error) => {
    signIn(READER, (query) => (called(query, "insert") ? { error: { message } } : undefined));
    expect(await addComment(input)).toEqual({ ok: false, error });
  });
});

describe("editComment and deleteComment", () => {
  it.each([
    ["editComment", () => editComment({ id: COMMENT, body: "Засвар" })],
    ["deleteComment", () => deleteComment(COMMENT)],
  ])("%s: refuses someone else's comment without writing", async (_name, run) => {
    const fake = signIn(READER, existing(OTHER, minutesAgo(1)));
    expect(await run()).toEqual({ ok: false, error: t("comments.errors.notYours") });
    expect(fake.writes()).toHaveLength(0);
  });

  it.each([
    ["editComment", () => editComment({ id: COMMENT, body: "Засвар" })],
    ["deleteComment", () => deleteComment(COMMENT)],
  ])("%s: refuses the author after 15 minutes without writing", async (_name, run) => {
    const fake = signIn(READER, existing(READER, minutesAgo(16)));
    expect(await run()).toEqual({ ok: false, error: t("comments.errors.tooLate") });
    expect(fake.writes()).toHaveLength(0);
  });

  it.each([
    ["editComment", () => editComment({ id: COMMENT, body: "Засвар" })],
    ["deleteComment", () => deleteComment(COMMENT)],
  ])("%s: refuses a visitor who is not signed in", async (_name, run) => {
    const fake = signIn(null);
    expect(await run()).toEqual({ ok: false, error: t("comments.errors.signIn") });
    expect(fake.writes()).toHaveLength(0);
  });

  it("lets the author edit within 15 minutes", async () => {
    const fake = signIn(READER, (query) =>
      called(query, "update")
        ? { data: { body: "Засвар", status: "visible", edited_at: minutesAgo(0) } }
        : existing(READER, minutesAgo(5))(query),
    );
    const result = await editComment({ id: COMMENT, body: "Засвар" });
    expect(result).toMatchObject({ ok: true, value: { body: "Засвар", hidden: false } });
    expect(argsOf(fake.writes()[0], "update")?.[0]).toEqual({ body: "Засвар" });
  });

  it("lets the author delete within 15 minutes", async () => {
    const fake = signIn(READER, (query) =>
      called(query, "delete")
        ? { data: [{ id: COMMENT }] }
        : existing(READER, minutesAgo(5))(query),
    );
    expect(await deleteComment(COMMENT)).toEqual({ ok: true, value: { tombstone: false } });
    expect(fake.writes()).toHaveLength(1);
  });

  it("reports a tombstone when the database kept an answered comment", async () => {
    // keep_answered_comment cancels the delete, so no row comes back; the comment is still there.
    signIn(READER, (query) => {
      if (called(query, "delete")) return { data: [] };
      if (called(query, "select") && argsOf(query, "select")?.[0] === "deleted_at") {
        return { data: { deleted_at: minutesAgo(0) } };
      }
      return existing(READER, minutesAgo(5))(query);
    });
    expect(await deleteComment(COMMENT)).toEqual({ ok: true, value: { tombstone: true } });
  });

  it("fails when nothing was deleted and nothing was kept", async () => {
    signIn(READER, (query) => {
      if (called(query, "delete")) return { data: [] };
      if (called(query, "select") && argsOf(query, "select")?.[0] === "deleted_at") {
        return { data: null };
      }
      return existing(READER, minutesAgo(5))(query);
    });
    expect(await deleteComment(COMMENT)).toEqual({
      ok: false,
      error: t("comments.errors.failed"),
    });
  });
});

describe("reportComment", () => {
  it("refuses a visitor who is not signed in", async () => {
    const fake = signIn(null);
    expect(await reportComment(COMMENT)).toEqual({ ok: false, error: t("comments.errors.signIn") });
    expect(fake.writes()).toHaveLength(0);
  });

  it("refuses reporting one's own comment", async () => {
    const fake = signIn(READER, existing(READER, minutesAgo(1)));
    expect(await reportComment(COMMENT)).toEqual({
      ok: false,
      error: t("comments.errors.ownReport"),
    });
    expect(fake.writes()).toHaveLength(0);
  });

  it("reports someone else's comment as the signed-in reader", async () => {
    const fake = signIn(READER, existing(OTHER, minutesAgo(1)));
    expect(await reportComment(COMMENT)).toEqual({ ok: true, value: null });
    const insert = fake.writes()[0];
    expect(insert.table).toBe("comment_reports");
    expect(argsOf(insert, "insert")?.[0]).toEqual({ comment_id: COMMENT, user_id: READER });
  });

  it("treats a second report as done", async () => {
    signIn(READER, (query) =>
      called(query, "insert")
        ? { error: { message: "duplicate key", code: "23505" } }
        : existing(OTHER, minutesAgo(1))(query),
    );
    expect(await reportComment(COMMENT)).toEqual({ ok: true, value: null });
  });
});
