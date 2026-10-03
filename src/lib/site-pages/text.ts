import { isPlaceholder, siteConfig } from "@/config/site";

/** Written in page text where the site's name belongs (see fillTokens). */
export const SITE_NAME_TOKEN = "{сайтын нэр}";
/** Written where the company's legal name belongs, e.g. the data controller in the privacy policy. */
export const LEGAL_NAME_TOKEN = "{компанийн нэр}";

interface TokenValues {
  siteName: string;
  legalName: string;
}

const configValues: TokenValues = { siteName: siteConfig.name, legalName: siteConfig.legalName };

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Plain text split into paragraphs at blank lines (FAQ answers, block text). */
export function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

/**
 * Plain text with the tokens filled in. While the legal name is still a "[...]" placeholder, the
 * paragraphs naming the company are left out rather than shown with a gap.
 */
export function fillTokens(text: string, values: TokenValues = configValues): string {
  const kept = isPlaceholder(values.legalName)
    ? text
        .split(/\n\s*\n/)
        .filter((paragraph) => !paragraph.includes(LEGAL_NAME_TOKEN))
        .join("\n\n")
    : text;
  // Function replacers: a "$" in a name must not be read as a replacement pattern.
  return kept
    .replaceAll(SITE_NAME_TOKEN, () => values.siteName)
    .replaceAll(LEGAL_NAME_TOKEN, () => values.legalName);
}

/**
 * The innermost paragraph or heading that contains the legal name token. Saved HTML comes from
 * the sanitizer (src/lib/editor/render-html.ts), where these elements never nest in each other.
 */
const BLOCK_WITH_LEGAL_NAME = new RegExp(
  `<(p|h2|h3)\\b[^>]*>(?:(?!</?(?:p|h2|h3)\\b).)*?${escapeRegExp(LEGAL_NAME_TOKEN)}.*?</\\1>`,
  "gs",
);
/** A list item or quote left empty once its paragraph is gone. */
const EMPTY_WRAPPER = /<(li|blockquote)\b[^>]*>\s*<\/\1>/g;

/** The same for HTML: values are escaped, and a paragraph naming an unset company is removed. */
export function fillHtmlTokens(html: string, values: TokenValues = configValues): string {
  const kept = isPlaceholder(values.legalName)
    ? html.replace(BLOCK_WITH_LEGAL_NAME, "").replace(EMPTY_WRAPPER, "")
    : html;
  return kept
    .replaceAll(SITE_NAME_TOKEN, () => escapeHtml(values.siteName))
    .replaceAll(LEGAL_NAME_TOKEN, () => escapeHtml(values.legalName));
}
