import "server-only";

const RESEND_URL = "https://api.resend.com/emails";

/** Until a domain is verified in Resend, only its test sender works, to the account's own address. */
const DEFAULT_FROM = "onboarding@resend.dev";

interface Email {
  to: string;
  subject: string;
  /** Plain text only: nothing a visitor typed can become HTML in someone's inbox. */
  text: string;
  replyTo?: string;
}

/** Sends one email through the Resend API; throws when it is not accepted. */
export async function sendEmail({ to, subject, text, replyTo }: Email): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set. See .env.example.");
  }
  const response = await fetch(RESEND_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || DEFAULT_FROM,
      to: [to],
      subject,
      text,
      reply_to: replyTo,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`Resend answered ${response.status}: ${await response.text()}`);
  }
}
