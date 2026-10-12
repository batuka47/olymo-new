import type { Instrumentation } from "next";

/** Called by Next.js for every error it catches on the server (pages, actions, route handlers). */
export const onRequestError: Instrumentation.onRequestError = async (...args) => {
  const { reportServerError } = await import("@/lib/error-reporting");
  await reportServerError(...args);
};
