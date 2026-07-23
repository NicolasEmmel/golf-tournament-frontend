const STORAGE_KEY = "golf-admin-unlocked";

/** Intentionally client-side only — keeps casual visitors out of admin UI. */
export const ADMIN_PASSWORD = "gckitzingen2026";

export function isAdminUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(STORAGE_KEY) === "1";
}

export function unlockAdmin(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, "1");
}

export function lockAdmin(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}
