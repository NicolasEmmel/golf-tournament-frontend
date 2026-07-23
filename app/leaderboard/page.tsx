"use client";

import { Flag, Home, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CircularAction } from "@/components/common/CircularAction";
import { ConnectionStatus } from "@/components/common/ConnectionStatus";
import { FairwayShell } from "@/components/common/FairwayShell";
import { FilterChip } from "@/components/common/FilterChip";
import { LoadingState } from "@/components/common/LoadingState";
import { MintCard } from "@/components/common/MintCard";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { useSignalR } from "@/context/SignalRContext";
import { useTournament } from "@/context/TournamentContext";
import { routes } from "@/lib/constants";
import { normalizeError } from "@/lib/errors";
import { LeaderboardCategory } from "@/models/tournament";

const categories: { id: LeaderboardCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: LeaderboardCategory.Men, label: "Men" },
  { id: LeaderboardCategory.Women, label: "Women" },
  { id: LeaderboardCategory.Seniors, label: "Seniors" },
];

export default function LeaderboardPage() {
  const { state } = useTournament();
  const {
    connectionState,
    leaderboards,
    registerLeaderboardViewer,
    ensureConnected,
  } = useSignalR();
  const [category, setCategory] = useState<(typeof categories)[number]["id"]>(
    "all",
  );
  const [bootError, setBootError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await ensureConnected();
        await registerLeaderboardViewer();
        if (!cancelled) setReady(true);
      } catch (err) {
        if (!cancelled) setBootError(normalizeError(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ensureConnected, registerLeaderboardViewer]);

  const entries = useMemo(() => {
    if (category === "all") {
      const byPlayer = new Map<string, (typeof leaderboards)[0]["entries"][0]>();
      for (const snapshot of leaderboards) {
        for (const entry of snapshot.entries) {
          const existing = byPlayer.get(entry.playerUuid);
          if (!existing || entry.netto < existing.netto) {
            byPlayer.set(entry.playerUuid, entry);
          }
        }
      }
      return [...byPlayer.values()].sort(
        (a, b) => a.netto - b.netto || a.gross - b.gross,
      );
    }
    return leaderboards.find((s) => s.category === category)?.entries ?? [];
  }, [leaderboards, category]);

  // Remap positions when "all" merges categories
  const displayEntries =
    category === "all"
      ? entries.map((e, i) => ({ ...e, position: i + 1 }))
      : entries;

  return (
    <FairwayShell>
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-6">
        <MintCard className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Trophy className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-black tracking-wide text-primary">
                LEADERBOARD
              </h1>
              <p className="text-xs text-muted">
                Day {state?.currentDay ?? "—"} · live updates
              </p>
            </div>
          </div>
          <ConnectionStatus state={connectionState} />
        </MintCard>

        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((c) => (
            <FilterChip
              key={String(c.id)}
              label={c.label}
              selected={category === c.id}
              onClick={() => setCategory(c.id)}
            />
          ))}
        </div>

        <div className="mt-4 flex-1">
          {bootError ? (
            <p className="rounded-xl bg-error/10 p-4 text-error">{bootError}</p>
          ) : !ready && leaderboards.length === 0 ? (
            <LoadingState message="Connecting to live leaderboard…" />
          ) : (
            <LeaderboardTable entries={displayEntries} />
          )}
        </div>

        <div className="mt-6 flex justify-center gap-6 pb-4">
          <CircularAction label="Home" icon={<Home />} href={routes.home} />
          <CircularAction
            label="Score"
            icon={<Flag />}
            variant="primary"
            href={routes.scoring}
          />
        </div>
      </div>
    </FairwayShell>
  );
}
