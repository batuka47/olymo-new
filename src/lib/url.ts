/** An absolute http(s) URL; rejects javascript:, data: and relative links. */
export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/** Opens the place in Google Maps; works for addresses and names alike. */
export function mapsHref(location: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}
