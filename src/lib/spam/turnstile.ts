import "server-only";
import { TURNSTILE_FIELD } from "@/config/turnstile";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Asks Cloudflare whether the widget's token is genuine. A token works once and expires after
 * five minutes. Fails closed: without a secret key or an answer, nothing passes.
 */
export async function verifyTurnstile(formData: FormData, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error("TURNSTILE_SECRET_KEY is not set, so every spam check fails. See .env.example.");
    return false;
  }
  const token = String(formData.get(TURNSTILE_FIELD) ?? "");
  if (!token) {
    return false;
  }

  const body = new URLSearchParams({ secret, response: token });
  if (ip !== "unknown") {
    body.set("remoteip", ip);
  }
  try {
    const response = await fetch(VERIFY_URL, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(10_000),
    });
    const result = (await response.json()) as { success?: boolean; "error-codes"?: string[] };
    if (!result.success) {
      console.warn("Turnstile rejected a token:", result["error-codes"]?.join(", "));
    }
    return result.success === true;
  } catch (error) {
    console.error("Turnstile could not be reached:", error);
    return false;
  }
}
