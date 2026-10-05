import { JetBrains_Mono, Onest, Unbounded } from "next/font/google";

// Only the weights the site uses. Google serves one variable file per subset that covers them
// all, trimmed to that range. Mongolian needs all three subsets: Ө and Ү are in cyrillic-ext, and
// spaces, digits and punctuation in latin. (next/font only accepts literal options.)
//
// All three are preloaded: each is on screen at the first paint (the ticker and buttons are
// mono), and a font found only through the CSS starts a request chain that delays it.

/** Headings. */
export const unbounded = Unbounded({
  weight: ["500", "700", "800"],
  subsets: ["cyrillic", "cyrillic-ext", "latin"],
  display: "swap",
  variable: "--font-unbounded",
});

/** Body text. */
export const onest = Onest({
  weight: ["400", "600", "700"],
  subsets: ["cyrillic", "cyrillic-ext", "latin"],
  display: "swap",
  variable: "--font-onest",
});

/** Uppercase labels, dates and buttons. */
export const jetbrainsMono = JetBrains_Mono({
  weight: ["400", "700"],
  subsets: ["cyrillic", "cyrillic-ext", "latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});
