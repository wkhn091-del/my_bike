import { expect, test, type Page } from "@playwright/test";

function collectProblems(page: Page): string[] {
  const problems: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") problems.push(message.text());
  });
  page.on("pageerror", (error) => problems.push(error.message));
  return problems;
}

test.describe("home", () => {
  test("hero shows the date, price and CTA, with no console or CSP errors", async ({ page }) => {
    const problems = collectProblems(page);
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { level: 1, name: "די לרכוב לבד באותו מסלול" })).toBeVisible();
    await expect(page.locator("#hero").getByText("8.1")).toBeVisible();
    await expect(page.locator("#hero-cta")).toBeVisible();
    await expect(page.getByText("690 ₪").first()).toBeVisible();
    await page.mouse.wheel(0, 4000);
    await page.waitForTimeout(500);
    expect(problems).toEqual([]);
  });

  test("reduced motion keeps the poster and skips WebGL", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator('[data-hero-scene="poster"]')).toBeVisible();
    await expect(page.locator('[data-hero-scene="poster"] canvas')).toHaveCount(0);
  });

  test("security headers and a nonce-based CSP are sent", async ({ request }) => {
    const response = await request.get("/");
    const headers = response.headers();
    expect(headers["content-security-policy"]).toMatch(/script-src[^;]*'nonce-[A-Za-z0-9+/=]+'/);
    expect(headers["content-security-policy"]).not.toContain("'unsafe-eval'");
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'self'");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["strict-transport-security"]).toContain("max-age=");
    expect(headers["x-powered-by"]).toBeUndefined();
  });

  test("skip link moves focus to the main content", async ({ page, isMobile }) => {
    test.skip(isMobile, "keyboard only");
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "דילוג לתוכן" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#main$/);
  });

  test("JSON-LD describes the event", async ({ page }) => {
    await page.goto("/");
    const json = await page.locator('script[type="application/ld+json"]').first().textContent();
    const data = JSON.parse(json ?? "{}");
    expect(data["@type"]).toBe("SportsEvent");
    expect(data.startDate).toContain("2027-01-08");
  });
});

test.describe("registration without a database", () => {
  test("shows the waitlist instead of a payment form", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("ההרשמה עוד לא נפתחה");
    await expect(page.locator('input[name="expectedTotal"]')).toHaveCount(0);
  });

  test("waitlist shows inline errors and keeps typed values", async ({ page }) => {
    await page.goto("/register");
    const name = page.locator('input[name="fullName"]');
    await name.fill("דנה");
    await page.locator('input[name="phone"]').fill("123");
    await page.getByRole("button", { name: "לרשימת ההמתנה" }).click();
    await expect(page.locator(".field-error").first()).toBeVisible();
    await expect(name).toHaveValue("דנה");
  });
});

test.describe("private links", () => {
  for (const path of ["/thank-you/not-a-token", "/consent/not-a-token", "/feedback/not-a-token"]) {
    test(`${path} is a 404 and not indexable`, async ({ request }) => {
      const response = await request.get(path);
      expect(response.status()).toBe(404);
      expect(response.headers()["x-robots-tag"]).toContain("noindex");
      expect(response.headers()["cache-control"]).toContain("no-store");
    });
  }

  test("Cardcom webhook ignores a request without a valid LowProfileId", async ({ request }) => {
    const response = await request.post("/api/cardcom/webhook", { data: { LowProfileId: "'; drop table orders; --" } });
    expect(response.status()).toBe(200);
    expect((await request.get("/api/cardcom/webhook")).status()).toBe(405);
  });

  test("revalidate webhook rejects an unsigned request", async ({ request }) => {
    const response = await request.post("/api/revalidate", { data: { _type: "event" } });
    expect([401, 404]).toContain(response.status());
  });

  test("feedback cron refuses a call without the cron secret", async ({ request }) => {
    expect([401, 404]).toContain((await request.get("/api/cron/feedback")).status());
    const forged = await request.get("/api/cron/feedback", { headers: { authorization: "Bearer guess" } });
    expect([401, 404]).toContain(forged.status());
  });
});

test.describe("legal and SEO", () => {
  for (const [path, title] of [
    ["/terms", "תנאי השתתפות"],
    ["/privacy", "מדיניות פרטיות"],
    ["/accessibility", "הצהרת נגישות"],
    ["/cookies", "מדיניות עוגיות"],
  ] as const) {
    test(`${path} renders`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    });
  }

  test("terms has the health declaration anchor", async ({ page }) => {
    await page.goto("/terms#health");
    await expect(page.locator("#health")).toBeVisible();
  });

  test("robots blocks indexing outside production", async ({ request }) => {
    const body = await (await request.get("/robots.txt")).text();
    expect(body).toMatch(/Disallow: \/\s/);
  });

  test("calendar file downloads", async ({ request }) => {
    const response = await request.get("/api/ics");
    expect(response.headers()["content-type"]).toContain("text/calendar");
    expect(await response.text()).toContain("DTSTART;VALUE=DATE:20270108");
  });

  test("unknown pages show the friendly 404", async ({ page }) => {
    const response = await page.goto("/no-such-page");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("הדף הזה לא נמצא");
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("content is visible immediately", async ({ page }) => {
    await page.goto("/");
    await page.mouse.wheel(0, 3000);
    const hidden = await page.evaluate(
      () => [...document.querySelectorAll("main h2")].filter((el) => getComputedStyle(el).opacity === "0").length,
    );
    expect(hidden).toBe(0);
  });
});
