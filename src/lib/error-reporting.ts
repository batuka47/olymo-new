import type { Instrumentation } from "next";

type RequestErrorArgs = Parameters<Instrumentation.onRequestError>;

interface SentryTarget {
  url: string;
  publicKey: string;
  dsn: string;
}

/** "https://<key>@o1.ingest.sentry.io/<project>" → the project's envelope endpoint. */
function sentryTarget(dsn: string): SentryTarget | null {
  try {
    const parsed = new URL(dsn);
    const projectId = parsed.pathname.split("/").filter(Boolean).pop();
    if (!parsed.username || !projectId) return null;
    return {
      url: `${parsed.protocol}//${parsed.host}/api/${projectId}/envelope/`,
      publicKey: parsed.username,
      dsn,
    };
  } catch {
    return null;
  }
}

function digestOf(error: unknown): string | undefined {
  return typeof error === "object" && error !== null && "digest" in error
    ? String(error.digest)
    : undefined;
}

/** One event in Sentry's envelope format: https://develop.sentry.dev/sdk/envelopes/ */
async function sendToSentry(target: SentryTarget, [error, request, context]: RequestErrorArgs) {
  const eventId = crypto.randomUUID().replaceAll("-", "");
  const failure = error instanceof Error ? error : new Error(String(error));
  const event = {
    event_id: eventId,
    timestamp: Date.now() / 1000,
    platform: "node",
    level: "error",
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    transaction: context.routePath,
    request: { method: request.method, url: request.path },
    tags: { routeType: context.routeType, digest: digestOf(error) },
    exception: { values: [{ type: failure.name, value: failure.message }] },
    extra: { stack: failure.stack },
  };
  const envelope = [
    JSON.stringify({ event_id: eventId, sent_at: new Date().toISOString(), dsn: target.dsn }),
    JSON.stringify({ type: "event" }),
    JSON.stringify(event),
  ].join("\n");

  const response = await fetch(target.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-sentry-envelope",
      "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${target.publicKey}, sentry_client=olymo/1.0`,
    },
    body: envelope,
  });
  if (!response.ok) {
    console.error(`Sentry did not accept the error report (${response.status})`);
  }
}

/**
 * Every error the server catches while answering a request: one line in the server log (Next.js
 * prints the stack itself), with the digest that the error page shows the reader, and Sentry
 * when SENTRY_DSN is set.
 */
export async function reportServerError(...args: RequestErrorArgs): Promise<void> {
  const [error, request, context] = args;
  console.error(
    `Request failed: ${request.method} ${request.path} (${context.routeType} ${context.routePath}, digest ${digestOf(error) ?? "none"})`,
  );

  const dsn = process.env.SENTRY_DSN;
  const target = dsn ? sentryTarget(dsn) : null;
  if (dsn && !target) {
    console.error("SENTRY_DSN is not a valid Sentry DSN; the error was not sent.");
  }
  if (target) {
    try {
      await sendToSentry(target, args);
    } catch (reportError) {
      console.error("Sending the error to Sentry failed", reportError);
    }
  }
}
