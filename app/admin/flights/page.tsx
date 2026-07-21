import { EmptyState } from "@/components/common/EmptyState";
import { PageContainer } from "@/components/common/PageContainer";

export default function AdminFlightsPage() {
  return (
    <PageContainer title="Flights">
      <EmptyState title="Flight management placeholder" />
    </PageContainer>
  );
}
