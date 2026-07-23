/**
 * Full tournament simulation against production.
 * Day 1: Men only (9 players, 3 flights).
 * Day 2–3: Men + Women + Seniors (27 players, 9 flights of 3).
 *
 * Run: node scripts/simulate-tournament.mjs
 */
import * as signalR from "@microsoft/signalr";

const BASE = process.env.API_BASE ?? "https://golf-tournament-backend.fly.dev";
const HUB = `${BASE}/hubs/tournament`;

const issues = [];
const notes = [];

function log(msg) {
  console.log(msg);
}
function issue(msg) {
  issues.push(msg);
  console.error("BUG ", msg);
}
function note(msg) {
  notes.push(msg);
  console.log("NOTE", msg);
}

async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body
      ? { "Content-Type": "application/json", Accept: "application/json" }
      : { Accept: "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const err = new Error(
      `${method} ${path} → ${res.status}: ${typeof data === "object" ? JSON.stringify(data) : data}`,
    );
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function connectHub() {
  const conn = new signalR.HubConnectionBuilder()
    .withUrl(HUB)
    .withAutomaticReconnect([0, 500, 1000])
    .configureLogging(signalR.LogLevel.Error)
    .build();
  // Ignore broadcasts so the client does not stall on unexpected invocation results.
  conn.on("ReceiveSyncState", () => {});
  conn.on("ScorecardUpdated", () => {});
  conn.on("LeaderboardUpdated", () => {});
  return conn;
}

async function submitScore(conn, day, playerUuid, holeId, strokes) {
  return conn.invoke("SubmitScore", { day, playerUuid, holeId, strokes });
}

async function scoreFlightsConcurrent(day, flights, holesToPlay, label) {
  log(`\n--- Concurrent stress ${label}: ${flights.length} flights, holes 1–${holesToPlay} ---`);
  const connections = [];
  try {
    for (const flight of flights) {
      const conn = connectHub();
      await conn.start();
      const reg = await conn.invoke(
        "RegisterScoringClient",
        flight.players[0].uuid,
      );
      if (!reg?.success) {
        issue(`Concurrent register failed: ${reg?.error}`);
      }
      connections.push({ conn, flight });
    }

    const started = Date.now();
    let timedOut = false;
    const work = (async () => {
      for (let hole = 1; hole <= holesToPlay; hole++) {
        await Promise.all(
          connections.map(async ({ conn, flight }) => {
            for (const [idx, player] of flight.players.entries()) {
              const strokes = 4 + ((hole + idx) % 3);
              const result = await submitScore(
                conn,
                day,
                player.uuid,
                hole,
                strokes,
              );
              if (!result?.success) {
                issue(
                  `Concurrent score failed ${player.name} h${hole}: ${result?.error}`,
                );
              }
            }
          }),
        );
      }
    })();

    const timeoutMs = 60_000;
    await Promise.race([
      work,
      new Promise((_, reject) =>
        setTimeout(() => {
          timedOut = true;
          reject(new Error(`Concurrent scoring timed out after ${timeoutMs}ms`));
        }, timeoutMs),
      ),
    ]).catch((err) => {
      issue(String(err.message || err));
    });

    if (!timedOut) {
      note(
        `Concurrent ${flights.length} flights × ${holesToPlay} holes completed in ${Date.now() - started}ms`,
      );
    }
  } finally {
    await Promise.all(
      connections.map(({ conn }) => conn.stop().catch(() => undefined)),
    );
  }
}

function menNames() {
  return [
    "Tom Weber",
    "Jonas Keller",
    "Markus Lang",
    "Paul Richter",
    "Felix Braun",
    "Lukas Hofmann",
    "Niklas Vogel",
    "Simon Krüger",
    "David Schneider",
  ];
}
function womenNames() {
  return [
    "Anna Meier",
    "Laura Beck",
    "Sarah Klein",
    "Julia Wolf",
    "Lisa Hartmann",
    "Emma Schäfer",
    "Mia König",
    "Nina Fischer",
    "Clara Wagner",
  ];
}
function seniorNames() {
  return [
    "Hans Müller",
    "Peter Schmitt",
    "Wolfgang Koch",
    "Helga Bauer",
    "Ingrid Schulz",
    "Werner Hoffmann",
    "Gertrud Neumann",
    "Karl Zimmermann",
    "Monika Krause",
  ];
}

async function createPlayers() {
  const created = { men: [], women: [], seniors: [] };
  for (const [i, name] of menNames().entries()) {
    created.men.push(
      await api("POST", "/api/players", {
        name,
        handicapIndex: 8 + i * 0.7,
        gender: 0,
        isSenior: false,
      }),
    );
  }
  for (const [i, name] of womenNames().entries()) {
    created.women.push(
      await api("POST", "/api/players", {
        name,
        handicapIndex: 12 + i * 0.6,
        gender: 1,
        isSenior: false,
      }),
    );
  }
  for (const [i, name] of seniorNames().entries()) {
    const female = i >= 3 && i <= 4 || i === 6 || i === 8;
    created.seniors.push(
      await api("POST", "/api/players", {
        name,
        handicapIndex: 16 + i * 0.5,
        gender: female ? 1 : 0,
        isSenior: true,
      }),
    );
  }
  return created;
}

