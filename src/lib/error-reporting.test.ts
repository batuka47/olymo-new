import { afterEach, describe, expect, it, vi } from "vitest";
import { reportServerError } from "./error-reporting";

const request = { path: "/olympiad/x", method: "GET", headers: {} };
const context = {
  routerKind: "App Router" as const,
  routePath: "/[category]/[slug]",
  routeType: "render" as const,
  renderSource: "react-server-components" as const,
  revalidateReason: undefined,
  renderType: "dynamic" as const,
};
const failure = Object.assign(new Error("Database is down"), { digest: "1234567" });

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("reportServerError", () => {
  it("logs one line with the digest the error page shows", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("SENTRY_DSN", "");
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);

    await reportServerError(failure, request, context);
    expect(log).toHaveBeenCalledWith(expect.stringContaining("GET /olympiad/x"));
    expect(log).toHaveBeenCalledWith(expect.stringContaining("digest 1234567"));
    expect(fetch).not.toHaveBeenCalled();
  });

  it("sends the error to the Sentry project in SENTRY_DSN", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("SENTRY_DSN", "https://publickey@o1.ingest.sentry.io/42");
    const fetch = vi.fn(async () => new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetch);

    await reportServerError(failure, request, context);
    expect(fetch).toHaveBeenCalledOnce();
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://o1.ingest.sentry.io/api/42/envelope/");
    expect((init.headers as Record<string, string>)["X-Sentry-Auth"]).toContain(
      "sentry_key=publickey",
    );
    const event = JSON.parse(String(init.body).split("\n")[2]);
    expect(event.exception.values[0]).toEqual({ type: "Error", value: "Database is down" });
    expect(event.tags).toEqual({ routeType: "render", digest: "1234567" });
  });

  it("never throws when Sentry cannot be reached", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("SENTRY_DSN", "https://publickey@o1.ingest.sentry.io/42");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Promise.reject(new Error("offline"))),
    );
    await expect(reportServerError(failure, request, context)).resolves.toBeUndefined();
  });
});
