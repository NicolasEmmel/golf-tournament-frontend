import { expect, test } from "@playwright/test";

test("home shows navigation entry points", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Welcome" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Leaderboard" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Score entry" })).toBeVisible();
});