async function createFlightsForDay(day, groups) {
  /** @type {{ number: number, players: any[] }[]} */
  const flights = [];
  let flightNo = 1;
  for (const group of groups) {
    for (let i = 0; i < group.length; i += 3) {
      const slice = group.slice(i, i + 3);
      await api("POST", "/api/flights", { day, number: flightNo });
      for (const p of slice) {
        await api("POST", "/api/flights/assign", {
          day,
          flightNumber: flightNo,
          playerUuid: p.uuid,
        });
      }
      flights.push({ number: flightNo, players: slice });
      flightNo += 1;
    }
  }
  return flights;
}

async function withHub(fn) {
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt++) {
    const conn = connectHub();
    try {
      await conn.start();
      return await fn(conn);
    } catch (err) {
      lastError = err;
      note(`SignalR attempt ${attempt} failed: ${err.message ?? err}`);
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    } finally {
      await conn.stop().catch(() => undefined);
    }
  }
  throw lastError;
}

async function scoreDay(day, flights, holesToPlay = 18) {
  log(`\n--- Scoring day ${day} (${flights.length} flights, holes 1–${holesToPlay}) ---`);

  for (const flight of flights) {
    await withHub(async (conn) => {
      const scorer = flight.players[0];
      const reg = await conn.invoke("RegisterScoringClient", scorer.uuid);
      if (!reg?.success) {
        issue(
          `Day ${day} Flight ${flight.number}: RegisterScoringClient failed for ${scorer.name}: ${reg?.error ?? "unknown"}`,
        );
        return;
      }

      for (let hole = 1; hole <= holesToPlay; hole++) {
        for (const [idx, player] of flight.players.entries()) {
          const strokes = 3 + ((hole + idx + day) % 4);
          let result;
          try {
            result = await submitScore(conn, day, player.uuid, hole, strokes);
          } catch (err) {
            // Reconnect mid-flight and continue from this hole
            throw err;
          }
          if (!result?.success) {
            issue(
              `Day ${day} hole ${hole} ${player.name}: ${result?.error ?? "submit failed"}`,
            );
          }
        }
      }
      log(
        `  Day ${day}: Flight ${flight.number} finished (${flight.players.map((p) => p.name).join(", ")})`,
      );
    });
  }
}

async function verifyLeaderboards(day, expect) {
  const boards = await api("GET", `/api/tournament/leaderboards/${day}`);
  const byCat = Object.fromEntries(
    boards.map((b) => [b.category, b.entries ?? []]),
  );
  // categories: 0 men, 1 women, 2 seniors (confirm)
  const men = byCat[0] ?? byCat["men"] ?? [];
  const women = byCat[1] ?? byCat["women"] ?? [];
  const seniors = byCat[2] ?? byCat["seniors"] ?? [];

  log(
    `Leaderboards day ${day}: Men=${men.length}, Women=${women.length}, Seniors=${seniors.length}`,
  );

  if (expect.men != null && men.length !== expect.men) {
    issue(
      `Day ${day} Men leaderboard expected ${expect.men} entries, got ${men.length}`,
    );
  }
  if (expect.women != null && women.length !== expect.women) {
    issue(
      `Day ${day} Women leaderboard expected ${expect.women} entries, got ${women.length}`,
    );
  }
  if (expect.seniors != null && seniors.length !== expect.seniors) {
    issue(
      `Day ${day} Seniors leaderboard expected ${expect.seniors} entries, got ${seniors.length}`,
    );
  }

  // Sample: positions should be unique and thru should match holes played
  for (const [label, entries] of [
    ["Men", men],
    ["Women", women],
    ["Seniors", seniors],
  ]) {
    const uuids = new Set(entries.map((e) => e.playerUuid));
    if (uuids.size !== entries.length) {
      issue(`Day ${day} ${label}: duplicate playerUuid on leaderboard`);
    }
    for (const e of entries) {
      if (expect.thru != null && e.thru !== expect.thru) {
        issue(
          `Day ${day} ${label} ${e.playerName}: thru=${e.thru}, expected ${expect.thru}`,
        );
      }
    }
  }

  return { men, women, seniors };
}

