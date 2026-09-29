export interface Category {
  slug: string;
  label: string;
  description: string;
}

export const categories = [
  {
    slug: "education",
    label: "Боловсрол",
    description: "Ерөнхий боловсролын сургууль, их сургуулийн элсэлт, боловсролын бодлогын мэдээ.",
  },
  {
    slug: "olympiad",
    label: "Олимпиад",
    description: "Олимпиад, уралдааны зар, бүртгэлийн хугацаа, дүн.",
  },
  {
    slug: "world",
    label: "Дэлхийд",
    description: "Гадаадад суралцах боломж, тэтгэлэг, олон улсын боловсролын мэдээ.",
  },
  {
    slug: "sports",
    label: "Спорт",
    description: "Сурагч, оюутны спортын тэмцээн, амжилт.",
  },
  {
    slug: "technology",
    label: "Технологи",
    description: "Технологи, программчлал, дижитал ур чадварын мэдээ.",
  },
  {
    slug: "science",
    label: "Шинжлэх ухаан",
    description: "Шинжлэх ухааны нээлт, судалгаа, залуу судлаачдын амжилт.",
  },
  {
    slug: "events",
    label: "Эвентүүд",
    description: "Сургалт, семинар, хакатон, нээлттэй хаалганы өдөр болон бусад арга хэмжээ.",
  },
] as const satisfies readonly Category[];

export type CategorySlug = (typeof categories)[number]["slug"];

const categorySlugs: ReadonlySet<string> = new Set(categories.map((category) => category.slug));

export function isCategorySlug(value: string): value is CategorySlug {
  return categorySlugs.has(value);
}

export function getCategory(slug: string) {
  return categories.find((category) => category.slug === slug);
}

export function categoryPath(slug: CategorySlug): string {
  return `/${slug}`;
}
