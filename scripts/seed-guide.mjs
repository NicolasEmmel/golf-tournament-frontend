/**
 * Cheap seed for guide screenshots: few players, few holes, day 1+2 for Heute/Gesamt.
 * Run: node scripts/seed-guide.mjs
 */
import * as signalR from "@microsoft/signalr";

const BASE = process.env.API_BASE ?? "https://golf-tournament-backend.fly.dev";
const HUB = `${BASE}/hubs/tournament`;

async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body
      ? { "Content-Type": "application/json", Accept: "application/json" }
      : { Accept: "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(
      `${method} ${path} → ${res.status}: ${JSON.stringify(data)}`,
    );
  }
  return data;
}

function connectHub() {
  const conn = new signalR.HubConnectionBuilder()
    .withUrl(HUB)
    .configureLogging(signalR.LogLevel.Error)
    .build();
  conn.on("ReceiveSyncState", () => {});
  conn.on("ScorecardUpdated", () => {});
  conn.on("LeaderboardUpdated", () => {});
  return conn;
}

async function withHub(fn) {
  const conn = connectHub();
  await conn.start();
  try {
    return await fn(conn);
  } finally {
    await conn.stop().catch(() => undefined);
  }
}

async function scoreHoles(day, players, holes) {
  await withHub(async (conn) => {
    const reg = await conn.invoke("RegisterScoringClient", players[0].uuid);
    if (!reg?.success) {
      throw new Error(`Register failed: ${reg?.error}`);
    }
    for (const hole of holes) {
      for (const [idx, player] of players.entries()) {
        const strokes = 4 + ((hole + idx) % 3);
        const result = await conn.invoke("SubmitScore", {
          day,
          playerUuid: player.uuid,
          holeId: hole,
          strokes,
        });
        if (!result?.success) {
          throw new Error(
            `Score ${player.name} h${hole}: ${result?.error ?? "failed"}`,
          );
        }
      }
      console.log(`  Day ${day} hole ${hole} ok`);
    }
  });
}

async function main() {
  console.log(`Seeding guide data on ${BASE}`);

  await api("POST", "/api/tournament/reset", { totalDays: 2 });
  console.log("Reset (2 days)");

  const men = [];
  for (const name of ["Tom Weber", "Jonas Keller", "Markus Lang"]) {
    men.push(
      await api("POST", "/api/players", {
        name,
        gender: 0,
        handicapIndex: 12.4,
        isSenior: false,
      }),
    );
  }
  const women = [];
  for (const name of ["Anna Meier", "Laura Beck"]) {
    women.push(
      await api("POST", "/api/players", {
        name,
        gender: 1,
        handicapIndex: 18.2,
        isSenior: false,
      }),
    );
  }
  const seniors = [];
  for (const name of ["Peter Hoffmann", "Klaus Bauer"]) {
    seniors.push(
      await api("POST", "/api/players", {
        name,
        gender: 0,
        handicapIndex: 22.0,
        isSenior: true,
      }),
    );
  }
  console.log(
    `Players: ${men.length} men, ${women.length} women, ${seniors.length} seniors`,
  );

  // Day 1 — one flight, holes 1–4 (leave flight open for scoring screenshots)
  await api("POST", "/api/flights", { day: 1, number: 1 });
  for (const p of men) {
    await api("POST", "/api/flights/assign", {
      day: 1,
      flightNumber: 1,
      playerUuid: p.uuid,
    });
  }
  console.log("Day 1 flight 1 assigned");
  await scoreHoles(1, men, [1, 2, 3, 4]);

  // Day 2 — three small flights so all categories appear; score 1–2 holes
  await api("PUT", "/api/tournament/current-day", { day: 2 });
  await api("POST", "/api/flights", { day: 2, number: 1 });
  await api("POST", "/api/flights", { day: 2, number: 2 });
  await api("POST", "/api/flights", { day: 2, number: 3 });
  for (const p of men) {
    await api("POST", "/api/flights/assign", {
      day: 2,
      flightNumber: 1,
      playerUuid: p.uuid,
    });
  }
  for (const p of women) {
    await api("POST", "/api/flights/assign", {
      day: 2,
      flightNumber: 2,
      playerUuid: p.uuid,
    });
  }
  for (const p of seniors) {
    await api("POST", "/api/flights/assign", {
      day: 2,
      flightNumber: 3,
      playerUuid: p.uuid,
    });
  }
  console.log("Day 2 flights assigned");
  await scoreHoles(2, men, [1, 2]);
  await scoreHoles(2, women, [1, 2]);
  await scoreHoles(2, seniors, [1]);

  const boards = await api("GET", "/api/tournament/leaderboards/2");
  for (const b of boards) {
    const n = (b.entries ?? []).length;
    console.log(`Leaderboard cat ${b.category}: ${n} entries`);
  }

  console.log("\n=== GUIDE SEED READY ===");
  console.log("Current day: 2");
  console.log(`Scoring demo player: ${men[0].name} (${men[0].uuid})`);
  console.log("Open /scoring → pick Tom Weber (hole ~3)");
  console.log("Open /leaderboard → Heute ≠ Gesamt for men");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
