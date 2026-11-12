// Captures the product screenshots used on the site from the browser build of Yorna.
// Start the app first (`npm run web` in the repo root), then run `npm run capture:product`.
// Env: YORNA_URL (default http://127.0.0.1:43127), CHROME_PATH (default google-chrome on PATH).
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const APP_URL = process.env.YORNA_URL ?? "http://127.0.0.1:43127";
const CHROME = process.env.CHROME_PATH ?? "/usr/local/bin/google-chrome";
const OUT = fileURLToPath(new URL("../public/product/", import.meta.url));

const pad = (n) => String(n).padStart(2, "0");
const now = new Date();
const day = (d) => `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(d)}`;
const iso = (daysAgo, hour = 10) => {
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

const NOTES = [
  {
    id: "idea-dump",
    title: "Idea dump — " + now.toLocaleString("en", { month: "long" }),
    status: "todo",
    excerpt: "Why airports all look the same · The hidden math of subway maps · What happens to returned online orders",
    wordCount: 24,
    age: 0.4,
    html: "<p>Why airports all look the same · The hidden math of subway maps · What happens to returned online orders</p>",
  },
  {
    id: "short-bridges",
    title: "Short: Why bridges sing",
    status: "todo",
    excerpt: "Vertical cut from Ep 12: the 20-second “why bridges sing” moment.",
    wordCount: 14,
    age: 4,
    html: "<p>Vertical cut from Ep 12: the 20-second “why bridges sing” moment.</p>",
  },
  {
    id: "q4-plan",
    title: "Q4 channel plan",
    status: "todo",
    excerpt: "Q4 plan: 2 long-form per month, 1 short per week.",
    wordCount: 11,
    age: 26,
    html: "<p>Q4 plan: 2 long-form per month, 1 short per week.</p>",
  },
  {
    id: "ep14",
    title: "Ep 14 — Why cities feel lonely",
    status: "in_progress",
    excerpt:
      "Hook Ever felt alone in a city of ten million? You're not the only one — and the reason is baked into how we build streets.",
    wordCount: 642,
    age: 0.01,
    html: `<h2>Hook</h2><p>Ever felt alone in a city of ten million? <strong>You're not the only one</strong> — and the reason is baked into how we build streets.</p><h2>Beats</h2><ol><li><p>The loneliness paradox: density ≠ connection</p></li><li><p>Third places are disappearing (cafés, libraries, plazas)</p></li><li><p>Case study: Superblocks in Barcelona</p></li></ol><h3>B-roll</h3><ul data-type="taskList"><li data-type="taskItem" data-checked="true"><p>Rush-hour crowd timelapse</p></li><li data-type="taskItem" data-checked="false"><p>Empty playground at dusk</p></li><li data-type="taskItem" data-checked="false"><p>Barcelona street from above</p></li></ul><blockquote><p>Keep the cold open under 20 seconds — cut straight to the first statistic.</p></blockquote><h2>Call to action</h2><p>Ask viewers where <mark>their</mark> third place is. Pin the best answer.</p>`,
  },
  {
    id: "sponsor",
    title: "Sponsor read — Nomad desk lamp",
    status: "in_progress",
    excerpt: "Sponsor read 60–90s, mid-roll after beat 2. Keep it honest: I used it for three weeks.",
    wordCount: 118,
    age: 1,
    html: "<p>Sponsor read 60–90s, mid-roll after beat 2. Keep it honest: I used it for three weeks.</p>",
  },
  {
    id: "ep13",
    title: "Ep 13 — The $4 desk tool",
    status: "done",
    excerpt: "Hook This $4 tool replaced my entire desk setup. Final pass done — record Friday.",
    wordCount: 1210,
    age: 1,
    html: "<h2>Hook</h2><p>This $4 tool replaced my entire desk setup. Final pass done — record Friday.</p>",
  },
  {
    id: "ep12",
    title: "Ep 12 — Bridges that sing",
    status: "done",
    excerpt: "Hook Some bridges hum in the wind. Here's why engineers hate it.",
    wordCount: 1384,
    age: 13,
    html: "<h2>Hook</h2><p>Some bridges hum in the wind. Here's why engineers hate it.</p>",
  },
];

const today = now.getDate();
const workedDays = [3, 4, 5, 7, 10, 11, today].filter((d) => d <= today);

function vaultIndex() {
  const order = { todo: 0, in_progress: 0, done: 0 };
  return {
    schema: 1,
    createdAt: iso(40),
    notes: NOTES.map((n) => ({
      id: n.id,
      title: n.title,
      status: n.status,
      order: order[n.status]++,
      createdAt: iso(Math.ceil(n.age) + 5),
      updatedAt: new Date(now.getTime() - n.age * 86400000).toISOString(),
      excerpt: n.excerpt,
      wordCount: n.wordCount,
    })),
    reminders: [
      { id: "r1", date: day(today), time: "10:00", title: "Film B-roll for ep 14", color: "amber" },
      { id: "r2", date: day(today), title: "Reply to sponsor email", color: "coral" },
      {
        id: "r3",
        date: day(Math.max(1, today - 7)),
        time: "18:00",
        title: "Weekly upload",
        color: "sky",
        repeat: "weekly",
      },
      { id: "r4", date: day(Math.min(28, today + 2)), title: "Sponsor draft due", color: "coral" },
      { id: "r5", date: day(Math.min(28, today + 6)), title: "Thumbnail A/B test", color: "rose" },
      { id: "r6", date: day(Math.min(28, today + 8)), time: "09:30", title: "Record ep 14", color: "mint" },
      { id: "r7", date: day(Math.min(28, today + 13)), title: "Plan December scripts", color: "amber" },
    ].map((r) => ({ done: false, createdAt: iso(10), ...r })),
    sessions: workedDays
      .filter((d) => d !== today)
      .map((d) => ({
        id: `s${d}`,
        noteId: "ep14",
        date: day(d),
        plannedMinutes: 30,
        startedAt: `${day(d)}T09:00:00.000Z`,
        finishedAt: `${day(d)}T09:30:00.000Z`,
      })),
    settings: { defaultSessionMinutes: 30, soundVolume: 0.8 },
  };
}

async function writeVault(page, files) {
  await page.evaluate(async (entries) => {
    const db = await new Promise((resolve, reject) => {
      const req = indexedDB.open("yorna-vault");
      req.onupgradeneeded = () => req.result.createObjectStore("files");
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    await new Promise((resolve, reject) => {
      const tx = db.transaction("files", "readwrite");
      const store = tx.objectStore("files");
      store.clear();
      for (const [k, v] of entries) store.put(v, k);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }, Object.entries(files));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function clickText(page, text, selector = "button") {
  const handles = await page.$$(selector);
  for (const h of handles) {
    const t = await h.evaluate((el) => el.textContent?.trim() ?? "");
    if (t === text || t.endsWith(text)) {
      await h.click();
      return h;
    }
  }
  throw new Error(`No ${selector} with text "${text}"`);
}

async function shot(page, name) {
  await sleep(500);
  await page.screenshot({ path: `${OUT}${name}.webp`, type: "webp", quality: 88 });
  console.log("saved", name);
}

/** Screenshot just the element matched in the page, plus padding. */
async function shotAround(page, name, findBox, padding = 40) {
  await sleep(500);
  const box = await page.evaluate(findBox);
  if (!box) throw new Error(`Nothing to crop for ${name}`);
  await page.screenshot({
    path: `${OUT}${name}.webp`,
    type: "webp",
    quality: 88,
    clip: {
      x: Math.max(0, box.x - padding),
      y: Math.max(0, box.y - padding),
      width: box.width + padding * 2,
      height: box.height + padding * 2,
    },
  });
  console.log("saved", name);
}

const baseFiles = () => {
  const files = { "yorna.json": JSON.stringify(vaultIndex(), null, 2) };
  for (const n of NOTES) files[`notes/${n.id}.html`] = n.html;
  return files;
};

await mkdir(OUT, { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 880, deviceScaleFactor: 2 });

await page.goto(APP_URL);
await writeVault(page, baseFiles());
await page.reload({ waitUntil: "networkidle0" });
await sleep(800);
await shot(page, "calendar");

const cell = await page.evaluateHandle(
  (d) => {
    const els = [...document.querySelectorAll("main *")].filter(
      (el) => el.children.length === 0 && el.textContent?.trim() === String(d),
    );
    return els.at(-1)?.closest("button, [role=button], div");
  },
  Math.min(28, today + 6),
);
await cell.asElement()?.hover();
await shot(page, "calendar-hover");

await clickText(page, "Notes");
await page.mouse.move(0, 0);
await shot(page, "board");

await clickText(page, "Ep 14 — Why cities feel lonely", "h3, p, div, span, button");
await sleep(600);
await shotAround(
  page,
  "session-dialog",
  () => {
    const r = document.querySelector("[role=dialog]")?.getBoundingClientRect();
    return r && { x: r.x, y: r.y, width: r.width, height: r.height };
  },
  0,
);

await clickText(page, "Start session", "[role=dialog] button");
await page.evaluate(() => {
  // Fast-forward the running session so the star ring shows real progress.
  const realNow = Date.now.bind(Date);
  Date.now = () => realNow() + 17 * 60_000 + 12_000;
});
await sleep(1500);
await page.mouse.move(0, 0);
await shot(page, "editor");

const profiles = {
  schema: 1,
  profiles: [
    { id: "p-main", name: "Yehor", dir: "", color: "amber", createdAt: iso(40) },
    { id: "p-ana", name: "Ana", dir: "profiles/ana-p-ana", color: "mint", createdAt: iso(20) },
    { id: "p-shorts", name: "Shorts", dir: "profiles/shorts-p-shorts", color: "sky", createdAt: iso(5) },
  ],
};
const empty = JSON.stringify({ ...vaultIndex(), notes: [], reminders: [], sessions: [] });
await writeVault(page, {
  ...baseFiles(),
  "profiles.json": JSON.stringify(profiles),
  "profiles/ana-p-ana/yorna.json": empty,
  "profiles/shorts-p-shorts/yorna.json": empty,
});
await page.reload({ waitUntil: "networkidle0" });
await shotAround(
  page,
  "profiles",
  () => {
    let el = [...document.querySelectorAll("h1")].find((h) => h.textContent?.includes("Who's writing"));
    while (el && !el.querySelector("input")) el = el.parentElement;
    const r = el?.getBoundingClientRect();
    return r && { x: r.x, y: r.y, width: r.width, height: r.height };
  },
  64,
);

await browser.close();
