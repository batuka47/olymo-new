// Demo ads for every placement, drawn as banners for invented advertisers.
import type { AdPlacement } from "../../src/config/ads";

export interface DemoAd {
  placement: AdPlacement;
  advertiser: string;
  headline: string;
  detail: string;
  action: string;
  colors: { background: string; text: string; button: string; buttonText: string };
}

export const demoAds: DemoAd[] = [
  {
    placement: "home_1",
    advertiser: "Шинэ Үе Академи",
    headline: "ЭЕШ-ийн бэлтгэл: математик, физик, англи хэл",
    detail: "Өдөр, оройн ангиуд · Бүртгэл нээлттэй",
    action: "Бүртгүүлэх",
    colors: { background: "#0F3D2E", text: "#FFFFFF", button: "#F2C94C", buttonText: "#0F3D2E" },
  },
  {
    placement: "home_2",
    advertiser: "Ухаант Ном",
    headline: "Олимпиадын бодлогын номууд 20% хямдралтай",
    detail: "Сурах бичиг, туслах ном · Хүргэлт үнэгүй",
    action: "Дэлгүүр үзэх",
    colors: { background: "#F26B3A", text: "#FFFFFF", button: "#1D1D1F", buttonText: "#FFFFFF" },
  },
  {
    placement: "home_3",
    advertiser: "Код Лаб",
    headline: "12 долоо хоногт анхны апп-аа бүтээ",
    detail: "14–18 насныханд · Python, вэб, робот",
    action: "Дэлгэрэнгүй",
    colors: { background: "#1B1F3B", text: "#FFFFFF", button: "#7CF2C3", buttonText: "#1B1F3B" },
  },
  {
    placement: "home_4",
    advertiser: "Хангай Аялал",
    headline: "Сурагчдын зуны танин мэдэхүйн аялал",
    detail: "7 хоног · Хээрийн судалгаа, морин аялал",
    action: "Захиалах",
    colors: { background: "#E8DCC4", text: "#2B2118", button: "#2B2118", buttonText: "#E8DCC4" },
  },
  {
    placement: "category_1",
    advertiser: "Тэнгэр Англи Хэл",
    headline: "IELTS 7.0+ бэлтгэл, 8 долоо хоногт",
    detail: "Туршилтын шалгалт үнэгүй",
    action: "Түвшнээ шалгах",
    colors: { background: "#123B8C", text: "#FFFFFF", button: "#FFFFFF", buttonText: "#123B8C" },
  },
  {
    placement: "category_2",
    advertiser: "Оюут Карт",
    headline: "Оюутны карт — жилийн хураамжгүй",
    detail: "Хоол, тээвэр, номын дэлгүүрт хөнгөлөлт",
    action: "Захиалах",
    colors: { background: "#5B2A86", text: "#FFFFFF", button: "#FFD166", buttonText: "#3A1A57" },
  },
  {
    placement: "category_3",
    advertiser: "Эрдэм Лаб",
    headline: "Гэртээ хийх туршилтын иж бүрдэл",
    detail: "Хими, физик, биологи · 8+ нас",
    action: "Үзэх",
    colors: { background: "#FFF3D6", text: "#3B2F12", button: "#D9480F", buttonText: "#FFFFFF" },
  },
  {
    placement: "article_side",
    advertiser: "Шинэ Үе Академи",
    headline: "Олимпиадын бэлтгэл анги",
    detail: "Математик, физик · 8–12-р анги",
    action: "Бүртгүүлэх",
    colors: { background: "#0F3D2E", text: "#FFFFFF", button: "#F2C94C", buttonText: "#0F3D2E" },
  },
];

type BannerShape = "wide" | "phone" | "box";

const SHAPE_STYLES: Record<BannerShape, string> = {
  wide: `
    .ad { flex-direction: row; align-items: center; gap: 40px; padding: 0 48px; }
    .brand { font-size: 22px; min-width: 220px; }
    .copy { flex: 1; }
    .headline { font-size: 30px; }
    .detail { font-size: 17px; margin-top: 6px; }
    .button { font-size: 17px; padding: 16px 28px; }`,
  phone: `
    .ad { flex-direction: row; align-items: center; gap: 12px; padding: 0 14px; }
    .brand { display: none; }
    .copy { flex: 1; }
    .headline { font-size: 16px; }
    .detail { font-size: 11px; margin-top: 4px; }
    .button { font-size: 12px; padding: 10px 12px; }`,
  box: `
    .ad { flex-direction: column; justify-content: space-between; padding: 24px; }
    .brand { font-size: 15px; }
    .headline { font-size: 26px; }
    .detail { font-size: 14px; margin-top: 8px; }
    .button { font-size: 15px; padding: 12px 18px; align-self: flex-start; }`,
};

/** The banner as a page, drawn to an image by images.ts. */
export function bannerHtml(ad: DemoAd, shape: BannerShape): string {
  const { background, text, button, buttonText } = ad.colors;
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; }
  html, body { width: 100%; height: 100%; }
  body { font-family: "Segoe UI", Arial, sans-serif; }
  .ad { display: flex; width: 100%; height: 100%; background: ${background}; color: ${text}; }
  .brand { font-weight: 800; letter-spacing: 0.02em; text-transform: uppercase; }
  .headline { font-weight: 800; line-height: 1.15; }
  .detail { opacity: 0.85; }
  .button { background: ${button}; color: ${buttonText}; font-weight: 700; border-radius: 999px;
    white-space: nowrap; }
  ${SHAPE_STYLES[shape]}
</style></head><body>
  <div class="ad">
    <div class="brand">${ad.advertiser}</div>
    <div class="copy"><div class="headline">${ad.headline}</div><div class="detail">${ad.detail}</div></div>
    <div class="button">${ad.action}</div>
  </div>
</body></html>`;
}
