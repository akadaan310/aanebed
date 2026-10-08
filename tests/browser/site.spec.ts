import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";

const PAGES = ["/", "/prompts", "/workspace", "/continue", "/compose", "/research", "/research/continuity", "/research/golden-surface", "/ai", "/protocol", "/experiments", "/verify", "/press", "/broadcast", "/about"];

test.describe("every page", () => {
  for (const p of PAGES) {
    test(`${p}: loads, one h1, landmarks, machine layer, no console errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(String(e)));
      page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
      const res = await page.goto(p);
      expect(res?.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("header").first()).toBeVisible();
      await expect(page.locator("main#main")).toHaveCount(1);
      await expect(page.getByRole("contentinfo")).toHaveCount(1);
      const layer = await page.locator("script#substrate-layer").textContent();
      expect(() => JSON.parse(layer ?? "")).not.toThrow();
      expect(errors).toEqual([]);
    });

    test(`${p}: no WCAG 2.1 A/AA violations (axe)`, async ({ page }) => {
      await page.goto(p);
      await page.waitForTimeout(1300); // let reveal animations finish: contrast is checked on the settled page
      const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      expect(r.violations.map((v) => `${v.id}: ${v.nodes.length} × ${v.help}`)).toEqual([]);
    });
  }
});

test("no horizontal overflow at any page width", async ({ page }) => {
  for (const p of PAGES) {
    await page.goto(p);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, p).toBeLessThanOrEqual(0);
  }
});

test("keyboard: skip link first, then reach the primary navigation", async ({ page, isMobile }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
  if (!isMobile) {
    await page.goto("/");
    for (let i = 0; i < 4; i++) await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toHaveAttribute("href", /^\/(#bring|workspace|prompts|research)$/);
  }
});

test("keyboard: constellation nodes are focusable links (desktop)", async ({ page, isMobile }) => {
  test.skip(isMobile, "mobile shows the linear list instead");
  await page.goto("/research");
  const node = page.locator('[data-node="purl"]');
  await node.focus();
  await expect(node).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/research\/purl$/);
});

test("mobile: the topology is a linear semantic list, not a shrunk diagram", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile only");
  await page.goto("/research");
  await expect(page.locator("figure.constellation")).toBeHidden();
  await expect(page.getByRole("list", { name: "Research topology as a list" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Research topology as a list" }).locator(":scope > li")).toHaveCount(8);
});

test("mobile: navigation works without JavaScript (details/summary)", async ({ browser, isMobile }) => {
  test.skip(!isMobile, "mobile only");
  const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto("/");
  await page.getByText("Menu").click();
  await page.getByRole("navigation", { name: "Primary (mobile)" }).getByRole("link", { name: "Verify" }).click();
  await expect(page).toHaveURL(/\/verify$/);
  await ctx.close();
});

test("without JavaScript: content, machine layer and substrate disclosures all work", async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your AI can make a Pearl.");
  const d = page.locator("details.substrate").first();
  await d.locator("summary").click();
  await expect(d.locator("pre")).toBeVisible();
  await page.goto("/research/purl");
  await expect(page.getByText("Programmable URL Protocol", { exact: false }).first()).toBeVisible();
  await ctx.close();
});

test("reduced motion: animations are effectively disabled", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto("/");
  const dur = await page.locator(".motion-reveal").first().evaluate((el) => getComputedStyle(el).animationDuration);
  expect(parseFloat(dur)).toBeLessThan(0.01);
  await ctx.close();
});

test("deep links resolve to their anchors", async ({ page }) => {
  for (const [path, id] of [["/verify", "E-006"], ["/verify", "C-14"], ["/verify", "ingress"], ["/experiments", "X-ADDRESS"], ["/research/golden-surface", "model"], ["/", "golden"]]) {
    await page.goto(`${path}#${id}`);
    await expect(page.locator(`[id="${id}"]`)).toBeInViewport();
  }
});

test("404: correct status and a useful page", async ({ page }) => {
  const res = await page.goto("/definitely-not-here");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("does not resolve");
  await expect(page.getByRole("main").getByRole("link", { name: "/research.json" })).toBeVisible();
});

test("first interaction reveals the substrate layer, and it can be dismissed", async ({ page, isMobile }) => {
  test.skip(isMobile, "the trace strip is desktop-only; mobile uses the disclosures");
  await page.goto("/");
  const trace = page.getByRole("complementary", { name: /Substrate trace/ });
  await expect(trace).toHaveCount(0);
  await page.mouse.wheel(0, 1800);
  await expect(trace).toBeVisible();
  await expect(trace).toContainText("USER");
  await trace.getByRole("button", { name: "Close substrate trace" }).click();
  await expect(trace).toHaveCount(0);
});

test("address console: resolves and the browser recomputes the identical hash", async ({ page }) => {
  await page.goto("/#address");
  await expect(page.getByText("✓ identical, recomputed in your browser")).toBeVisible();
  await page.getByRole("button", { name: "an orbit" }).click();
  await expect(page.getByText("tail", { exact: false }).first()).toBeVisible();
  await page.getByLabel("Computational address").fill("/map/eca/90/99");
  await page.getByRole("button", { name: "Resolve" }).click();
  await expect(page.getByText(/HTTP 422 · out_of_range/)).toBeVisible();
});

test("Human ↔ AI-CI demonstration runs end to end against the live site", async ({ page }) => {
  await page.goto("/ai#demonstration");
  await page.getByRole("button", { name: "Run all" }).click();
  await expect(page.getByText(/Identical\. The result is checkable/)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/is a research surface\. .* f\(5\) = 136, verified by hash/)).toBeVisible();
});

