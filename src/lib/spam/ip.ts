import "server-only";
import { createHmac } from "node:crypto";
import { headers } from "next/headers";

/** The visitor's address. Vercel sets x-forwarded-for itself, so a browser cannot fake it. */
export async function clientIp(): Promise<string> {
  const list = await headers();
  const forwarded = list.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || list.get("x-real-ip") || "unknown";
}

/**
 * Salted SHA-256 (HMAC) of an IP address: requests from one address can be counted without the
 * address itself being stored. Changing IP_HASH_SALT starts every count from zero.
 */
export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT;
  if (!salt) {
    throw new Error("IP_HASH_SALT must be set. See .env.example.");
  }
  return createHmac("sha256", salt).update(ip).digest("hex");
}
