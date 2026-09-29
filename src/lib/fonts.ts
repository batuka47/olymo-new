import { JetBrains_Mono, Onest, Unbounded } from "next/font/google";

// All three are variable fonts: omitting `weight` loads one file per subset that covers
// every weight we use (Unbounded 700–800, Onest and JetBrains Mono 400–700).

export const unbounded = Unbounded({
  subsets: ["cyrillic", "cyrillic-ext", "latin"],
  variable: "--font-unbounded",
});

export const onest = Onest({
  subsets: ["cyrillic", "cyrillic-ext", "latin"],
  variable: "--font-onest",
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["cyrillic", "cyrillic-ext", "latin"],
  variable: "--font-jetbrains-mono",
});
