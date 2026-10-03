import "server-only";
import { z } from "zod";
import { MEDIA_BUCKET } from "@/lib/media";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

const LIST_PAGE_SIZE = 1000;
const ID_BATCH_SIZE = 100;

/** Image folders named after the row that owns them: {prefix}/{id}/. */
const OWNED_FOLDERS = [
  { prefix: "articles", table: "articles" },
  { prefix: "ads", table: "ads" },
  { prefix: "events", table: "events" },
  { prefix: "team", table: "team_members" },
] as const;

type OwnerTable = (typeof OWNED_FOLDERS)[number]["table"];

async function listAll(supabase: Supabase, prefix: string) {
  const entries = [];
  for (let offset = 0; ; offset += LIST_PAGE_SIZE) {
    const { data, error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .list(prefix, { limit: LIST_PAGE_SIZE, offset });
    if (error) throw error;
    entries.push(...data);
    if (data.length < LIST_PAGE_SIZE) return entries;
  }
}

/** Deletes every file in a folder; storage has no folders of its own, so it disappears with them. */
export async function removeFolder(supabase: Supabase, folder: string) {
  const files = await listAll(supabase, folder);
  if (files.length === 0) {
    return 0;
  }
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .remove(files.map((file) => `${folder}/${file.name}`));
  if (error) throw error;
  return files.length;
}

async function existingIds(supabase: Supabase, table: OwnerTable, ids: string[]) {
  const found = new Set<string>();
  for (let start = 0; start < ids.length; start += ID_BATCH_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select("id")
      .in("id", ids.slice(start, start + ID_BATCH_SIZE));
    if (error) throw error;
    for (const row of data) found.add(row.id);
  }
  return found;
}

export interface CleanupResult {
  folders: number;
  files: number;
}

/**
 * Deletes articles/{id}/, ads/{id}/, events/{id}/ and team/{id}/ folders whose row no longer exists (or never
 * did) and with nothing uploaded within `minAgeMs`. The age check protects new items: their
 * images are uploaded before the first save.
 */
export async function removeUnusedFolders(
  supabase: Supabase,
  minAgeMs: number,
  now = Date.now(),
): Promise<CleanupResult> {
  const result: CleanupResult = { folders: 0, files: 0 };

  for (const { prefix, table } of OWNED_FOLDERS) {
    const folderIds = (await listAll(supabase, prefix))
      // Folders are listed without an id; they are named after the row id.
      .filter((entry) => entry.id === null && z.uuid().safeParse(entry.name).success)
      .map((entry) => entry.name);
    const usedIds = await existingIds(supabase, table, folderIds);

    for (const id of folderIds.filter((folderId) => !usedIds.has(folderId))) {
      const folder = `${prefix}/${id}`;
      const files = await listAll(supabase, folder);
      const uploadTimes = files.map((file) => Date.parse(file.updated_at ?? file.created_at ?? ""));
      // A file of unknown age counts as new: when in doubt, keep the folder.
      const tooRecent = uploadTimes.some(Number.isNaN) || now - Math.max(...uploadTimes) < minAgeMs;
      if (files.length === 0 || tooRecent) {
        continue;
      }
      result.files += await removeFolder(supabase, folder);
      result.folders += 1;
    }
  }
  return result;
}
