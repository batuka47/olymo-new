import "server-only";
import { z } from "zod";
import { articleFolder, MEDIA_BUCKET } from "@/lib/media";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

const LIST_PAGE_SIZE = 1000;
const ID_BATCH_SIZE = 100;

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

async function existingArticleIds(supabase: Supabase, ids: string[]): Promise<Set<string>> {
  const found = new Set<string>();
  for (let start = 0; start < ids.length; start += ID_BATCH_SIZE) {
    const { data, error } = await supabase
      .from("articles")
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
 * Deletes articles/{id}/ folders that have no matching article and nothing uploaded within
 * `minAgeMs`. The age check protects new articles whose images are uploaded before the first save.
 */
export async function removeUnusedArticleFolders(
  supabase: Supabase,
  minAgeMs: number,
  now = Date.now(),
): Promise<CleanupResult> {
  const folderIds = (await listAll(supabase, "articles"))
    // Folders are listed without an id; article folders are named after the article id.
    .filter((entry) => entry.id === null && z.uuid().safeParse(entry.name).success)
    .map((entry) => entry.name);
  const usedIds = await existingArticleIds(supabase, folderIds);
  const result: CleanupResult = { folders: 0, files: 0 };

  for (const id of folderIds.filter((folderId) => !usedIds.has(folderId))) {
    const folder = articleFolder(id);
    const files = await listAll(supabase, folder);
    const uploadTimes = files.map((file) => Date.parse(file.updated_at ?? file.created_at ?? ""));
    // A file of unknown age counts as new: when in doubt, keep the folder.
    const tooRecent = uploadTimes.some(Number.isNaN) || now - Math.max(...uploadTimes) < minAgeMs;
    if (files.length === 0 || tooRecent) {
      continue;
    }

    const { error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .remove(files.map((file) => `${folder}/${file.name}`));
    if (error) throw error;
    result.folders += 1;
    result.files += files.length;
  }
  return result;
}
