/**
 * Capture at 1440×810 (same 16:9), then assemble upscales uniformly to 1920×1080.
 * That enlarges the platform ~33% without stretching and keeps cursor tip = click.
 * No CSS zoom (zoom breaks click/cursor alignment).
 */
import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = __dirname;
const BASE = process.env.DEMO_URL || "http://localhost:3001";
const VIDEO_DIR = path.join(OUT_DIR, "recording");
/** Capture size — must match recordVideo; assemble scales to 1920×1080 */
const W = 1440;
const H = 810;

fs.mkdirSync(VIDEO_DIR, { recursive: true });
for (const f of fs.readdirSync(VIDEO_DIR)) {
  fs.unlinkSync(path.join(VIDEO_DIR, f));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Arrow tip in the 64-viewBox SVG drawn at 56×56 → scale 56/64. */
const HOT_X = (8 * 56) / 64;
const HOT_Y = (6 * 56) / 64;

const CURSOR_INIT = `
(() => {
  const HOT_X = ${HOT_X};
  const HOT_Y = ${HOT_Y};
  window.__demoCursorPos = window.__demoCursorPos || { x: ${W / 2}, y: ${H / 2}, down: false };

  function ensure() {
    // Never zoom — keeps every scene the same native size and click coords honest.
    document.documentElement.style.zoom = "";
    if (!document.getElementById("__demo_cursor_style")) {
      const style = document.createElement("style");
      style.id = "__demo_cursor_style";
      style.textContent = \`
        *, *::before, *::after { cursor: none !important; }
        #__demo_cursor {
          position: fixed !important;
          width: 56px !important; height: 56px !important;
          margin: 0 !important; padding: 0 !important;
          pointer-events: none !important;
          z-index: 2147483647 !important;
          transform: none !important;
          filter: drop-shadow(0 4px 10px rgba(0,0,0,0.55));
          left: 0; top: 0;
        }
        #__demo_cursor.__down { filter: drop-shadow(0 2px 6px rgba(0,0,0,0.55)); opacity: 0.92; }
        #__demo_cursor svg { display: block; width: 56px; height: 56px; overflow: visible; }
      \`;
      (document.head || document.documentElement).appendChild(style);
    }
    let c = document.getElementById("__demo_cursor");
    if (!c) {
      c = document.createElement("div");
      c.id = "__demo_cursor";
      c.setAttribute("aria-hidden", "true");
      c.innerHTML = \`<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#F58025" fill-opacity="0.4" stroke="#fff" stroke-width="2"/>
        <path d="M8 6 L8 42 L18 32 L26 48 L33 45 L24 28 L40 28 Z"
          fill="#F58025" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/>
      </svg>\`;
      (document.body || document.documentElement).appendChild(c);
    }
    const pos = window.__demoCursorPos;
    // left/top place the TIP at (x,y) — not the box origin
    c.style.left = (pos.x - HOT_X) + "px";
    c.style.top = (pos.y - HOT_Y) + "px";
    c.classList.toggle("__down", !!pos.down);
    if (c.parentElement !== document.body && document.body) {
      document.body.appendChild(c);
    }
  }

  window.__demoSetCursor = (x, y, down) => {
    window.__demoCursorPos = { x, y, down: !!down };
    ensure();
  };

  ensure();
  new MutationObserver(() => ensure()).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
})();
`;

async function placeCursor(page, x, y, down = false) {
  await page.evaluate(
    ({ x, y, down }) => {
      if (typeof window.__demoSetCursor === "function") {
        window.__demoSetCursor(x, y, down);
      }
    },
    { x, y, down },
  );
}

/** Hide cursor off-canvas between actions — never leave it sitting on UI. */
async function parkCursor(page) {
  const x = -80;
  const y = -80;
  await placeCursor(page, x, y, false);
  await page.mouse.move(0, 0).catch(() => {});
}

/** Center of element in viewport CSS pixels (same space as mouse + fixed cursor). */
async function targetPoint(locator) {
  const handle = await locator.elementHandle();
  if (!handle) return null;
  const pt = await handle.evaluate((el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return null;
    return {
      x: r.left + r.width / 2,
      y: r.top + r.height / 2,
    };
  });
  await handle.dispose().catch(() => {});
  return pt;
}

async function clickNamed(page, name, { role = "button", timeout = 20000 } = {}) {
  const el = page.getByRole(role, { name }).first();
  await el.waitFor({ state: "visible", timeout });
  await clickCursor(page, el);
}

/**
 * Move orange cursor tip onto the element center, hold, then mouse-click
 * the same CSS pixel. Tip position is measured from the live DOM after place.
 */
async function clickCursor(page, locator) {
  await locator.scrollIntoViewIfNeeded().catch(() => {});
  await sleep(100);
  let pt = await targetPoint(locator);
  if (!pt) {
    await locator.click({ force: true });
    await parkCursor(page);
    return;
  }

  const start = await page.evaluate(() => {
    const p = window.__demoCursorPos;
    return p && p.x >= 0 && p.y >= 0 ? { x: p.x, y: p.y } : { x: 80, y: 80 };
  });

  const steps = 22;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const ease = t * (2 - t);
    const cx = start.x + (pt.x - start.x) * ease;
    const cy = start.y + (pt.y - start.y) * ease;
    await placeCursor(page, cx, cy, false);
    await page.mouse.move(cx, cy);
    await sleep(14);
  }

  // Final lock: measure element + snap cursor tip, then click that pixel
  pt = (await targetPoint(locator)) || pt;
  const locked = await page.evaluate(
    ({ x, y, hotX, hotY }) => {
      window.__demoSetCursor(x, y, false);
      const c = document.getElementById("__demo_cursor");
      if (c) {
        // Force tip exactly onto (x,y) using live box
        c.style.left = `${x - hotX}px`;
        c.style.top = `${y - hotY}px`;
      }
      return { x, y };
    },
    { x: pt.x, y: pt.y, hotX: HOT_X, hotY: HOT_Y },
  );
  await page.mouse.move(locked.x, locked.y);
  await sleep(320);
  await placeCursor(page, locked.x, locked.y, true);
  await sleep(90);
  await page.mouse.click(locked.x, locked.y, { delay: 60 });
  await placeCursor(page, locked.x, locked.y, false);
  await sleep(180);
  await parkCursor(page);
}

