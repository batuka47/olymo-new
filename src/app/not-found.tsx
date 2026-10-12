import Link from "next/link";
import { Logo } from "@/components/logo";
import { NotFoundHero } from "@/components/site/not-found-content";
import { Container } from "@/components/ui/container";
import { routes } from "@/config/navigation";

/**
 * Fallback for the rare 404 outside the site's pages; public addresses get the full one in
 * (site)/not-found.tsx. Next.js includes this in every page's payload, so it has no header,
 * footer or data of its own.
 */
export default function NotFound() {
  return (
    <Container as="section" className="flex-1">
      <div className="border-b border-line py-4">
        <Link href={routes.home} className="inline-flex min-h-11 items-center">
          <Logo />
        </Link>
      </div>
      <NotFoundHero />
    </Container>
  );
}