async function main() {
  log(`Simulating tournament against ${BASE}\n`);

  await api("POST", "/api/tournament/reset", { totalDays: 3 });
  log("Reset tournament (3 days)");

  const players = await createPlayers();
  log(
    `Created players: ${players.men.length} men, ${players.women.length} women, ${players.seniors.length} seniors`,
  );

  // --- Day 1: men only ---
  let state = await api("GET", "/api/tournament/state");
  if (state.currentDay !== 1) {
    issue(`Expected currentDay 1 after reset, got ${state.currentDay}`);
  }

  const day1Flights = await createFlightsForDay(1, [players.men]);
  log(`Day 1 flights: ${day1Flights.length} (men only)`);
  if (day1Flights.length !== 3) {
    issue(`Expected 3 day-1 flights, got ${day1Flights.length}`);
  }

  // Women/seniors should not be able to register on day 1 (no flight)
  const probe = connectHub();
  await probe.start();
  const badReg = await probe.invoke(
    "RegisterScoringClient",
    players.women[0].uuid,
  );
  if (badReg?.success) {
    issue(
      "Day 1: woman without flight could register for scoring (should fail)",
    );
  } else {
    note(`Day 1: unassigned woman correctly blocked — ${badReg?.error}`);
  }
  await probe.stop();

  await scoreDay(1, day1Flights, 18);
  await verifyLeaderboards(1, { men: 9, women: 0, seniors: 0, thru: 18 });

  // Concurrent stress with all 3 day-1 flights for a few holes (re-score)
  await scoreFlightsConcurrent(1, day1Flights, 3, "day1-3flights");

  // Scoring previous day after advancing should fail — first advance
  await api("PUT", "/api/tournament/current-day", { day: 2 });
  log("Advanced to day 2");

  const late = connectHub();
  await late.start();
  const lateReg = await late.invoke(
    "RegisterScoringClient",
    players.men[0].uuid,
  );
  // Player has no day-2 flight yet
  if (lateReg?.success) {
    note(
      "After day advance but before day-2 assignment, prior-day player could still register — checking assign next",
    );
  } else {
    note(`Before day-2 flights: register blocked — ${lateReg?.error}`);
  }
  await late.stop();

  // --- Day 2: all groups ---
  const day2Flights = await createFlightsForDay(2, [
    players.men,
    players.women,
    players.seniors,
  ]);
  log(`Day 2 flights: ${day2Flights.length}`);
  if (day2Flights.length !== 9) {
    issue(`Expected 9 day-2 flights, got ${day2Flights.length}`);
  }

  await scoreDay(2, day2Flights, 18);
  await verifyLeaderboards(2, { men: 9, women: 9, seniors: 9, thru: 18 });

  // Cannot score day 1 while on day 2
  const d2conn = connectHub();
  await d2conn.start();
  await d2conn.invoke("RegisterScoringClient", players.men[0].uuid);
  const wrongDay = await submitScore(
    d2conn,
    1,
    players.men[0].uuid,
    1,
    4,
  );
  if (wrongDay?.success) {
    issue("Accepted score for day 1 while tournament current day is 2");
  } else {
    note(`Cross-day score correctly rejected — ${wrongDay?.error}`);
  }
  await d2conn.stop();

  // --- Day 3 ---
  await api("PUT", "/api/tournament/current-day", { day: 3 });
  log("Advanced to day 3");

  const day3Flights = await createFlightsForDay(3, [
    players.men,
    players.women,
    players.seniors,
  ]);
  log(`Day 3 flights: ${day3Flights.length}`);
  if (day3Flights.length !== 9) {
    issue(`Expected 9 day-3 flights, got ${day3Flights.length}`);
  }

  await scoreDay(3, day3Flights, 18);
  await verifyLeaderboards(3, { men: 9, women: 9, seniors: 9, thru: 18 });

  // Multi-client concurrent stress: two flights submit same hole simultaneously (already done in scoreDay)
  // Overwrite score on day 3
  const ov = connectHub();
  await ov.start();
  await ov.invoke("RegisterScoringClient", players.women[0].uuid);
  const first = await submitScore(ov, 3, players.women[0].uuid, 5, 6);
  const second = await submitScore(ov, 3, players.women[0].uuid, 5, 4);
  if (!first?.success || !second?.success) {
    issue(`Score overwrite failed: ${JSON.stringify({ first, second })}`);
  } else {
    note("Duplicate/overwrite score on same hole succeeded (last write wins)");
  }
  const card = await api(
    "GET",
    `/api/tournament/scorecard/3/${players.women[0].uuid}`,
  );
  const hole5 = card.holes?.find((h) => h.holeId === 5);
  if (hole5 && hole5.strokes !== 4) {
    issue(`Expected hole 5 strokes=4 after overwrite, got ${hole5?.strokes}`);
  }
  await ov.stop();

  // Invalid hole
  const inv = connectHub();
  await inv.start();
  await inv.invoke("RegisterScoringClient", players.men[1].uuid);
  const badHole = await submitScore(inv, 3, players.men[1].uuid, 99, 4);
  if (badHole?.success) {
    issue("Invalid hole 99 was accepted");
  } else {
    note(`Invalid hole rejected — ${badHole?.error}`);
  }
  await inv.stop();

  state = await api("GET", "/api/tournament/state");
  log(`\nFinal state: day ${state.currentDay} of ${state.totalDays}`);

  console.log("\n======== SUMMARY ========");
  console.log(`Issues: ${issues.length}`);
  for (const i of issues) console.log(" -", i);
  console.log(`Notes: ${notes.length}`);
  for (const n of notes) console.log(" -", n);

  if (issues.length) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
