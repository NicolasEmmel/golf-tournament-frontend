import { EmptyState } from "@/components/common/EmptyState";

export default function DisplayPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-foreground px-6 py-10 text-background">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
          Live leaderboard
        </h1>
        <p className="mt-4 text-lg text-background/70 md:text-2xl">
          Display mode · Phase 8
        </p>
        <div className="mt-12">
          <EmptyState
            title="Awaiting live data"
            message="Fullscreen leaderboard rotation will use the same SignalR feed as the public leaderboard."
          />
        </div>
      </div>
    </div>
  );
}
