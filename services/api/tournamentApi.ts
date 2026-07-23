import type {
  AssignPlayerToFlightRequest,
  CreateFlightRequest,
  Flight,
  Hole,
  LeaderboardSnapshot,
  OperationResult,
  PlayerFlight,
  PlayerScorecard,
  ResetTournamentRequest,
  SetCurrentDayRequest,
  TournamentState,
} from "@/models/tournament";
import { apiFetch } from "./http";

export interface CourseInfo {
  par: number;
  holes: Hole[];
}

export const tournamentApi = {
  getState: () => apiFetch<TournamentState>("/api/tournament/state"),
  setCurrentDay: (body: SetCurrentDayRequest) =>
    apiFetch<TournamentState>("/api/tournament/current-day", {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  reset: (body: ResetTournamentRequest = {}) =>
    apiFetch<OperationResult>("/api/tournament/reset", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getCourse: () => apiFetch<CourseInfo>("/api/tournament/course"),
  getLeaderboards: (day: number) =>
    apiFetch<LeaderboardSnapshot[]>(`/api/tournament/leaderboards/${day}`),
  getScorecard: (day: number, playerUuid: string) =>
    apiFetch<PlayerScorecard>(
      `/api/tournament/scorecard/${day}/${playerUuid}`,
    ),
} as const;

export const flightApi = {
  listForDay: (day: number) => apiFetch<Flight[]>(`/api/flights/${day}`),
  create: (body: CreateFlightRequest) =>
    apiFetch<Flight>("/api/flights", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  assign: (body: AssignPlayerToFlightRequest) =>
    apiFetch<PlayerFlight>("/api/flights/assign", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  unassign: (day: number, playerUuid: string) =>
    apiFetch<OperationResult>(`/api/flights/${day}/players/${playerUuid}`, {
      method: "DELETE",
    }),
  playersInFlight: (day: number, flightNumber: number) =>
    apiFetch<PlayerFlight[]>(`/api/flights/${day}/${flightNumber}/players`),
} as const;
