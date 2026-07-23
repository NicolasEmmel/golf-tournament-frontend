/**
 * Seed a demo tournament for UI testing (does not reset afterwards).
 */
import { writeFileSync } from "node:fs";

const BASE = process.env.API_BASE ?? "https://golf-tournament-backend.fly.dev";

async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`${method} ${path} ${res.status} ${JSON.stringify(data)}`);
  return data;
}

const players = [];
await api("POST", "/api/tournament/reset", { totalDays: 3 });
for (const p of [
  { name: "Alice Men", handicapIndex: 12.4, gender: 0, isSenior: false },
  { name: "Bob Men", handicapIndex: 8.1, gender: 0, isSenior: false },
  { name: "Carla Women", handicapIndex: 15.0, gender: 1, isSenior: false },
  { name: "Diana Women", handicapIndex: 20.2, gender: 1, isSenior: false },
]) {
  players.push(await api("POST", "/api/players", p));
}
await api("POST", "/api/flights", { day: 1, number: 1 });
await api("POST", "/api/flights", { day: 1, number: 2 });
await api("POST", "/api/flights/assign", { day: 1, flightNumber: 1, playerUuid: players[0].uuid });
await api("POST", "/api/flights/assign", { day: 1, flightNumber: 1, playerUuid: players[1].uuid });
await api("POST", "/api/flights/assign", { day: 1, flightNumber: 2, playerUuid: players[2].uuid });
await api("POST", "/api/flights/assign", { day: 1, flightNumber: 2, playerUuid: players[3].uuid });

writeFileSync(new URL("./seed-result.json", import.meta.url), JSON.stringify(players, null, 2));
console.log("Seeded players:", players.map((p) => p.name).join(", "));
