/** "tel:+97699112233" from "+976 9911-2233"; null when there are no digits to dial. */
export function telHref(phone: string): string | null {
  const dialable = phone.replace(/[^\d+]/g, "");
  return /\d/.test(dialable) ? `tel:${dialable}` : null;
}
