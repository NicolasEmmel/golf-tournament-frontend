"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { FairwayShell } from "@/components/common/FairwayShell";
import { LoadingState } from "@/components/common/LoadingState";
import { MintCard } from "@/components/common/MintCard";
import { routes } from "@/lib/constants";
import { normalizeError } from "@/lib/errors";
import { Gender, type Player } from "@/models/tournament";
import { playerApi } from "@/services/api/playerApi";

const emptyForm = {
  name: "",
  handicapIndex: 18,
  gender: Gender.Male,
  isSenior: false,
};

export default function AdminPlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<Player | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Player | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPlayers(await playerApi.list());
    } catch (err) {
      setError(normalizeError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await playerApi.update(editing.uuid, {
          name: form.name.trim(),
          handicapIndex: Number(form.handicapIndex),
          gender: form.gender,
          isSenior: form.isSenior,
        });
      } else {
        await playerApi.create({
          name: form.name.trim(),
          handicapIndex: Number(form.handicapIndex),
          gender: form.gender,
          isSenior: form.isSenior,
        });
      }
      setForm(emptyForm);
      setEditing(null);
      await refresh();
    } catch (err) {
      setError(normalizeError(err));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await playerApi.remove(pendingDelete.uuid);
      setPendingDelete(null);
      await refresh();
    } catch (err) {
      setError(normalizeError(err));
      setPendingDelete(null);
    }
  };

  return (
    <FairwayShell>
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8">
        <div className="flex items-center justify-between gap-3">
          <MintCard className="flex-1">
            <h1 className="text-2xl font-black text-primary">Players</h1>
            <p className="text-sm text-muted">
              Players must exist before they can register for scoring by name.
            </p>
          </MintCard>
          <Link
            href={routes.admin}
            className="rounded-xl bg-surface px-4 py-2 text-sm font-semibold text-primary shadow-sm"
          >
            Back
          </Link>
        </div>

        <form
          onSubmit={onSubmit}
          className="grid gap-3 rounded-2xl bg-surface p-5 shadow-[var(--shadow-soft)] md:grid-cols-2"
        >
          <h2 className="md:col-span-2 text-lg font-bold text-primary">
            {editing ? `Edit ${editing.name}` : "Add player"}
          </h2>
          <label className="block text-sm font-semibold">
            Name
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-border px-3 py-2"
            />
          </label>
          <label className="block text-sm font-semibold">
            Gender
            <select
              value={form.gender}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  gender: Number(e.target.value) as Gender,
                }))
              }
              className="mt-1 w-full rounded-xl border border-border px-3 py-2"
            >
              <option value={Gender.Male}>Male</option>
              <option value={Gender.Female}>Female</option>
            </select>
          </label>
          <label className="flex items-center gap-2 self-end text-sm font-semibold">
            <input
              type="checkbox"
              checked={form.isSenior}
              onChange={(e) =>
                setForm((f) => ({ ...f, isSenior: e.target.checked }))
              }
              className="h-4 w-4 accent-primary"
            />
            Senior
          </label>
          <div className="md:col-span-2 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {editing ? "Save changes" : "Create player"}
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setForm(emptyForm);
                }}
                className="rounded-xl px-4 py-2 text-sm font-semibold"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {error && <p className="text-sm font-semibold text-error">{error}</p>}

        {loading ? (
          <LoadingState />
        ) : (
          <div className="overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-soft)]">
            <table className="w-full text-sm">
              <thead className="bg-surface-mint text-left text-xs font-bold uppercase text-primary">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Gender</th>
                  <th className="px-4 py-3">Senior</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {players.map((p) => (
                  <tr key={p.uuid} className="border-t border-border/60">
                    <td className="px-4 py-3 font-semibold">{p.name}</td>
                    <td className="px-4 py-3">
                      {p.gender === Gender.Female ? "Female" : "Male"}
                    </td>
                    <td className="px-4 py-3">{p.isSenior ? "Yes" : "No"}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        type="button"
                        className="text-primary font-semibold"
                        onClick={() => {
                          setEditing(p);
                          setForm({
                            name: p.name,
                            handicapIndex: p.handicapIndex,
                            gender: p.gender,
                            isSenior: p.isSenior,
                          });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="font-semibold text-error"
                        onClick={() => setPendingDelete(p)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {players.length === 0 && (
              <p className="p-6 text-center text-muted">No players yet.</p>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete player?"
        message={`Remove ${pendingDelete?.name ?? "this player"} from the tournament registry?`}
        confirmLabel="Delete"
        destructive
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
      />
    </FairwayShell>
  );
}
