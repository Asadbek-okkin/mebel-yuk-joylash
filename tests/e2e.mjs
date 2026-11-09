// Playwright e2e: telefon (iPhone 13) va kompyuter. Run: node tests/e2e.mjs  -> "E2E OK"
// E2E_URL berilsa - shu manzil sinanadi, aks holda web/ papkasi lokal serverda.
// Playwright paketi: lokal node_modules yoki PW_DIR (masalan C:\Users\admin\inok-uz\node_modules\).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const WEB = path.join(DIR, '..', 'web');
let pw;
try { pw = createRequire(import.meta.url)('playwright'); } catch {
  pw = createRequire(path.join(process.env.PW_DIR || 'C:\\Users\\admin\\inok-uz\\node_modules\\', 'x.js'))('playwright');
}
const { chromium, devices } = pw;

const TUR = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
let server, URL = process.env.E2E_URL;
if (!URL) {
  server = http.createServer((q, s) => {
    const p = path.join(WEB, decodeURIComponent(q.url.split('?')[0]).replace(/\/$/, '/index.html'));
    if (!p.startsWith(WEB) || !fs.existsSync(p)) { s.writeHead(404); s.end(); return; }
    s.writeHead(200, { 'Content-Type': TUR[path.extname(p)] || 'application/octet-stream' });
    fs.createReadStream(p).pipe(s);
  }).listen(0);
  URL = `http://127.0.0.1:${server.address().port}/`;
}

const fail = (m) => { throw new Error(m); };
// mavjud Chromium (ms-playwright keshidan) - qayta yuklab olmaslik uchun
const KESH = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright');
const bor = fs.existsSync(KESH) ? fs.readdirSync(KESH).filter((d) => /^chromium-\d+$/.test(d)).sort().reverse() : [];
const exe = bor.map((d) => path.join(KESH, d, 'chrome-win64', 'chrome.exe')).find((p) => fs.existsSync(p));
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
try {
  for (const [nom, opt] of [['iphone', devices['iPhone 13']], ['desktop', { viewport: { width: 1366, height: 800 } }]]) {
    const ctx = await browser.newContext(opt);
    const page = await ctx.newPage();
    const xatolar = [];
    page.on('pageerror', (e) => xatolar.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') xatolar.push(m.text()); });
    await page.goto(URL, { waitUntil: 'networkidle' });
    const t = (s) => page.locator(`[data-test="${s}"]`);

    await t('namuna').click();
    const sigdi = await t('sigdi').textContent();
    if (sigdi.trim() !== '5 / 5') fail(`${nom}: namuna sigdi = ${sigdi}`);
    if (!/t \/ /.test(await t('ogirlik').textContent())) fail(`${nom}: ogirlik matni`);

    await t('mashina').selectOption('Labo');
    await t('fayl').setInputFiles(path.join(DIR, 'fixtures', 'shkaf.yuk'));
    await page.waitForFunction(() => document.querySelectorAll('[data-test="buyurtmalar"] li').length === 2, null, { timeout: 5000 });
    const s2 = (await t('sigdi').textContent()).trim();
    if (!/^\d+ \/ 10$/.test(s2)) fail(`${nom}: shkaf + namuna sigdi = ${s2}`);
    if (!(await t('tavsiya').textContent()).trim()) fail(`${nom}: tavsiya bo'sh`);
    if (await page.locator('[data-test="buyurtmalar"] li').count() !== 2) fail(`${nom}: buyurtmalar soni`);

    await t('fayl').setInputFiles(path.join(DIR, 'fixtures', 'xato.yuk'));
    await t('xato').waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    if (!(await t('xato').isVisible())) fail(`${nom}: xato ko'rinmadi`);
    if (await page.locator('[data-test="buyurtmalar"] li').count() !== 2) fail(`${nom}: xato fayldan keyin buyurtmalar o'zgardi`);

    await t('mashina').selectOption('Fura');
    await t('nechta').click();
    await page.waitForFunction(() => /komplekt|xato/i.test(document.querySelector('[data-test="nechta-natija"]').textContent), null, { timeout: 30000 });
    const nt = await t('nechta-natija').textContent();
    if (!/\d+ ta komplekt/.test(nt)) fail(`${nom}: nechta = ${nt}`);

    // bosqichma-bosqich: 1 ta quti, keyin qutiga bosib popup
    await t('oldinga').click();
    if ((await t('qadam').textContent()).trim() !== '1 / 10') fail(`${nom}: qadam = ${await t('qadam').textContent()}`);
    await t('hammasi').click();
    await t('canvas').scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    const pt = await page.evaluate(() => window.__sahna.ekranNuqta(0));
    await page.mouse.click(pt.x, pt.y);
    if (!(await t('popup').isVisible())) fail(`${nom}: popup ko'rinmadi`);

    const sw = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (sw > 0) fail(`${nom}: gorizontal scroll ${sw}px`);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(DIR, `${nom}.png`), fullPage: nom === 'iphone' });
    if (xatolar.length) fail(`${nom}: konsol xatolari: ${xatolar.join(' | ')}`);
    await ctx.close();
  }
  console.log('E2E OK');
} finally {
  await browser.close();
  if (server) server.close();
}
