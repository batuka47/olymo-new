import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, strokeWidth = 2, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </Icon>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h16M4 12h16M4 17h10" />
    </Icon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Icon>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <Icon strokeWidth={1.8} strokeLinecap="butt" {...props}>
      <rect x="3" y="5" width="18" height="14" />
      <path d="M3 6l9 7 9-7" />
    </Icon>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <Icon strokeWidth={1.8} strokeLinejoin="round" {...props}>
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1" />
    </Icon>
  );
}

export function BuildingIcon(props: IconProps) {
  return (
    <Icon strokeWidth={1.8} strokeLinejoin="round" {...props}>
      <path d="M4 21V4h11v17M15 9h5v12M2 21h20M8 8h3M8 12h3M8 16h3" />
    </Icon>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <Icon strokeWidth={1.8} strokeLinecap="butt" {...props}>
      <rect x="3" y="5" width="18" height="16" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </Icon>
  );
}

export function MapPinIcon(props: IconProps) {
  return (
    <Icon strokeWidth={1.8} strokeLinejoin="round" {...props}>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </Icon>
  );
}

export function TicketIcon(props: IconProps) {
  return (
    <Icon strokeWidth={1.8} strokeLinejoin="round" {...props}>
      <path d="M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4z" />
      <path d="M14 7v10" strokeDasharray="2 2" />
    </Icon>
  );
}

/** Text alignment in the article editor: the lines show where text sits. */
export function AlignLeftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 6h16M4 10h10M4 14h16M4 18h10" />
    </Icon>
  );
}

export function AlignCenterIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 6h16M7 10h10M4 14h16M7 18h10" />
    </Icon>
  );
}

export function AlignRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 6h16M10 10h10M4 14h16M10 18h10" />
    </Icon>
  );
}

export function AlignJustifyIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </Icon>
  );
}
