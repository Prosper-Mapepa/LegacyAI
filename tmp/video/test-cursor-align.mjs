import { chromium } from "playwright";

const W = 1920;
const H = 1080;
const HOT_X = 12;
const HOT_Y = 12;

const CURSOR_INIT = `
(() => {
  const HOT_X = ${HOT_X};
  const HOT_Y = ${HOT_Y};
  window.__demoCursorPos = window.__demoCursorPos || { x: ${W / 2}, y: ${H / 2}, down: false };
  function ensure() {
    document.documentElement.style.zoom = "";
    if (!document.getElementById("__demo_cursor_style")) {
      const style = document.createElement("style");
      style.id = "__demo_cursor_style";
      style.textContent = \`
        *, *::before, *::after { cursor: none !important; }
        #__demo_cursor {
          position: fixed !important; width: 56px !important; height: 56px !important;
          margin: 0 !important; padding: 0 !important; pointer-events: none !important;
          z-index: 2147483647 !important; transform: none !important;
          filter: drop-shadow(0 4px 10px rgba(0,0,0,0.55)); left: 0; top: 0;
        }
        #__demo_cursor svg { display: block; width: 56px; height: 56px; overflow: visible; }
      \`;
      (document.head || document.documentElement).appendChild(style);
    }
    let c = document.getElementById("__demo_cursor");
    if (!c) {
      c = document.createElement("div");
      c.id = "__demo_cursor";
      c.innerHTML = \`<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#F58025" fill-opacity="0.4" stroke="#fff" stroke-width="2"/>
        <path d="M8 6 L8 42 L18 32 L26 48 L33 45 L24 28 L40 28 Z"
          fill="#F58025" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/>
      </svg>\`;
      (document.body || document.documentElement).appendChild(c);
    }
    const pos = window.__demoCursorPos;
    c.style.left = pos.x - HOT_X + "px";
    c.style.top = pos.y - HOT_Y + "px";
  }
  window.__demoSetCursor = (x, y, down) => {
    window.__demoCursorPos = { x, y, down: !!down };
    ensure();
  };
  ensure();
  new MutationObserver(() => ensure()).observe(document.documentElement, { childList: true, subtree: true });
})();
`;

const browser = await chromium.launch({
  headless: true,
  args: [`--window-size=${W},${H}`, "--force-device-scale-factor=1"],
});
const context = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: 1,
});
await context.addInitScript(CURSOR_INIT);
const page = await context.newPage();
await page.goto("http://localhost:3001/", { waitUntil: "networkidle" });
await page.evaluate(() => {
  localStorage.clear();
  sessionStorage.clear();
});
await page.reload({ waitUntil: "networkidle" });

const btn = page.getByRole("button", { name: /Start full demo/i });
await btn.waitFor({ state: "visible" });
const handle = await btn.elementHandle();
const pt = await handle.evaluate((el) => {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
});
await page.evaluate(({ x, y }) => window.__demoSetCursor(x, y, true), pt);
await page.mouse.move(pt.x, pt.y);
await page.screenshot({ path: "tmp/video/cursor-align-proof.png", fullPage: false });
const tip = await page.evaluate(() => {
  const c = document.getElementById("__demo_cursor");
  const r = c.getBoundingClientRect();
  return { tipX: r.left + 12, tipY: r.top + 12 };
});
console.log("landing", { target: pt, tip, dx: tip.tipX - pt.x, dy: tip.tipY - pt.y });

await btn.click();
await page.waitForURL(/\/dashboard/);
await page.waitForTimeout(1500);

const ask = page
  .getByRole("link", { name: /^Ask$/i })
  .or(page.getByRole("button", { name: /^Ask$/i }))
  .first();
const askVisible = await ask.isVisible().catch(() => false);
console.log("Ask visible", askVisible);
if (askVisible) {
  const ah = await ask.elementHandle();
  const apt = await ah.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  await page.evaluate(({ x, y }) => window.__demoSetCursor(x, y, true), apt);
  await page.mouse.move(apt.x, apt.y);
  await page.screenshot({ path: "tmp/video/cursor-ask-proof.png", fullPage: false });
  const tip2 = await page.evaluate(() => {
    const c = document.getElementById("__demo_cursor");
    const r = c.getBoundingClientRect();
    return { tipX: r.left + 12, tipY: r.top + 12 };
  });
  console.log("ask", { askTarget: apt, tip2, dx: tip2.tipX - apt.x, dy: tip2.tipY - apt.y });
}

await browser.close();
