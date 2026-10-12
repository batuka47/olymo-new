"use server";

import { z } from "zod";
import { clientIp, hashIp } from "@/lib/spam/ip";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Counts a reader's answer (once per question and address a day; see record_quiz_answer) and
 * returns how many readers answered that question correctly, in percent. Null when it is not known:
 * an inactive quiz, or the database could not be reached. No sign-in; only a salted address hash
 * is kept, for a day.
 */
export async function recordQuizAnswer(optionId: string): Promise<number | null> {
  if (!z.uuid().safeParse(optionId).success) {
    return null;
  }
  try {
    const { data, error } = await createAdminClient().rpc("record_quiz_answer", {
      option_id: optionId,
      ip_hash: hashIp(await clientIp()),
    });
    if (error) {
      throw error;
    }
    return data;
  } catch (error) {
    // The reader still sees whether they were right; only the share of readers is missing.
    console.error("Counting a quiz answer failed", error);
    return null;
  }
}
