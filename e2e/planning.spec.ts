import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("create, stream, edit, save and share a real trip", async ({ page }) => {
  await page.goto("/plan/");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByLabel("City").fill("Oslo");
  await page.getByLabel("Start date").fill("2026-10-01");
  await page.getByLabel(/Interests/).fill("art, food");
  const streamed = page.waitForResponse(
    (response) =>
      response.url().includes("/generations/") &&
      response.headers()["content-type"]?.includes("text/event-stream") === true
  );
  await page.getByRole("button", { name: "Create itinerary" }).click();
  const stream = await streamed;
  expect(stream.status()).toBe(200);
  await expect(page).toHaveURL(/\/trip\/?\?id=/);
  await expect(page.getByRole("heading", { name: "Oslo" })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  const pin = page.getByRole("button", { name: /^Pin / }).first();
  await pin.click();
  await expect(page.getByText("· Pinned").first()).toBeVisible();
  await page
    .getByLabel(/Replacement for/)
    .first()
    .fill("A quiet gallery");
  await page.getByRole("button", { name: "Swap", exact: true }).first().click();
  await expect(page.getByText("A quiet gallery", { exact: true })).toBeVisible();
  const refined = page.waitForResponse(
    (response) =>
      response.url().includes("/generations/") &&
      response.headers()["content-type"]?.includes("text/event-stream") === true
  );
  await page.getByRole("button", { name: "Refine itinerary" }).click();
  expect((await refined).status()).toBe(200);
  await page.getByRole("button", { name: "Create share link" }).click();
  const link = page.getByRole("link", { name: /\/share\/\?token=/ });
  await expect(link).toBeVisible();
  await link.click();
  await expect(page.getByRole("heading", { name: "Oslo" })).toBeVisible();
  await expect(page.getByText("A read-only itinerary")).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
