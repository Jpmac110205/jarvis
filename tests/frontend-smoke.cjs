const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const http = require("node:http");
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
const document = {
  document_key: "a".repeat(64),
  filename: "notes.md",
  characters: 42,
  full_text_available: true,
  indexed: true,
};
let userMemory = {
  markdown: "# Preferences\n- Concise replies",
  revision: 1,
  auto_update: true,
  updated_at: null,
};
let streamMode = "normal";
let replyText = "Here is the next step for your project.";
let releaseStream;
const receipts = new Map();
const streamServer = http.createServer(async (request, response) => {
  response.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:4185");
  response.setHeader("Access-Control-Allow-Credentials", "true");
  response.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type,X-Session-Token,Accept",
  );
  response.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }
  let body = "";
  for await (const part of request) body += part;
  const data = JSON.parse(body);
  response.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
  });
  const send = (event) =>
    response.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
  if (receipts.has(data.request_id)) {
    send(receipts.get(data.request_id));
    response.end();
    return;
  }
  const reply = replyText;
  const completed = {
    type: "done",
    reply,
    error: null,
    memory_status: "queued",
  };
  send({ type: "ready" });
  send({ type: "delta", text: reply.slice(0, 17) });
  const finish = () => {
    send({ type: "delta", text: reply.slice(17) });
    receipts.set(data.request_id, completed);
    if (streamMode !== "drop-confirmation") send(completed);
    response.end();
  };
  if (streamMode === "hold") releaseStream = finish;
  else finish();
});
(async () => {
  await new Promise((resolve, reject) => {
    streamServer.once("error", reject);
    streamServer.listen(4186, "127.0.0.1", resolve);
  });
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
        "/documents",
        "/memory/user",
      ].includes(path)
    )
      apiRequests.push({
        path,
        method: request.method(),
        headers: request.headers(),
        search: url.search,
        body:
          request.method() === "POST" && path === "/chat"
            ? JSON.parse(request.postData())
            : null,
      });
    if (path === "/auth/status")
      return json({
        authenticated: loggedIn,
        user: loggedIn ? user : undefined,
      });
    if (path === "/config") return json(config);
    if (path === "/health") return json({ status: "ok" });
    if (path === "/conversation") return json({ messages: [] });
    if (path === "/documents") return json({ documents: [document] });
    if (path === `/documents/${document.document_key}`)
      return json({
        ...document,
        content: "# Complete notes\nBeginning, middle and end.",
      });
    if (path === "/memory/user") {
      if (request.method() === "PUT")
        userMemory = {
          ...JSON.parse(request.postData()),
          revision: userMemory.revision + 1,
        };
      return json(userMemory);
    }
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
        : route.continue({ url: "http://127.0.0.1:4186/chat" });
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
    if (path === "/upload") return json({ status: "ingested", ...document });
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
  await page.locator('input[type="file"]').setInputFiles({
    name: "notes.md",
    mimeType: "text/markdown",
    buffer: Buffer.from("# Complete notes\nBeginning, middle and end."),
  });
  await page
    .getByRole("button", { name: "Remove notes.md from question" })
    .waitFor();
  await page.locator(".attachment-name").click();
  await page.getByRole("region", { name: "Preview of notes.md" }).waitFor();
  assert.ok(
    await page
      .getByText("Beginning, middle and end.", { exact: false })
      .isVisible(),
  );
  await page.getByRole("button", { name: "Close preview" }).click();
  await message.fill("Remember my project deadline.");
  failChat = true;
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await page
    .getByRole("alert")
    .filter({ hasText: "Service temporarily unavailable." })
    .waitFor();
  assert.equal(await message.inputValue(), "Remember my project deadline.");
  assert.ok(
    await page
      .getByRole("button", { name: "Remove notes.md from question" })
      .isVisible(),
  );
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
  const attempts = apiRequests.filter((request) => request.path === "/chat");
  assert.deepEqual(attempts[0].body.attachment_keys, [document.document_key]);
  assert.equal(attempts[0].body.request_id, attempts[1].body.request_id);
  await page
    .getByRole("button", { name: "Remove notes.md from question" })
    .click();
  assert.equal(await page.locator(".attachment-card").count(), 0);
  assert.equal(await page.locator(".message-attachments").count(), 1);
  await message.fill("Now without attachments");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await page.waitForFunction(
    () => document.querySelectorAll(".message.bot").length === 2,
  );
  assert.deepEqual(
    apiRequests.filter((request) => request.path === "/chat").at(-1).body
      .attachment_keys,
    [],
  );
  streamMode = "hold";
  await message.fill("Show a progressive reply");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await page
    .locator(".message.bot")
    .last()
    .getByText("Here is the next", { exact: true })
    .waitFor();
  assert.equal(await message.inputValue(), "Show a progressive reply");
  assert.equal(
    await page
      .locator(".message.bot")
      .last()
      .getByRole("button", { name: "Copy", exact: true })
      .isDisabled(),
    true,
  );
  assert.equal(
    await page
      .getByRole("button", { name: "Send message", exact: true })
      .isDisabled(),
    true,
  );
  streamMode = "normal";
  releaseStream();
  await page.waitForFunction(
    () =>
      document.querySelector('textarea[aria-label="Message Prodigy"]').value ===
      "",
  );
  assert.equal(
    await page
      .locator(".message.bot")
      .last()
      .locator(".message-body")
      .textContent(),
    "Here is the next step for your project.",
  );
  streamMode = "drop-confirmation";
  await message.fill("Recover a reply after losing its confirmation");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await page
    .getByRole("alert")
    .filter({ hasText: "interrupted before it was confirmed saved" })
    .waitFor();
  assert.equal(
    await message.inputValue(),
    "Recover a reply after losing its confirmation",
  );
  assert.equal(await page.locator(".message.bot").count(), 3);
  const interruptedId = apiRequests
    .filter((request) => request.path === "/chat")
    .at(-1).body.request_id;
  streamMode = "normal";
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await page.waitForFunction(
    () =>
      document.querySelector('textarea[aria-label="Message Prodigy"]').value ===
      "",
  );
  assert.equal(
    apiRequests.filter((request) => request.path === "/chat").at(-1).body
      .request_id,
    interruptedId,
  );
  assert.equal(await page.locator(".message.bot").count(), 4);
  replyText = [
    "## A readable reply",
    "",
    "This has **bold text** and `inline code`.",
    "",
    "- First item",
    "- Second item",
    "",
    "1. One step",
    "2. Another step",
    "",
    "> A useful quotation",
    "",
    "```python",
    'print("Hello")',
    "```",
    "",
    "| Name | Value |",
    "| --- | --- |",
    "| Memory | Persistent |",
    "",
    "[Documentation](https://example.com/docs)",
    "",
    "[Unsafe link](javascript:alert(1))",
    "",
    "![External image](https://example.com/tracker.png)",
    "",
    "<script>window.markdownInjected = true</script>",
  ].join("\n");
  await message.fill("Show **this user text literally**");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await page.waitForFunction(
    () =>
      document.querySelector('textarea[aria-label="Message Prodigy"]').value ===
      "",
  );
  const markdown = page.locator(".message.bot").last().locator(".message-body");
  assert.equal(
    await markdown.getByRole("heading", { name: "A readable reply" }).count(),
    1,
  );
  assert.equal(await markdown.locator("strong").textContent(), "bold text");
  assert.equal(await markdown.locator("ul > li").count(), 2);
  assert.equal(await markdown.locator("ol > li").count(), 2);
  assert.equal(
    await markdown.locator("blockquote").textContent(),
    "\nA useful quotation\n",
  );
  assert.equal(
    (await markdown.locator("pre code").textContent()).trim(),
    'print("Hello")',
  );
  assert.equal(await markdown.getByRole("table").count(), 1);
  assert.equal(
    await markdown
      .getByRole("link", { name: "Documentation", exact: true })
      .getAttribute("target"),
    "_blank",
  );
  assert.ok(
    !(
      (await markdown
        .getByText("Unsafe link", { exact: true })
        .getAttribute("href")) || ""
    ).startsWith("javascript:"),
  );
  assert.equal(await markdown.locator("script, img").count(), 0);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page
    .locator(".message.bot")
    .last()
    .getByRole("button", { name: "Copy", exact: true })
    .click();
  const copiedReply = await page.evaluate(() => navigator.clipboard.readText());
  assert.ok(copiedReply.includes("A readable reply"));
  assert.ok(copiedReply.includes('print("Hello")'));
  assert.ok(!copiedReply.includes("## A readable reply"));
  assert.ok(!copiedReply.includes("**bold text**"));
  assert.equal(await page.evaluate(() => window.markdownInjected), undefined);
  assert.equal(
    await page
      .locator(".message.user")
      .last()
      .locator(".message-body")
      .textContent(),
    "Show **this user text literally**",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    ),
    false,
  );
  await page.screenshot({
    path: path.join(artifactDir, "markdown-mobile.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 960 });
  await page
    .getByRole("button", { name: "Saved documents", exact: true })
    .click();
  await page.getByRole("button", { name: "Attach", exact: true }).click();
  await page
    .getByRole("button", { name: "Remove notes.md from question" })
    .waitFor();
  await page.reload();
  await page
    .getByRole("button", { name: "Remove notes.md from question" })
    .waitFor();
  await page
    .getByRole("button", { name: "Remove notes.md from question" })
    .click();
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
  await page
    .getByLabel("Edit user.md")
    .fill("# Preferences\n- Use detailed examples");
  await page
    .getByRole("switch", { name: "Update user memory from conversations" })
    .click();
  await page.getByRole("button", { name: "Save memory", exact: true }).click();
  await page.getByText("Your user.md memory has been saved.").waitFor();
  assert.equal(userMemory.markdown, "# Preferences\n- Use detailed examples");
  assert.equal(userMemory.auto_update, false);
  const downloadReady = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download user.md" }).click();
  assert.equal((await downloadReady).suggestedFilename(), "user.md");
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
    "PASS: progressive streaming, provisional replies, lost-confirmation recovery, attachment and draft retention, memory editing, desktop/mobile navigation, account logout, no runtime errors or horizontal overflow.",
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
    streamServer.closeAllConnections();
    streamServer.close();
  });