async function clearDemoState(page) {
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.setViewportSize({ width: W, height: H });
}

async function roleSwitch(page, roleLabel, { step, next, dwellMs = 1800 } = {}) {
  if (step && next) {
    const url = `${BASE}/switch-role?step=${encodeURIComponent(step)}&next=${encodeURIComponent(next)}`;
    await page.goto(url, { waitUntil: "networkidle" });
  } else {
    await page.waitForURL(/\/switch-role/, { timeout: 15000 }).catch(() => {});
  }

  await page.setViewportSize({ width: W, height: H });
  await sleep(400);
  if (/Opening/i.test(await page.locator("body").innerText().catch(() => ""))) {
    await page.waitForURL((url) => !url.pathname.includes("switch-role"), {
      timeout: 15000,
    });
    await sleep(500);
    return;
  }

  await sleep(dwellMs);

  const useSeat = page.getByRole("button", {
    name: new RegExp(`Use ${roleLabel} seat`, "i"),
  });
  const signIn = page.getByRole("button", {
    name: new RegExp(`Sign in as ${roleLabel}`, "i"),
  });

  if (await useSeat.isVisible().catch(() => false)) {
    await clickCursor(page, useSeat);
  } else if (await signIn.isVisible().catch(() => false)) {
    await clickCursor(page, signIn);
  } else {
    throw new Error(`Role switch UI missing for ${roleLabel} at ${page.url()}`);
  }

  await page.waitForURL((url) => !url.pathname.includes("switch-role"), {
    timeout: 20000,
  });
  await page.setViewportSize({ width: W, height: H });
  await sleep(500);
}

