import { SiteFrame } from "@/components/site/site-frame";

export const revalidate = 60;

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return <SiteFrame>{children}</SiteFrame>;
}
