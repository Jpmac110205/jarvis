const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const root = path.resolve(__dirname, "..");
const artifactDir = path.join(root, "artifacts", "ui");
fs.mkdirSync(artifactDir, { recursive: true });
let browser;
const server = spawn(
  process.execPath,
  [
    path.join(root, "node_modules/vite/bin/vite.js"),
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    "4185",
    "--strictPort",
  ],
  { cwd: root, stdio: "ignore" },
);
const user = {
  id: 1,
  display_name: "Alex Morgan",
  email: "alex@example.test",
  title: "Product designer",
  location: "New York",
  system_prompt: "Keep replies concise.",
  selected_model: "gpt-4.1-mini",
  chats_number: 7,
  pdfs_number: 3,
  created_at: "2026-01-01T00:00:00Z",
};
const config = {
  default_model: "gpt-4.1-mini",
  models: ["gpt-4.1-mini"],
  max_upload_bytes: 20971520,
  memory: { context_messages: 10, summary_messages: 20, stale_days: 30 },
  capabilities: {
    web_search: false,
    task_writes: false,
    voice: false,
    notifications: false,
  },
};
let failChat = false,
  loggedIn = true;
const apiRequests = [];
const consoleErrors = [];
(async () => {
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      const response = await fetch("http://127.0.0.1:4185/app");
      if (response.ok) break;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_EXECUTABLE || undefined,
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
  });
  await context.addInitScript(() =>
    localStorage.setItem("prodigy_session", "fixture-session"),
  );
  const page = await context.newPage();
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const headers = {
      "Access-Control-Allow-Origin": "http://127.0.0.1:4185",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Headers": "Content-Type,X-Session-Token",
      "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
    };
    const json = (data, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        headers,
        body: JSON.stringify(data),
      });
    if (request.method() === "OPTIONS")
      return route.fulfill({ status: 204, headers });
    if (
      [
        "/auth/status",
        "/config",
        "/health",
        "/conversation",
        "/events",
        "/tasks",
        "/chat",
        "/users/1",
        "/auth/logout",
        "/export/conversation",
        "/upload",
      ].includes(path)
    )
      apiRequests.push({
        path,
        method: request.method(),
        headers: request.headers(),
        search: url.search,
      });
    if (path === "/auth/status")
      return json({
        authenticated: loggedIn,
        user: loggedIn ? user : undefined,
      });
    if (path === "/config") return json(config);
    if (path === "/health") return json({ status: "ok" });
    if (path === "/conversation") return json({ messages: [] });
    if (path === "/events") {
      const date = (
        url.searchParams.get("time_min") || new Date().toISOString()
      ).slice(0, 10);
      return json({
        items: [
          {
            id: "event-1",
            summary: "Project review",
            start: { date },
            end: {
              date: new Date(new Date(date + "T00:00:00Z").getTime() + 86400000)
                .toISOString()
                .slice(0, 10),
            },
            location: "Studio",
          },
        ],
      });
    }
    if (path === "/tasks")
      return json({
        items: [
          {
            id: "t1",
            listId: "l1",
            title: "Review project notes",
            listTitle: "Work",
            status: "needsAction",
            due: "2026-10-08T00:00:00Z",
          },
          {
            id: "t2",
            listId: "l1",
            title: "Send the brief",
            listTitle: "Work",
            status: "completed",
          },
        ],
      });
    if (path === "/chat")
      return failChat
        ? json({ detail: "Service temporarily unavailable." }, 503)
        : json({
            reply: "Here is the next step for your project.",
            error: null,
          });
    if (path === "/users/1" && request.method() === "PUT") {
      Object.assign(user, JSON.parse(request.postData()));
      return json(user);
    }
    if (path === "/auth/logout") {
      loggedIn = false;
      return json({ status: "logged out" });
    }
    if (path === "/export/conversation")
      return json({ data: { conversation_history: [] } });
    if (path === "/upload")
      return json({ status: "ingested", filename: "notes.txt" });
    if (path === "/landing-preview")
      return route.fulfill({
        contentType: "text/html",
        body: fs.readFileSync(root + "/backend/static/index.html", "utf8"),
      });
    if (path === "/privacy-preview")
      return route.fulfill({
        contentType: "text/html",
        body: fs.readFileSync(root + "/backend/static/privacy.html", "utf8"),
      });
    if (url.hostname !== "127.0.0.1") return route.abort();
    return route.continue();
  });
  await page.goto("http://127.0.0.1:4185/app");
  await page.getByRole("heading", { name: "Good to see you, Alex." }).waitFor();
  await page.screenshot({
    path: path.join(artifactDir, "desktop-light.png"),
    fullPage: true,
  });
  const message = page.getByRole("textbox", { name: "Message Prodigy" });
  await message.fill("Remember my project deadline.");
  failChat = true;
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await page
    .getByRole("alert")
    .filter({ hasText: "Service temporarily unavailable." })
    .waitFor();
  assert.equal(await message.inputValue(), "Remember my project deadline.");
  assert.ok(
    (await page.evaluate(() => Object.keys(localStorage))).some(
      (key) => key === "prodigy_draft_1",
    ),
  );
  failChat = false;
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await page.getByText("Here is the next step for your project.").waitFor();
  assert.equal(await message.inputValue(), "");
  const chatCall = apiRequests.find((request) => request.path === "/chat");
  assert.equal(chatCall.headers["x-session-token"], "fixture-session");
  await page.getByRole("button", { name: "Tasks", exact: true }).click();
  await page
    .getByRole("heading", { name: "Review project notes", exact: true })
    .waitFor();
  await page.getByRole("button", { name: "Completed", exact: true }).click();
  await page.getByRole("heading", { name: "Send the brief" }).waitFor();
  await page.getByRole("button", { name: "Calendar", exact: true }).click();
  await page.getByRole("button", { name: "Next month" }).click();
  await page.getByText("Project review", { exact: true }).first().waitFor();
  assert.ok(
    apiRequests
      .filter((request) => request.path === "/events")
      .some((request) => request.search.includes("time_max=")),
  );
  await page.getByRole("button", { name: "Profile", exact: true }).click();
  await page.getByLabel("Role or title").fill("Staff designer");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page.getByText("Your profile has been saved.").waitFor();
  assert.equal(user.title, "Staff designer");
  assert.equal(
    await page.getByRole("button", { name: /GPT-5 mini/ }).isDisabled(),
    true,
  );
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await page
    .getByRole("switch", { name: "Compact interface", exact: true })
    .click();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
  assert.equal(await page.locator("html").getAttribute("data-compact"), "true");
  await page.reload();
  await page.getByRole("heading", { name: "Good to see you, Alex." }).waitFor();
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
  await page.screenshot({
    path: path.join(artifactDir, "desktop-dark.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Privacy policy", exact: true })
    .click();
  await page.getByRole("heading", { name: "Children's privacy" }).waitFor();
  assert.equal(await page.locator(".privacy-policy section").count(), 12);
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "Open navigation", exact: true })
    .click();
  await page.getByRole("button", { name: "Assistant", exact: true }).click();
  assert.ok(await message.isVisible());
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    ),
    false,
  );
  await page.screenshot({
    path: path.join(artifactDir, "mobile.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Toggle daily overview" }).click();
  await page.getByRole("heading", { name: "Your day" }).waitFor();
  await page.getByRole("button", { name: "Close overview" }).click();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page
    .getByRole("heading", { name: "Make room for what matters." })
    .waitFor();
  assert.equal(await message.isDisabled(), true);
  assert.equal(
    await page.evaluate(() => localStorage.getItem("prodigy_session")),
    null,
  );
  await page.goto("http://127.0.0.1:4185/landing-preview");
  assert.equal(await page.locator(".feature-card").count(), 6);
  assert.equal(await page.locator(".step").count(), 4);
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    ),
    false,
  );
  await page.screenshot({
    path: path.join(artifactDir, "landing-mobile.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: path.join(artifactDir, "landing-desktop.png"),
    fullPage: true,
  });
  await page.goto("http://127.0.0.1:4185/privacy-preview");
  assert.equal(await page.locator(".section.reveal").count(), 12);
  assert.equal(await page.locator("#limited-use").count(), 1);
  assert.equal(
    await page
      .locator(".reveal")
      .first()
      .evaluate((element) => getComputedStyle(element).opacity),
    "1",
  );
  assert.deepEqual(consoleErrors, []);
  console.log(
    "PASS: desktop/mobile navigation, chat retry and draft retention, task status, calendar ranges, profile save, persistent theme/compact preferences, account logout, 6 landing capabilities, 4 workflow steps, all original privacy sections plus Google data disclosure, no runtime errors or horizontal overflow.",
  );
  await browser.close();
})()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (browser) await browser.close();
    server.kill();
  });
