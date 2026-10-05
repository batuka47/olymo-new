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

/** The rows that still exist, whole: whatever column or text points at an image counts. */
async function existingRows(supabase: Supabase, table: OwnerTable, ids: string[]) {
  const rows = new Map<string, string>();
  for (let start = 0; start < ids.length; start += ID_BATCH_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .in("id", ids.slice(start, start + ID_BATCH_SIZE));
    if (error) throw error;
    for (const row of data) rows.set(row.id, JSON.stringify(row));
  }
  return rows;
}

/** Name shared by every file of one upload: cover-ab12cd34-800.webp → cover-ab12cd34. */
function uploadName(fileName: string): string {
  return fileName.replace(/-(?:\d+|og)\.(?:webp|jpg)$/, "");
}

/** Uploads a row points at, by uploadName, found in any of its columns (paths, body HTML). */
function usedUploads(folder: string, rowText: string): Set<string> {
  const pattern = new RegExp(`${folder}/([a-z0-9-]+\\.(?:webp|jpg))`, "g");
  return new Set([...rowText.matchAll(pattern)].map((match) => uploadName(match[1])));
}

type StoredFile = Awaited<ReturnType<typeof listAll>>[number];

/** A file of unknown age counts as new: when in doubt, keep it. */
function isRecent(files: StoredFile[], minAgeMs: number, now: number) {
  const uploadTimes = files.map((file) => Date.parse(file.updated_at ?? file.created_at ?? ""));
  return uploadTimes.some(Number.isNaN) || now - Math.max(...uploadTimes) < minAgeMs;
}

/** Files of a row's earlier uploads: a replaced cover, or an image taken out of the text. */
async function removeReplacedFiles(
  supabase: Supabase,
  folder: string,
  rowText: string,
  minAgeMs: number,
  now: number,
) {
  const used = usedUploads(folder, rowText);
  const replaced = (await listAll(supabase, folder)).filter(
    (file) =>
      file.id !== null && !used.has(uploadName(file.name)) && !isRecent([file], minAgeMs, now),
  );
  if (replaced.length === 0) {
    return 0;
  }
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .remove(replaced.map((file) => `${folder}/${file.name}`));
  if (error) throw error;
  return replaced.length;
}

export interface CleanupResult {
  folders: number;
  files: number;
}

/**
 * Deletes articles/{id}/, ads/{id}/, events/{id}/ and team/{id}/ folders whose row no longer exists
 * (or never did), and files in the other folders that their row no longer points at (uploads are
 * never overwritten, so a replaced image leaves its files behind). Nothing uploaded within
 * `minAgeMs` is deleted: images are uploaded before the save that points at them.
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
    const rows = await existingRows(supabase, table, folderIds);

    for (const id of folderIds) {
      const folder = `${prefix}/${id}`;
      const rowText = rows.get(id);
      if (rowText !== undefined) {
        result.files += await removeReplacedFiles(supabase, folder, rowText, minAgeMs, now);
        continue;
      }
      const files = await listAll(supabase, folder);
      if (files.length === 0 || isRecent(files, minAgeMs, now)) {
        continue;
      }
      result.files += await removeFolder(supabase, folder);
      result.folders += 1;
    }
  }
  return result;
}
