import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.APP_BASE ?? "https://www.livescoringkitzingen.de";
const OUT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "docs",
  "guide",
  "images",
  "08-leaderboard.png",
);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 900, height: 700 },
  deviceScaleFactor: 2,
});

async function tryLoad() {
  await page.goto(`${BASE}/leaderboard/`, { waitUntil: "networkidle" });
  for (let i = 0; i < 30; i++) {
    const text = await page.locator("body").innerText();
    if (
      text.includes("Heute") ||
      text.includes("Gesamt") ||
      text.includes("Brutto") ||
      text.includes("Thru") ||
      text.includes("Tom Weber") ||
      text.includes("Noch keine Spieler")
    ) {
      return text;
    }
    if (text.includes("Live")) {
      // connected but maybe empty — wait a bit more for sync
      await page.waitForTimeout(1000);
      const again = await page.locator("body").innerText();
      if (
        again.includes("Tom") ||
        again.includes("Heute") ||
        again.includes("Thru") ||
        again.includes("Noch keine")
      ) {
        return again;
      }
    }
    await page.waitForTimeout(1000);
  }
  return page.locator("body").innerText();
}

let text = await tryLoad();
if (!text.includes("Tom") && !text.includes("Thru") && !text.includes("Heute")) {
  console.log("Retry reload…");
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(8000);
  text = await page.locator("body").innerText();
}

console.log(text.slice(0, 1500));
await page.screenshot({ path: OUT, fullPage: false });
console.log("Wrote", OUT);
await browser.close();
