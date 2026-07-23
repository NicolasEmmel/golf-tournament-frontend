/**
 * Capture guide screenshots 07 (scoring hole) and 08 (leaderboard).
 * Prerequisites: node scripts/seed-guide.mjs
 * Run: npx playwright install chromium && node scripts/capture-guide-screens.mjs
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.APP_BASE ?? "https://www.livescoringkitzingen.de";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "docs", "guide", "images");

async function waitLive(page) {
  await page.waitForFunction(
    () => {
      const t = document.body?.innerText ?? "";
      return t.includes("Live") || t.includes("Verbinden");
    },
    { timeout: 60_000 },
  );
  // Prefer Live if it appears
  try {
    await page.getByText("Live", { exact: true }).waitFor({ timeout: 45_000 });
  } catch {
    // continue anyway
  }
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });

  // --- 07 scoring hole ---
  await page.goto(`${BASE}/scoring/`, { waitUntil: "networkidle" });
  await waitLive(page);
  await page.getByPlaceholder(/name|suchen|spieler/i).waitFor({ timeout: 30_000 }).catch(() => null);

  const search = page.locator("input").first();
  await search.click();
  await search.fill("Tom");
  await page.waitForTimeout(800);

  // Click player row / button containing Tom Weber
  const tom = page.getByText("Tom Weber", { exact: false }).first();
  await tom.waitFor({ timeout: 15_000 });
  await tom.click();

  // Wait for hole scoring UI
  await page.getByText(/Loch|Hole/i).first().waitFor({ timeout: 30_000 });
  await page.waitForTimeout(1200);
  await page.screenshot({
    path: path.join(OUT, "07-scoring-hole.png"),
    fullPage: false,
  });
  console.log("Wrote 07-scoring-hole.png");

  // --- 08 leaderboard ---
  await page.setViewportSize({ width: 900, height: 700 });
  await page.goto(`${BASE}/leaderboard/`, { waitUntil: "networkidle" });
  await waitLive(page);
  // Wait for either table headers or category tabs / empty state
  await page.waitForTimeout(5000);
  const body = await page.locator("body").innerText();
  console.log("Leaderboard text preview:\n", body.slice(0, 800));
  await page.screenshot({
    path: path.join(OUT, "08-leaderboard.png"),
    fullPage: false,
  });
  console.log("Wrote 08-leaderboard.png");

  await browser.close();
  console.log("Done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
