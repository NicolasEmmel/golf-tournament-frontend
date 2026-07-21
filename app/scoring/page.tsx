import { EmptyState } from "@/components/common/EmptyState";
import { PageContainer } from "@/components/common/PageContainer";

export default function ScoringPage() {
  return (
    <PageContainer
      title="Score entry"
      description="Optimized for phones. Register as a scoring client for your player UUID after flight assignment."
    >
      <EmptyState
        title="Scoring UI coming in Phase 6"
        message="You will register via RegisterScoringClient, receive ReceiveSyncState, and submit scores hole by hole."
      />
    </PageContainer>
  );
}
