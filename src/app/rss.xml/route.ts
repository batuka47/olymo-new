import { getCategory } from "@/config/categories";
import { routes } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { getLatestArticles } from "@/lib/articles/public";
import { articlePath } from "@/lib/articles/status";

export const revalidate = 60;

const FEED_SIZE = 50;

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** RSS 2.0 dates: "Sat, 04 Oct 2026 08:00:00 GMT". */
const rssDate = (value: string) => new Date(value).toUTCString();

/** The 50 newest published articles for feed readers. */
export async function GET() {
  const articles = await getLatestArticles(FEED_SIZE);
  const items = articles.map((article) => {
    const url = `${siteConfig.url}${articlePath(article.category_slug, article.slug)}`;
    const category = getCategory(article.category_slug)?.label;
    return [
      "<item>",
      `<title>${escapeXml(article.title)}</title>`,
      `<link>${url}</link>`,
      `<guid isPermaLink="true">${url}</guid>`,
      article.publish_at && `<pubDate>${rssDate(article.publish_at)}</pubDate>`,
      article.excerpt && `<description>${escapeXml(article.excerpt)}</description>`,
      category && `<category>${escapeXml(category)}</category>`,
      article.author_name && `<dc:creator>${escapeXml(article.author_name)}</dc:creator>`,
      "</item>",
    ]
      .filter(Boolean)
      .join("");
  });

  const feedUrl = `${siteConfig.url}${routes.rss}`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
<channel>
<title>${escapeXml(siteConfig.name)}</title>
<link>${siteConfig.url}</link>
<description>${escapeXml(siteConfig.tagline)}</description>
<language>mn</language>
<atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
${articles[0]?.publish_at ? `<lastBuildDate>${rssDate(articles[0].publish_at)}</lastBuildDate>` : ""}
${items.join("\n")}
</channel>
</rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
