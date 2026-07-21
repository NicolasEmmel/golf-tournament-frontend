import Link from "next/link";
import { PageContainer } from "@/components/common/PageContainer";
import { routes } from "@/lib/constants";

export default function NotFound() {
  return (
    <PageContainer title="Page not found">
      <p className="text-muted">The page you requested does not exist.</p>
      <Link
        href={routes.home}
        className="mt-6 inline-block text-primary underline-offset-4 hover:underline"
      >
        Back to home
      </Link>
    </PageContainer>
  );
}
