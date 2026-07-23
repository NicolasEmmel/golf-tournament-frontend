import Link from "next/link";
import { PageContainer } from "@/components/common/PageContainer";
import { routes } from "@/lib/constants";

export default function NotFound() {
  return (
    <PageContainer title="Seite nicht gefunden">
      <p className="text-muted">Die angeforderte Seite existiert nicht.</p>
      <Link
        href={routes.home}
        className="mt-6 inline-block text-primary underline-offset-4 hover:underline"
      >
        Zur Startseite
      </Link>
    </PageContainer>
  );
}
