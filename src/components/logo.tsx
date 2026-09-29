import { siteConfig } from "@/config/site";

// The whole brand mark lives here: swap the markup for an <svg> once the final logo exists.
export function Logo() {
  return (
    <span className="flex items-center gap-2 lg:gap-2.5">
      <span
        aria-hidden="true"
        className="flex size-6.5 items-center justify-center bg-accent font-display text-[13px] font-extrabold text-white lg:size-7.5 lg:text-[15px]"
      >
        {siteConfig.name.charAt(0)}
      </span>
      <span className="font-display text-lg font-extrabold tracking-[-0.01em] lg:text-xl">
        {siteConfig.name}
      </span>
    </span>
  );
}