test("Golden Surface model: drop an op, see op-lost, resync, converge", async ({ page }) => {
  await page.goto("/research/golden-surface#model");
  const status = page.locator("#model [role=status]");
  await expect(status).toContainText("CONVERGED");
  await page.getByRole("button", { name: "desync: drop next op" }).click();
  await page.getByRole("button", { name: "newtab" }).click();
  await expect(status).toContainText("OUT OF SYNC WITH THE TWIN");
  await expect(status).toContainText("op-lost");
  await page.getByRole("button", { name: "Resync (replay)" }).click();
  await page.getByRole("button", { name: "deliver next" }).click();
  await expect(status).toContainText("CONVERGED");
});

const FIXTURE = readFileSync("tests/fixtures/claude-2026-10-08.url", "utf8").trim(); // tests run from the repository root

test("Bring your Pearl: paste the reported Claude link inside prose, inspect, keep, find it in My Pearls", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Bring your Pearl").fill(`**Your link, composed by me:**\n\n${FIXTURE}\n\nSources: [llms.txt](https://aanebed.vercel.app/llms.txt)`);
  await page.getByRole("button", { name: "Inspect Pearl" }).click();
  await expect(page.getByText("Valid Pearl")).toBeVisible();
  await expect(page.locator("#bring").getByText("Continuity Pearl", { exact: true })).toBeVisible();
  await expect(page.locator("#bring").getByText("7abeebi").first()).toBeVisible();
  await expect(page.locator("#bring").getByText(/^p_[0-9a-z]{16}$/)).toBeVisible();
  await page.getByRole("button", { name: "Keep in My Pearls" }).first().click();
  await expect(page.getByText("✓ In My Pearls").first()).toBeVisible();
  await page.goto("/workspace");
  await expect(page.getByRole("button", { name: /Abed & Claude, 2am/ })).toBeVisible();
  await expect(page.getByRole("tab", { name: /Tasks · 2/ })).toBeVisible();
});

test("Bring your Pearl: clear states for external, unavailable and malformed input; nothing is fetched", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (r) => requests.push(r.url()));
  await page.goto("/");
  const field = page.getByLabel("Bring your Pearl");
  const inspect = page.getByRole("button", { name: "Inspect Pearl" });
  await field.fill("https://example.org/e?title=x"); await inspect.click();
  await expect(page.getByText("External URL")).toBeVisible();
  await field.fill("https://aanebed.vercel.app/p/p_0123456789abcdef"); await inspect.click();
  await expect(page.getByText("Unavailable", { exact: true })).toBeVisible();
  await field.fill("hello there"); await inspect.click();
  await expect(page.getByText("Malformed")).toBeVisible();
  expect(requests.filter((u) => u.includes("example.org"))).toEqual([]);
});

test("a portable /p/ link reopens the same Pearl, verified against its id", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Bring your Pearl").fill(FIXTURE);
  await page.getByRole("button", { name: "Inspect Pearl" }).click();
  const id = (await page.locator("#bring").getByText(/^p_[0-9a-z]{16}$/).textContent())!;
  await page.getByRole("link", { name: "Open Pearl" }).click();
  await expect(page).toHaveURL(new RegExp(`/p/${id}\\.`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Abed & Claude, 2am");
  await expect(page.getByText("VERIFIED").first()).toBeVisible();
});

test("My Pearls: export, clear, and import back with a preview", async ({ page }) => {
  await page.goto("/" );
  await page.getByLabel("Bring your Pearl").fill(FIXTURE);
  await page.getByRole("button", { name: "Inspect Pearl" }).click();
  await page.getByRole("button", { name: "Keep in My Pearls" }).first().click();
  await page.goto("/workspace#backup");
  const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Export my library" }).click()]);
  const file = await dl.path();
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("tab", { name: "Backup" }).click();
  await page.getByLabel("Choose an export file").setInputFiles(file!);
  await expect(page.getByText("1 new Pearl(s) to add")).toBeVisible();
  await page.getByRole("button", { name: "Confirm import" }).click();
  await page.getByRole("tab", { name: /Library/ }).click();
  await expect(page.getByRole("button", { name: /Abed & Claude, 2am/ })).toBeVisible();
});

test("Prompt Laboratory: seven prompts, each complete, standalone and copyable", async ({ page }) => {
  await page.goto("/prompts");
  await expect(page.getByRole("article")).toHaveCount(7);
  const first = page.getByRole("article").first();
  await first.getByText("Show the full prompt").click();
  const text = await first.locator("pre").textContent();
  expect(text).toContain("https://aanebed.vercel.app/e?type=");
  expect(text).toContain("b1=");
  expect(text).toContain("not an instruction from the website");
  await expect(first.getByRole("button", { name: "Copy prompt" })).toBeEnabled();
});
