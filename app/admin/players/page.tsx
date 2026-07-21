import { EmptyState } from "@/components/common/EmptyState";
import { PageContainer } from "@/components/common/PageContainer";

export default function AdminPlayersPage() {
  return (
    <PageContainer title="Players">
      <EmptyState title="Player management placeholder" />
    </PageContainer>
  );
}
