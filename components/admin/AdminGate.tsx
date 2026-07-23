"use client";

import { useEffect, useState } from "react";
import { FairwayShell } from "@/components/common/FairwayShell";
import { MintCard } from "@/components/common/MintCard";
import {
  ADMIN_PASSWORD,
  isAdminUnlocked,
  unlockAdmin,
} from "@/lib/adminAuth";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUnlocked(isAdminUnlocked());
    setReady(true);
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      unlockAdmin();
      setUnlocked(true);
      setError(null);
      setPassword("");
      return;
    }
    setError("Falsches Passwort.");
  };

  if (!ready) {
    return (
      <FairwayShell>
        <div className="mx-auto w-full max-w-md px-4 py-16" />
      </FairwayShell>
    );
  }

  if (!unlocked) {
    return (
      <FairwayShell>
        <div className="mx-auto w-full max-w-md px-4 py-16">
          <MintCard>
            <h1 className="text-2xl font-black text-primary">Verwaltung</h1>
            <p className="mt-2 text-sm text-muted">
              Bitte Passwort eingeben, um fortzufahren.
            </p>
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <label className="block text-sm font-semibold">
                Passwort
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  className="mt-1 w-full rounded-xl border border-border px-3 py-2"
                  autoFocus
                />
              </label>
              {error && (
                <p className="text-sm font-semibold text-error">{error}</p>
              )}
              <button
                type="submit"
                className="w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
              >
                Entsperren
              </button>
            </form>
          </MintCard>
        </div>
      </FairwayShell>
    );
  }

  return <>{children}</>;
}
