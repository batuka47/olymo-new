import "server-only";
import { t } from "@/lib/i18n";
import { clientIp, hashIp } from "@/lib/spam/ip";
import { recordAuthAttempt, type AuthAction } from "@/lib/spam/rate-limit";
import { verifyTurnstile } from "@/lib/spam/turnstile";

/**
 * The checks before a sign-in, reset or sign-in link: Turnstile, then the per-address limit.
 * Only attempts with a valid token count, so a bot without one cannot lock out an office that
 * shares its address. Returns the message to show, or null to go ahead.
 */
export async function checkAuthAttempt(
  action: AuthAction,
  formData: FormData,
): Promise<string | null> {
  try {
    const ip = await clientIp();
    if (!(await verifyTurnstile(formData, ip))) {
      return t("spam.turnstileFailed");
    }
    if (!(await recordAuthAttempt(action, hashIp(ip)))) {
      return t("admin.login.tooManyAttempts");
    }
    return null;
  } catch (error) {
    console.error(`The ${action} checks failed:`, error);
    return t("admin.login.failed");
  }
}
