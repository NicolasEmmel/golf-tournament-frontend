"use client";

import { Flag, Home, Send, Trophy } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CircularAction } from "@/components/common/CircularAction";
import { ConnectionStatus } from "@/components/common/ConnectionStatus";
import { ErrorState } from "@/components/common/ErrorState";
import { FairwayShell } from "@/components/common/FairwayShell";
import { LoadingState } from "@/components/common/LoadingState";
import { MintCard } from "@/components/common/MintCard";
import { PlayerNamePicker } from "@/components/scoring/PlayerNamePicker";
import { ScoreStepper } from "@/components/scoring/ScoreStepper";
import { useSignalR } from "@/context/SignalRContext";
import { useTournament } from "@/context/TournamentContext";
import { routes } from "@/lib/constants";
import { normalizeError } from "@/lib/errors";
import type { Hole, Player, PlayerFlight } from "@/models/tournament";
import { playerApi } from "@/services/api/playerApi";
import {
  flightApi,
  tournamentApi,
  type CourseInfo,
} from "@/services/api/tournamentApi";

type DraftScores = Record<string, number>;

export default function ScoringPage() {
  const { state } = useTournament();
  const {
    connectionState,
    scorecard,
    registerScoringClient,
    submitScore,
    clearSync,
  } = useSignalR();

  const [players, setPlayers] = useState<Player[]>([]);
  const [playersLoading, setPlayersLoading] = useState(true);
  const [playersError, setPlayersError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Player | null>(null);
  const [registering, setRegistering] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  const [course, setCourse] = useState<CourseInfo | null>(null);
  const [flightMates, setFlightMates] = useState<Player[]>([]);
  const [holeIndex, setHoleIndex] = useState(0);
  const [drafts, setDrafts] = useState<DraftScores>({});
  const [saved, setSaved] = useState<DraftScores>({});
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const initialHoleSetFor = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await playerApi.list();
        if (!cancelled) setPlayers(list);
      } catch (err) {
        if (!cancelled) setPlayersError(normalizeError(err));
      } finally {
        if (!cancelled) setPlayersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void tournamentApi.getCourse().then(setCourse).catch(() => undefined);
  }, []);

  const hole: Hole | undefined = course?.holes[holeIndex];
  // Prefer the day from the registered sync scorecard so day changes mid-session
  // do not silently retarget submissions.
  const day = scorecard?.day ?? state?.currentDay ?? 1;

  const loadFlight = useCallback(
    async (player: Player, flightNumber: number, currentDay: number) => {
      const assignments = await flightApi.playersInFlight(
        currentDay,
        flightNumber,
      );
      const uuids = new Set(assignments.map((a: PlayerFlight) => a.playerUuid));
      const mates = players.filter((p) => uuids.has(p.uuid));
      if (!mates.some((m) => m.uuid === player.uuid)) {
        mates.unshift(player);
      }
      const resolved = mates.length ? mates : [player];
      setFlightMates(resolved);

      const mateCards = await Promise.all(
        resolved.map(async (mate) => {
          try {
            return await tournamentApi.getScorecard(currentDay, mate.uuid);
          } catch {
            return null;
          }
        }),
      );

      const fromServer: DraftScores = {};
      for (const card of mateCards) {
        if (!card) continue;
        for (const h of card.holes) {
          if (h.strokes > 0) {
            fromServer[`${card.playerUuid}:${h.holeId}`] = h.strokes;
          }
        }
      }
      if (Object.keys(fromServer).length > 0) {
        setSaved((prev) => ({ ...prev, ...fromServer }));
        setDrafts((prev) => ({ ...prev, ...fromServer }));
      }
    },
    [players],
  );

  const handleSelectPlayer = async (player: Player) => {
    setRegError(null);
    setRegistering(true);
    setSessionReady(false);
    try {
      const result = await registerScoringClient(player.uuid);
      if (!result.success) {
        setRegError(result.error ?? "Could not register for scoring.");
        return;
      }
      initialHoleSetFor.current = null;
      setSelected(player);
      setSessionReady(true);
    } catch (err) {
      setRegError(normalizeError(err));
    } finally {
      setRegistering(false);
    }
  };

  useEffect(() => {
    if (!selected || !scorecard) return;
    if (scorecard.playerUuid !== selected.uuid) return;

    const currentDay = scorecard.day;
    void loadFlight(selected, scorecard.flightNumber, currentDay);

    const nextSaved: DraftScores = {};
    for (const h of scorecard.holes) {
      if (h.strokes > 0) {
        nextSaved[`${selected.uuid}:${h.holeId}`] = h.strokes;
      }
    }
    setSaved((prev) => ({ ...prev, ...nextSaved }));
    setDrafts((prev) => ({ ...prev, ...nextSaved }));

    // Only pick the starting hole once per player session — later scorecard
    // updates must not fight with Send's hole advance (that skipped holes).
    if (initialHoleSetFor.current !== selected.uuid) {
      initialHoleSetFor.current = selected.uuid;
      const firstOpen = scorecard.holes.findIndex((h) => h.strokes <= 0);
      setHoleIndex(firstOpen >= 0 ? firstOpen : 0);
    }
  }, [selected, scorecard, loadFlight]);

  useEffect(() => {
    setStatusMessage(null);
  }, [holeIndex]);

  useEffect(() => {
    if (!hole || !flightMates.length) return;
    setDrafts((prev) => {
      const next = { ...prev };
      for (const mate of flightMates) {
        const key = `${mate.uuid}:${hole.number}`;
        if (next[key] == null) {
          next[key] = saved[key] ?? hole.par;
        }
      }
      return next;
    });
  }, [hole, flightMates, saved]);

  const unsavedForHole = useMemo(() => {
    if (!hole) return false;
    return flightMates.some((mate) => {
      const key = `${mate.uuid}:${hole.number}`;
      return drafts[key] !== saved[key];
    });
  }, [drafts, saved, flightMates, hole]);

  const handleSubmitHole = async () => {
    if (!hole || !selected) return;
    setSubmitting(true);
    setStatusMessage(null);
    try {
      for (const mate of flightMates) {
        const key = `${mate.uuid}:${hole.number}`;
        const strokes = drafts[key] ?? hole.par;
        if (saved[key] === strokes) continue;
        const result = await submitScore({
          day,
          playerUuid: mate.uuid,
          holeId: hole.number,
          strokes,
        });
        if (!result.success) {
          throw new Error(result.error ?? `Failed for ${mate.name}`);
        }
        setSaved((prev) => ({ ...prev, [key]: strokes }));
      }
      setStatusMessage("Scores saved");
      if (holeIndex < 17) {
        setHoleIndex((i) => i + 1);
      }
    } catch (err) {
      setStatusMessage(normalizeError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const resetSession = () => {
    clearSync();
    setSelected(null);
    setSessionReady(false);
    setFlightMates([]);
    setDrafts({});
    setSaved({});
    setRegError(null);
    setStatusMessage(null);
    initialHoleSetFor.current = null;
  };

  if (!selected || !sessionReady) {
    return (
      <FairwayShell>
        <div className="mx-auto w-full max-w-lg px-4 py-6">
          <MintCard className="mb-4">
            <h1 className="text-2xl font-black text-primary">Score entry</h1>
            <p className="mt-1 text-sm text-muted">
              Register with your name to score your flight.
            </p>
            <div className="mt-3">
              <ConnectionStatus state={connectionState} />
            </div>
          </MintCard>
          {regError && (
            <div className="mb-4">
              <ErrorState title="Registration failed" message={regError} />
            </div>
          )}
          {registering ? (
            <LoadingState message="Connecting and registering…" />
          ) : (
            <PlayerNamePicker
              players={players}
              loading={playersLoading}
              error={playersError}
              onSelect={handleSelectPlayer}
            />
          )}
        </div>
      </FairwayShell>
    );
  }

  return (
    <FairwayShell>
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-4">
        <MintCard className="relative overflow-hidden">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-muted">
                Flight {scorecard?.flightNumber ?? "—"} · Day {day}
              </p>
              <h1 className="text-4xl font-black text-primary">
                Hole {hole?.number ?? "—"}
              </h1>
              <p className="mt-1 text-sm font-semibold text-foreground">
                Par {hole?.par ?? "—"} · SI {hole?.strokeIndex ?? "—"}
              </p>
              {hole?.number === 18 && (
                <span className="mt-2 inline-block rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase text-white">
                  Final hole
                </span>
              )}
            </div>
            <Flag className="h-14 w-14 text-primary/40" />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <ConnectionStatus state={connectionState} />
            <button
              type="button"
              onClick={resetSession}
              className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
            >
              Change player
            </button>
          </div>
        </MintCard>

        <div className="mt-4 flex-1 space-y-3">
          {flightMates.map((mate) => {
            const key = hole ? `${mate.uuid}:${hole.number}` : mate.uuid;
            const value = drafts[key] ?? hole?.par ?? 4;
            const isSaved = saved[key] === value && saved[key] != null;
            const [first, ...rest] = mate.name.split(" ");
            return (
              <div
                key={mate.uuid}
                className="rounded-xl bg-surface-translucent p-4 shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-lg font-black">{first}</p>
                    {rest.length > 0 && (
                      <p className="text-sm font-semibold text-muted">
                        {rest.join(" ")}
                      </p>
                    )}
                  </div>
                  <span
                    className={
                      isSaved
                        ? "text-xs font-semibold text-success"
                        : "text-xs font-semibold text-warning"
                    }
                  >
                    {isSaved ? "Saved" : "Unsaved"}
                  </span>
                </div>
                <ScoreStepper
                  label="Strokes"
                  value={value}
                  onChange={(next) =>
                    setDrafts((prev) => ({ ...prev, [key]: next }))
                  }
                />
              </div>
            );
          })}
        </div>

        {statusMessage && (
          <p
            className={`mt-3 text-center text-sm font-semibold ${
              statusMessage === "Scores saved" ? "text-success" : "text-error"
            }`}
          >
            {statusMessage}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            className="rounded-xl bg-surface px-4 py-2 text-sm font-semibold disabled:opacity-40"
            disabled={holeIndex <= 0}
            onClick={() => setHoleIndex((i) => Math.max(0, i - 1))}
          >
            Prev
          </button>
          <span className="text-xs font-semibold text-muted">
            {holeIndex + 1} / 18
            {unsavedForHole ? " · unsaved" : ""}
          </span>
          <button
            type="button"
            className="rounded-xl bg-surface px-4 py-2 text-sm font-semibold disabled:opacity-40"
            disabled={holeIndex >= 17}
            onClick={() => setHoleIndex((i) => Math.min(17, i + 1))}
          >
            Next
          </button>
        </div>

        <div className="mt-6 flex justify-center gap-5 pb-6">
          <CircularAction
            label="Send"
            icon={<Send />}
            variant="primary"
            disabled={submitting || !hole}
            onClick={() => void handleSubmitHole()}
          />
          <CircularAction
            label="Board"
            icon={<Trophy />}
            href={routes.leaderboard}
          />
          <CircularAction label="Home" icon={<Home />} href={routes.home} />
        </div>
      </div>
    </FairwayShell>
  );
}
