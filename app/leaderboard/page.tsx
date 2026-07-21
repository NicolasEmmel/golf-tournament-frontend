import { EmptyState } from "@/components/common/EmptyState";
import { PageContainer } from "@/components/common/PageContainer";

export default function LeaderboardPage() {
  return (
    <PageContainer
      title="Leaderboard"
      description="Live leaderboard with category filters. SignalR integration coming in Phase 5."
    >
      <EmptyState
        title="Leaderboard not connected yet"
        message="This page will subscribe to LeaderboardUpdated events and show men, women, and seniors divisions using backend-calculated scores."
      />
    </PageContainer>
  );
}
