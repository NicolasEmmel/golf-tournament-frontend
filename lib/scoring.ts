export type DraftScores = Record<string, number>;

export const HOLE_COUNT = 18;

export function scoreDraftKey(playerUuid: string, holeId: number): string {
  return `${playerUuid}:${holeId}`;
}

/** True when every flight mate has a positive stroke count for holes 1–18. */
export function isFlightDayComplete(
  mateUuids: string[],
  scores: DraftScores,
  holeCount = HOLE_COUNT,
): boolean {
  if (mateUuids.length === 0) return false;
  return mateUuids.every((uuid) =>
    Array.from({ length: holeCount }, (_, i) => i + 1).every(
      (holeId) => (scores[scoreDraftKey(uuid, holeId)] ?? 0) > 0,
    ),
  );
}
