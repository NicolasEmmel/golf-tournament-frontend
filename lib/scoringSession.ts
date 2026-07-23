const STORAGE_KEY = "golf-scoring-session";

export type ScoringSession = {
  playerUuid: string;
  holeIndex: number;
};

export function loadScoringSession(): ScoringSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ScoringSession>;
    if (
      typeof parsed.playerUuid !== "string" ||
      typeof parsed.holeIndex !== "number" ||
      !Number.isFinite(parsed.holeIndex)
    ) {
      return null;
    }
    return {
      playerUuid: parsed.playerUuid,
      holeIndex: parsed.holeIndex,
    };
  } catch {
    return null;
  }
}

export function saveScoringSession(session: ScoringSession): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearScoringSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}
