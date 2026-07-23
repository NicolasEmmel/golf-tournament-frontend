"use client";

import { ErrorState } from "@/components/common/ErrorState";
import { PageContainer } from "@/components/common/PageContainer";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageContainer title="Fehler">
      <ErrorState message={error.message} />
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Erneut versuchen
      </button>
    </PageContainer>
  );
}
