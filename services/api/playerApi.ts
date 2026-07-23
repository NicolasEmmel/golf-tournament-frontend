import type {
  CreatePlayerRequest,
  OperationResult,
  Player,
  UpdatePlayerRequest,
} from "@/models/tournament";
import { apiFetch } from "./http";

export const playerApi = {
  list: () => apiFetch<Player[]>("/api/players"),
  get: (uuid: string) => apiFetch<Player>(`/api/players/${uuid}`),
  create: (body: CreatePlayerRequest) =>
    apiFetch<Player>("/api/players", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (uuid: string, body: UpdatePlayerRequest) =>
    apiFetch<Player>(`/api/players/${uuid}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  remove: (uuid: string) =>
    apiFetch<OperationResult>(`/api/players/${uuid}`, { method: "DELETE" }),
} as const;
