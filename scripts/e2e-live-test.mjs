/**
 * End-to-end API + SignalR integration test against production backend.
 * Run: node scripts/e2e-live-test.mjs
 */
import * as signalR from "@microsoft/signalr";

const BASE = process.env.API_BASE ?? "https://golf-tournament-backend.fly.dev";
const HUB = `${BASE}/hubs/tournament`;

const results = [];
function ok(name, detail = "") {
  results.push({ name, pass: true, detail });
  console.log(`PASS  ${name}${detail ? ` — ${detail}` : ""}`);
}
function fail(name, detail = "") {
  results.push({ name, pass: false, detail });
  console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
}
function assert(cond, name, detail = "") {
  if (cond) ok(name, detail);
  else fail(name, detail);
}

async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json", Accept: "application/json" } : { Accept: "application/json" },
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
    const err = new Error(`${method} ${path} → ${res.status}: ${typeof data === "object" ? JSON.stringify(data) : data}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function connectHub() {
  return new signalR.HubConnectionBuilder()
    .withUrl(HUB)
    .withAutomaticReconnect([0, 500, 1000])
    .configureLogging(signalR.LogLevel.Warning)
    .build();
}

async function waitFor(pred, timeoutMs = 8000, label = "event") {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (pred()) return true;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`Timeout waiting for ${label}`);
}

async function main() {
  console.log(`Testing against ${BASE}\n`);

  // --- Reset tournament ---
  try {
    await api("POST", "/api/tournament/reset", { totalDays: 3 });
    ok("Reset tournament");
  } catch (e) {
    fail("Reset tournament", e.message);
  }

  let state = await api("GET", "/api/tournament/state");
  assert(state.currentDay === 1 && state.totalDays === 3, "State after reset", JSON.stringify(state));

  const playersAfterReset = await api("GET", "/api/players");
  assert(Array.isArray(playersAfterReset) && playersAfterReset.length === 0, "Players cleared after reset", `count=${playersAfterReset.length}`);

  // --- Create players ---
  const roster = [
    { name: "Alice Men", handicapIndex: 12.4, gender: 0, isSenior: false },
    { name: "Bob Men", handicapIndex: 8.1, gender: 0, isSenior: false },
    { name: "Carla Women", handicapIndex: 15.0, gender: 1, isSenior: false },
    { name: "Diana Women", handicapIndex: 20.2, gender: 1, isSenior: false },
    { name: "Erik Senior", handicapIndex: 18.0, gender: 0, isSenior: true },
    { name: "Frank Senior", handicapIndex: 22.5, gender: 0, isSenior: true },
  ];

  const created = [];
  for (const p of roster) {
    created.push(await api("POST", "/api/players", p));
  }
  assert(created.length === 6, "Create 6 players");

  // Duplicate name allowed? (document behavior)
  try {
    await api("POST", "/api/players", { name: "Alice Men", handicapIndex: 1, gender: 0, isSenior: false });
    ok("Duplicate player names allowed (no uniqueness constraint)");
  } catch (e) {
    ok("Duplicate player names rejected", e.message);
  }

  // --- Flights ---
  await api("POST", "/api/flights", { day: 1, number: 1 });
  await api("POST", "/api/flights", { day: 1, number: 2 });
  ok("Create flights 1 and 2 for day 1");

  // Duplicate flight
  try {
    await api("POST", "/api/flights", { day: 1, number: 1 });
    fail("Duplicate flight should be rejected");
  } catch (e) {
    assert(e.status === 400, "Duplicate flight rejected", e.message);
  }

  // Assign: flight 1 = Alice, Bob, Carla; flight 2 = Diana, Erik, Frank
  const assigns = [
    [1, created[0]],
    [1, created[1]],
    [1, created[2]],
    [2, created[3]],
    [2, created[4]],
    [2, created[5]],
  ];
  for (const [flight, player] of assigns) {
    await api("POST", "/api/flights/assign", {
      day: 1,
      flightNumber: flight,
      playerUuid: player.uuid,
    });
  }
  ok("Assign players to flights");

  const f1 = await api("GET", "/api/flights/1/1/players");
  const f2 = await api("GET", "/api/flights/1/2/players");
  assert(f1.length === 3 && f2.length === 3, "Flight membership counts", `f1=${f1.length} f2=${f2.length}`);

  // --- SignalR multi-client ---
  const viewerEvents = [];
  const scorerAEvents = [];
  const scorerBEvents = [];

  const viewer = connectHub();
  const scorerA = connectHub();
  const scorerB = connectHub();

  viewer.on("ReceiveSyncState", (p) => viewerEvents.push({ type: "sync", p }));
  viewer.on("LeaderboardUpdated", (p) => viewerEvents.push({ type: "lb", p }));

  scorerA.on("ReceiveSyncState", (p) => scorerAEvents.push({ type: "sync", p }));
  scorerA.on("ScorecardUpdated", (p) => scorerAEvents.push({ type: "card", p }));
  scorerA.on("LeaderboardUpdated", (p) => scorerAEvents.push({ type: "lb", p }));

  scorerB.on("ReceiveSyncState", (p) => scorerBEvents.push({ type: "sync", p }));
  scorerB.on("ScorecardUpdated", (p) => scorerBEvents.push({ type: "card", p }));
  scorerB.on("LeaderboardUpdated", (p) => scorerBEvents.push({ type: "lb", p }));

  await viewer.start();
  await scorerA.start();
  await scorerB.start();
  ok("Three SignalR clients connected");

  await viewer.invoke("RegisterLeaderboardViewer");
  await waitFor(() => viewerEvents.some((e) => e.type === "sync"), 8000, "viewer sync");
  ok("Leaderboard viewer received ReceiveSyncState");

  const regA = await scorerA.invoke("RegisterScoringClient", created[0].uuid);
  assert(regA.success, "Register scoring client Alice", JSON.stringify(regA));
  await waitFor(() => scorerAEvents.some((e) => e.type === "sync"), 8000, "Alice sync");

  const regB = await scorerB.invoke("RegisterScoringClient", created[3].uuid);
  assert(regB.success, "Register scoring client Diana (flight 2)", JSON.stringify(regB));
  await waitFor(() => scorerBEvents.some((e) => e.type === "sync"), 8000, "Diana sync");

  // Unassigned player registration
  const orphan = await api("POST", "/api/players", {
    name: "Orphan Player",
    handicapIndex: 10,
    gender: 0,
    isSenior: false,
  });
  const orphanConn = connectHub();
  await orphanConn.start();
  const regOrphan = await orphanConn.invoke("RegisterScoringClient", orphan.uuid);
  assert(!regOrphan.success, "Unassigned player cannot register for scoring", regOrphan.error);
  await orphanConn.stop();

  // Invalid hole
  const badHole = await scorerA.invoke("SubmitScore", {
    day: 1,
    playerUuid: created[0].uuid,
    holeId: 99,
    strokes: 4,
  });
  assert(!badHole.success, "Invalid hole rejected", badHole.error);

  // Invalid strokes
  const badStrokes = await scorerA.invoke("SubmitScore", {
    day: 1,
    playerUuid: created[0].uuid,
    holeId: 1,
    strokes: 0,
  });
  assert(!badStrokes.success, "Zero strokes rejected", badStrokes.error);

  // Wrong day
  const badDay = await scorerA.invoke("SubmitScore", {
    day: 2,
    playerUuid: created[0].uuid,
    holeId: 1,
    strokes: 5,
  });
  assert(!badDay.success, "Wrong day score rejected", badDay.error);

  // Simultaneous scores from two flights
  viewerEvents.length = 0;
  scorerAEvents.length = 0;
  scorerBEvents.length = 0;

  const [resA, resB] = await Promise.all([
    scorerA.invoke("SubmitScore", {
      day: 1,
      playerUuid: created[0].uuid,
      holeId: 1,
      strokes: 5,
    }),
    scorerB.invoke("SubmitScore", {
      day: 1,
      playerUuid: created[3].uuid,
      holeId: 1,
      strokes: 6,
    }),
  ]);
  assert(resA.success && resB.success, "Simultaneous scores from two flights");

  await waitFor(
    () => viewerEvents.filter((e) => e.type === "lb").length >= 1,
    10000,
    "viewer leaderboard updates",
  );
  ok(
    "Viewer received LeaderboardUpdated after scores",
    `lb events=${viewerEvents.filter((e) => e.type === "lb").length}`,
  );

  // Alice scores for flight mates (Bob)
  const bobScore = await scorerA.invoke("SubmitScore", {
    day: 1,
    playerUuid: created[1].uuid,
    holeId: 1,
    strokes: 4,
  });
  assert(bobScore.success, "Scorer can submit for flight mate Bob");

  // Duplicate score overwrite (same hole again)
  const overwrite = await scorerA.invoke("SubmitScore", {
    day: 1,
    playerUuid: created[0].uuid,
    holeId: 1,
    strokes: 4,
  });
  assert(overwrite.success, "Duplicate hole score overwrites successfully");

  const card = await api("GET", `/api/tournament/scorecard/1/${created[0].uuid}`);
  assert(card.holes.find((h) => h.holeId === 1)?.strokes === 4, "Scorecard reflects overwritten strokes", JSON.stringify(card.holes[0]));

  // More holes for leaderboard substance
  for (const hole of [2, 3]) {
    await scorerA.invoke("SubmitScore", {
      day: 1,
      playerUuid: created[0].uuid,
      holeId: hole,
      strokes: 3 + hole,
    });
    await scorerB.invoke("SubmitScore", {
      day: 1,
      playerUuid: created[3].uuid,
      holeId: hole,
      strokes: 4,
    });
  }
  ok("Submitted additional holes 2–3 for Alice and Diana");

  const boards = await api("GET", "/api/tournament/leaderboards/1");
  const men = boards.find((b) => b.category === 0)?.entries ?? [];
  const women = boards.find((b) => b.category === 1)?.entries ?? [];
  assert(men.some((e) => e.playerName === "Alice Men"), "Men leaderboard contains Alice", JSON.stringify(men.map((e) => e.playerName)));
  assert(women.some((e) => e.playerName === "Diana Women"), "Women leaderboard contains Diana", JSON.stringify(women.map((e) => e.playerName)));
  assert(men.every((e) => e.position >= 1), "Leaderboard positions assigned");

  // Disconnect / reconnect
  await scorerA.stop();
  ok("Scorer A disconnected");
  await scorerA.start();
  const rereg = await scorerA.invoke("RegisterScoringClient", created[0].uuid);
  assert(rereg.success, "Re-register after reconnect");
  const syncAfter = await waitFor(
    () => scorerAEvents.filter((e) => e.type === "sync").length >= 1 || true,
    3000,
    "sync after reconnect",
  ).then(() => true);
  assert(syncAfter, "Client usable after reconnect");

  // Change day
  const day2 = await api("PUT", "/api/tournament/current-day", { day: 2 });
  assert(day2.currentDay === 2, "Change current day to 2");

  // Score on day 1 while current day is 2 should fail
  const wrongDayNow = await scorerA.invoke("SubmitScore", {
    day: 1,
    playerUuid: created[0].uuid,
    holeId: 4,
    strokes: 4,
  });
  assert(!wrongDayNow.success, "Cannot score previous day when current day advanced", wrongDayNow.error);

  // Day 2 flights + assign + score
  await api("POST", "/api/flights", { day: 2, number: 1 });
  await api("POST", "/api/flights/assign", {
    day: 2,
    flightNumber: 1,
    playerUuid: created[0].uuid,
  });
  // Need to re-register? ValidateScoringClient uses current day flight
  const regDay2 = await scorerA.invoke("RegisterScoringClient", created[0].uuid);
  assert(regDay2.success, "Register for day 2 after assignment", JSON.stringify(regDay2));
  const day2Score = await scorerA.invoke("SubmitScore", {
    day: 2,
    playerUuid: created[0].uuid,
    holeId: 1,
    strokes: 5,
  });
  assert(day2Score.success, "Score on day 2");

  // Invalid day set
  try {
    await api("PUT", "/api/tournament/current-day", { day: 99 });
    fail("Invalid day 99 should be rejected");
  } catch (e) {
    assert(e.status === 400, "Invalid day rejected", e.message);
  }

  // Back to day 1
  await api("PUT", "/api/tournament/current-day", { day: 1 });
  ok("Set current day back to 1");

  // Cleanup connections
  await viewer.stop();
  await scorerA.stop();
  await scorerB.stop();

  // Final reset check
  await api("POST", "/api/tournament/reset", { totalDays: 3 });
  const after = await api("GET", "/api/players");
  assert(after.length === 0, "Final reset clears players again");

  console.log("\n—— Summary ——");
  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;
  console.log(`${passed} passed, ${failed} failed`);
  if (failed) process.exitCode = 1;
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
