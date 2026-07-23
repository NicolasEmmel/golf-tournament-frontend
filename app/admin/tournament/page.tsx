"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { FairwayShell } from "@/components/common/FairwayShell";
import { MintCard } from "@/components/common/MintCard";
import { useTournament } from "@/context/TournamentContext";
import { routes } from "@/lib/constants";
import { normalizeError } from "@/lib/errors";
import {
  tournamentApi,
  type CourseInfo,
} from "@/services/api/tournamentApi";

export default function AdminTournamentPage() {
  const { state, refresh, setCurrentDay } = useTournament();
  const [dayInput, setDayInput] = useState(1);
  const [totalDays, setTotalDays] = useState(3);
  const [course, setCourse] = useState<CourseInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (state) {
      setDayInput(state.currentDay);
      setTotalDays(state.totalDays);
    }
  }, [state]);

  useEffect(() => {
    void tournamentApi.getCourse().then(setCourse).catch(() => undefined);
  }, []);

  const saveDay = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await setCurrentDay(dayInput);
      setMessage(`Aktueller Tag auf ${dayInput} gesetzt.`);
    } catch (err) {
      setError(normalizeError(err));
    }
  };

  const doReset = async () => {
    setConfirmReset(false);
    setError(null);
    try {
      await tournamentApi.reset({ totalDays });
      await refresh();
      setMessage("Turnier zurückgesetzt.");
    } catch (err) {
      setError(normalizeError(err));
    }
  };

  return (
    <FairwayShell>
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
        <div className="flex items-center justify-between gap-3">
          <MintCard className="flex-1">
            <h1 className="text-2xl font-black text-primary">Turnier</h1>
            <p className="text-sm text-muted">
              Aktueller Tag {state?.currentDay ?? "—"} von{" "}
              {state?.totalDays ?? "—"}
            </p>
          </MintCard>
          <Link
            href={routes.admin}
            className="rounded-xl bg-surface px-4 py-2 text-sm font-semibold text-primary shadow-sm"
          >
            Zurück
          </Link>
        </div>

        <form
          onSubmit={saveDay}
          className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-soft)]"
        >
          <h2 className="font-bold text-primary">Aktuellen Tag ändern</h2>
          <label className="mt-3 block text-sm font-semibold">
            Tag
            <input
              type="number"
              min={1}
              max={state?.totalDays ?? 10}
              value={dayInput}
              onChange={(e) => setDayInput(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-border px-3 py-2"
            />
          </label>
          <button
            type="submit"
            className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            Tag aktualisieren
          </button>
        </form>

        <div className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-soft)]">
          <h2 className="font-bold text-primary">Platz</h2>
          {course ? (
            <p className="mt-2 text-sm text-muted">
              Par {course.par} · {course.holes.length} Löcher
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted">Platz wird geladen…</p>
          )}
          {course && (
            <div className="mt-3 grid grid-cols-6 gap-2 text-center text-xs sm:grid-cols-9">
              {course.holes.map((h) => (
                <div
                  key={h.number}
                  className="rounded-lg bg-surface-mint px-1 py-2 font-semibold"
                >
                  <div className="text-primary">{h.number}</div>
                  <div>P{h.par}</div>
                  <div className="text-muted">SI{h.strokeIndex}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-error/30 bg-surface p-5 shadow-[var(--shadow-soft)]">
          <h2 className="font-bold text-error">Turnier zurücksetzen</h2>
          <p className="mt-2 text-sm text-muted">
            Löscht alle Turnierdaten in Redis (Spieler, Flights, Ergebnisse,
            Ranglisten) und startet ein neues Turnier.
          </p>
          <label className="mt-3 block text-sm font-semibold">
            Anzahl Tage nach dem Reset
            <input
              type="number"
              min={1}
              value={totalDays}
              onChange={(e) => setTotalDays(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-border px-3 py-2"
            />
          </label>
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="mt-4 rounded-xl bg-error px-4 py-2 text-sm font-semibold text-white"
          >
            Turnier zurücksetzen…
          </button>
        </div>

        {error && <p className="text-sm font-semibold text-error">{error}</p>}
        {message && (
          <p className="text-sm font-semibold text-success">{message}</p>
        )}
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="Gesamtes Turnier zurücksetzen?"
        message="Dadurch werden Spieler, Flights, Ergebnisse und Ranglisten in Redis dauerhaft gelöscht."
        confirmLabel="Zurücksetzen"
        destructive
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => void doReset()}
      />
    </FairwayShell>
  );
}
