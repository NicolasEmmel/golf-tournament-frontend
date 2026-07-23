import { expect, test } from "@playwright/test";

test("home shows navigation entry points", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Golf Live Scoring" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /Start scoring/i })).toBeVisible();
  await expect(
    page.getByRole("link", { name: /View leaderboard/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Administration/i }),
  ).toBeVisible();
});
