import { Container } from "@/components/ui/container";

interface StubPageProps {
  title: string;
}

export function StubPage({ title }: StubPageProps) {
  return (
    <Container className="py-16 lg:py-24">
      <h1 className="font-display text-3xl font-bold tracking-display lg:text-5xl">{title}</h1>
    </Container>
  );
}