async function runCall(
  page,
  { endLabel = /Back to desk|Send intake email/i, lines = 1 } = {},
) {
  const skip = page.getByRole("button", { name: /Skip to connected/i });
  await skip.waitFor({ state: "visible", timeout: 8000 });
  await parkCursor(page);
  await sleep(450);
  await clickCursor(page, skip);
  await sleep(900);
  for (let i = 0; i < lines; i++) {
    const next = page.getByRole("button", { name: /Next line/i });
    if (await next.isEnabled().catch(() => false)) {
      await clickCursor(page, next);
      await sleep(1100);
    }
  }
  await clickCursor(page, page.getByRole("button", { name: /End call/i }));
  await sleep(800);
  await clickCursor(page, page.getByRole("button", { name: endLabel }));
  await sleep(650);
}

async function answerChat(page, text) {
  const input = page.locator("form input, form textarea").first();
  await input.waitFor({ state: "visible", timeout: 10000 });
  await clickCursor(page, input);
  await input.fill(text);
  await sleep(180);
  const send = page.getByRole("button", { name: /^Send$/i });
  if (await send.isVisible().catch(() => false)) {
    await clickCursor(page, send);
  } else {
    await input.press("Enter");
  }
  await sleep(1050);
}

async function dwell(_page, ms) {
  await sleep(ms);
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--disable-dev-shm-usage",
      `--window-size=${W},${H}`,
      "--force-device-scale-factor=1",
    ],
  });

  const context = await browser.newContext({
    viewport: { width: W, height: H },
    screen: { width: W, height: H },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    recordVideo: {
      dir: VIDEO_DIR,
      size: { width: W, height: H },
    },
  });

  await context.addInitScript(CURSOR_INIT);

  const page = await context.newPage();
  await page.setViewportSize({ width: W, height: H });
  page.setDefaultTimeout(20000);

  // Keep framing locked after every navigation
  page.on("framenavigated", async (frame) => {
    if (frame === page.mainFrame()) {
      await page.setViewportSize({ width: W, height: H }).catch(() => {});
    }
  });

  console.log(`Recording ${W}x${H} native (no zoom) + tip-accurate orange cursor`);
  await clearDemoState(page);

  const vp = page.viewportSize();
  if (!vp || vp.width !== W || vp.height !== H) {
    throw new Error(`Viewport drifted to ${vp?.width}x${vp?.height}`);
  }

  console.log("Landing");
  await parkCursor(page);
  await dwell(page, 2400);
  await clickNamed(page, /Start full demo/i);
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  await parkCursor(page);
  await dwell(page, 3600);

  console.log("Workbench");
  // Click Book in the nav — never Ask (adjacent orange control)
  await clickNamed(page, /^Book$/i, { role: "link" });
  await page.waitForURL(/\/workbench/, { timeout: 10000 });
  await parkCursor(page);
  await dwell(page, 2000);

  console.log("Whitfield desk");
  await clickNamed(page, /Open desk/i, { role: "link" });
  await page.waitForURL(/\/workbench\/whitmore/);
  await dwell(page, 2400);

  console.log("Principal call");
  await clickNamed(page, /I'll make this call/i);
  await runCall(page, { endLabel: /Back to desk/i, lines: 1 });
  await dwell(page, 700);

  console.log("Hub / Principal");
  await clickCursor(page, page.getByRole("button", { name: /Next: Hub/i }).first());
  await sleep(800);
  await roleSwitch(page, "Principal", {
    step: "hub",
    next: "/hub/whitmore",
    dwellMs: 2400,
  });
  await page.waitForURL(/\/hub\/whitmore/);
  await dwell(page, 1800);

  const allow = page.locator("#allow-call-david");
  await allow.scrollIntoViewIfNeeded();
  const heirSection = page.locator("section").filter({ has: allow }).first();
  const invite = heirSection.getByRole("button", { name: /^Invite$/i });
  if (await invite.isVisible().catch(() => false)) {
    await clickCursor(page, invite);
    await dwell(page, 1600);
  }
  await sleep(500);
  await clickCursor(page, allow);
  // Only force if the allow control is still the actionable target
  const allowStill = page.locator("#allow-call-david");
  if (await allowStill.isVisible().catch(() => false)) {
    const label = (await allowStill.innerText().catch(() => "")).trim();
    if (/allow call/i.test(label)) {
      const pt = await targetPoint(allowStill);
      if (pt) {
        await placeCursor(page, pt.x, pt.y, true);
        await page.mouse.click(pt.x, pt.y);
        await placeCursor(page, pt.x, pt.y, false);
      }
    }
  }
  await parkCursor(page);
  await sleep(800);
  await roleSwitch(page, "Advisor", {
    step: "signal",
    next: "/dashboard",
  });
  await page.waitForURL(/\/dashboard/);
  await dwell(page, 2400);

  console.log("Outreach");
  const goOutreach = page.getByRole("button", { name: /Go to Outreach/i });
  if (await goOutreach.isVisible().catch(() => false)) {
    await clickCursor(page, goOutreach);
  } else {
    await page.goto(`${BASE}/rm`);
  }
  await page.waitForURL(/\/rm/);
  await dwell(page, 1800);

  await clickNamed(page, /Call Heir Whitfield/i);
  await runCall(page, { endLabel: /Send intake email/i, lines: 1 });
  await dwell(page, 900);

  console.log("Intake");
  await clickCursor(
    page,
    page.getByRole("button", { name: /Continue to Intake/i }).first(),
  );
  await sleep(800);
  await roleSwitch(page, "Heir", { step: "intake", next: "/customer" });
  await page.waitForURL(/\/customer/);
  await dwell(page, 1400);

  await clickNamed(page, /Open invite email/i);
  await dwell(page, 1400);
  await clickNamed(page, /Open intake chat/i);
  await page.waitForURL(/\/customer\/chat/);
  await dwell(page, 800);

  console.log("Chat answers");
  await answerChat(page, "Whitfield");
  await answerChat(page, "01/15/1984");
  await answerChat(page, "12000");
  await answerChat(page, "4500");
  await answerChat(page, "3");
  await answerChat(page, "150000");

  await clickCursor(page, page.getByRole("button", { name: /^Continue$/i }).first());
  await sleep(1100);
  await clickNamed(page, /Skip all/i);
  await sleep(1200);
  await clickNamed(page, /^Phone$/i);
  await sleep(1100);
  await clickNamed(page, /^Morning$/i);
  await sleep(350);
  await clickNamed(page, /9:00 AM/i);
  await sleep(2200);

  console.log("Plan");
  const openPlan = page.getByRole("link", { name: /Open full plan/i });
  await openPlan.waitFor({ state: "visible", timeout: 90000 });
  await dwell(page, 1600);
  await clickCursor(page, openPlan);
  await page.waitForURL(/\/customer\/plan/);
  await dwell(page, 500);

  await page.getByRole("button", { name: /^Save$/i }).waitFor({
    state: "visible",
    timeout: 60000,
  });
  await dwell(page, 2200);
  await clickNamed(page, /Reinvest with LegacyAI/i);
  await dwell(page, 2000);

  console.log("Report");
  await clickCursor(
    page,
    page.getByRole("button", { name: /Back to AI Analysis/i }).first(),
  );
  await sleep(800);
  await roleSwitch(page, "Advisor", { step: "signal", next: "/dashboard" });
  await page.waitForURL(/\/dashboard/);
  await dwell(page, 1600);

  const viewReport = page.getByRole("button", { name: /View full report/i });
  if (await viewReport.isVisible().catch(() => false)) {
    await clickCursor(page, viewReport);
  } else {
    await page.goto(`${BASE}/report`);
  }
  await page.waitForURL(/\/report/);
  await dwell(page, 4000);

  await page.goto(BASE);
  await dwell(page, 2200);

  await page.screenshot({
    path: path.join(OUT_DIR, "proof-viewport.png"),
    fullPage: false,
  });

  const videoPath = await page.video().path();
  await context.close();
  await browser.close();

  const dest = path.join(OUT_DIR, "raw-demo.webm");
  fs.copyFileSync(videoPath, dest);
  console.log("Saved", dest);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
