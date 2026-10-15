// Invented readers and their comments, the team on /about, and the tags of the demo articles.

/** Reader accounts that wrote the demo comments. They cannot sign in (random passwords). */
export const demoReaders = ["Тэмүүлэн", "Номин-Эрдэнэ", "Анужин", "Билгүүн Г."];

export interface DemoComment {
  /** Title of the demo article it is under. */
  article: string;
  /** Position in demoReaders. */
  reader: number;
  body: string;
  hoursAgo: number;
  /** Position (in this list) of the comment it answers. */
  replyTo?: number;
}

const HACKATHON = "Хиймэл оюуны хакатон: оюутны багууд 48 цагийн турш шийдэл бүтээнэ";
const MATH_OLYMPIAD = "Математикийн олимпиадын бүсийн шатны бүртгэл эхэллээ";
const EXAM_PLAN = "ЭЕШ-ийн бэлтгэлээ хэрхэн төлөвлөх вэ: сүүлийн 100 хоногийн хуваарь";

export const demoComments: DemoComment[] = [
  {
    article: HACKATHON,
    reader: 0,
    body: "Манай сургуулиас гурван баг оролцохоор бэлдэж байна. Багийн бүрэлдэхүүнийг хэзээ хүртэл өөрчилж болох вэ?",
    hoursAgo: 1.5,
  },
  {
    article: HACKATHON,
    reader: 3,
    body: "Бүртгэл хаагдахаас өмнө өөрчилж болно гэж зохион байгуулагчид хэлсэн.",
    hoursAgo: 1,
    replyTo: 0,
  },
  {
    article: HACKATHON,
    reader: 2,
    body: "Өнгөрсөн жил оролцоод маш их зүйл сурсан. Ялангуяа менторуудын зөвлөгөө их хэрэгтэй байсан. Бүгдэд нь зөвлөж байна!",
    hoursAgo: 0.7,
  },
  {
    article: HACKATHON,
    reader: 1,
    body: "Онлайнаар оролцох боломж бий юу? Хөдөө орон нутгаас оролцмоор байна.",
    hoursAgo: 0.3,
  },
  {
    article: MATH_OLYMPIAD,
    reader: 1,
    body: "Бүсийн шатны бодлогууд улсын шатныхаас хэр ялгаатай байдаг вэ?",
    hoursAgo: 5,
  },
  {
    article: MATH_OLYMPIAD,
    reader: 3,
    body: "Өмнөх жилүүдийн бодлогыг хаанаас олж болох вэ? Холбоос хуваалцвал их баярлана.",
    hoursAgo: 4,
  },
  {
    article: EXAM_PLAN,
    reader: 2,
    body: "100 хоногийн хуваарь их хэрэгтэй санагдлаа, баярлалаа!",
    hoursAgo: 2,
  },
  {
    article: EXAM_PLAN,
    reader: 0,
    body: "Англи хэлний бэлтгэлийн талаар бас нийтлэл бичээрэй.",
    hoursAgo: 1,
  },
];

export const demoTeam = [
  { name: "Б. Энхтуяа", role: "Ерөнхий редактор" },
  { name: "Г. Тэмүүжин", role: "Сэтгүүлч" },
  { name: "Д. Сарангэрэл", role: "Дизайнер" },
  { name: "О. Мөнхбат", role: "Хөгжүүлэгч" },
];

/** Tags the local seed already has; used, never deleted. */
export const SEED_TAGS = [
  { slug: "esh", label: "ЭЕШ" },
  { slug: "scholarship", label: "Тэтгэлэг" },
  { slug: "math", label: "Математик" },
];

/** Tags added for the demo; removed again by demo:clear once no article uses them. */
export const DEMO_TAGS = [
  { slug: "olympiad-prep", label: "Олимпиадын бэлтгэл" },
  { slug: "programming", label: "Програмчлал" },
  { slug: "ai", label: "Хиймэл оюун" },
  { slug: "robotics", label: "Робот техник" },
  { slug: "research", label: "Судалгаа" },
];

export const DEMO_AUTHORS = ["Редакц", "Г. Сарнай", "Т. Энхжин", "Д. Мөнх-Эрдэнэ"];
