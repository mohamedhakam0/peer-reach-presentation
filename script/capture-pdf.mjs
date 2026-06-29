// Capture all 18 intro slides as a PDF using system Chrome.
// Run from the mesh-sim root: node ../../... (called by PowerShell below)
import puppeteer from 'puppeteer-core';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP_URL = 'http://localhost:5000';
const OUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'slides');
const PDF_OUT = path.join('C:\\Users\\pc\\Desktop', 'peer-reach-presentation.pdf');

const SLIDES = [
  { id: 'cover',                   label: '01-cover' },
  { id: 'hook-agenda',             label: '02-agenda' },
  { id: 'hook-abstract',           label: '03-abstract' },
  { id: 'hook-problem',            label: '04-problem' },
  { id: 'hook-insight',            label: '05-insight' },
  { id: 'hook-range',              label: '06-range' },
  { id: 'hook-solution',           label: '07-solution' },
  { id: 'hook-architecture',       label: '08-architecture' },
  { id: 'hook-components',         label: '09-components' },
  { id: 'hook-demo',               label: '10-demo' },
  { id: 'hook-packet',             label: '11-packet' },
  { id: 'hook-flooding',           label: '12-flooding', advanceSteps: 11 },
  { id: 'hook-security',           label: '13-security' },
  { id: 'hook-security-scenarios', label: '14-scenarios' },
  { id: 'hook-security-deep',      label: '15-security-deep' },
  { id: 'hook-numbers',            label: '16-numbers' },
  { id: 'hook-related',            label: '17-related' },
  { id: 'hook-transition',         label: '18-transition' },
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

await fs.mkdir(OUT_DIR, { recursive: true });

console.log('Launching Chrome headless...');
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--disable-web-security', '--window-size=1920,1080'],
  defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
});

const page = await browser.newPage();
console.log(`Navigating to ${APP_URL}...`);
await page.goto(APP_URL, { waitUntil: 'networkidle0', timeout: 30000 });
await sleep(3500);

const shotPaths = [];

for (let i = 0; i < SLIDES.length; i++) {
  const slide = SLIDES[i];
  process.stdout.write(`[${i + 1}/${SLIDES.length}] ${slide.label} ... `);

  // Scroll the section into view instantly
  await page.evaluate((id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  }, slide.id);

  // Wait for IntersectionObserver + CSS transitions to settle
  await sleep(2800);

  // For flooding algorithm, click Next until the last step is shown
  if (slide.advanceSteps) {
    for (let s = 0; s < slide.advanceSteps; s++) {
      await page.evaluate((id) => {
        const section = document.getElementById(id);
        if (!section) return;
        const btn = section.querySelector('button.flooding-btn.primary');
        if (btn) btn.click();
      }, slide.id);
      await sleep(250);
    }
    await sleep(400);
  }

  const shotPath = path.join(OUT_DIR, `${slide.label}.png`);
  await page.screenshot({ path: shotPath, type: 'png' });
  shotPaths.push(shotPath);
  console.log('done');
}

await browser.close();
console.log('\nAll screenshots captured. Building PDF...');

// ── Build a print HTML and render it to PDF ────────────────────────────────
const printHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #000; }
  .slide {
    width: 1920px; height: 1080px;
    overflow: hidden;
    page-break-after: always;
    break-after: page;
  }
  .slide:last-child { page-break-after: avoid; break-after: avoid; }
  .slide img { width: 1920px; height: 1080px; display: block; object-fit: cover; }
  @page { size: 1920px 1080px; margin: 0; }
</style>
</head>
<body>
${shotPaths
  .map(p => `<div class="slide"><img src="${p.replace(/\\/g, '/')}"></div>`)
  .join('\n')}
</body>
</html>`;

const htmlPath = path.join(OUT_DIR, '_print.html');
await fs.writeFile(htmlPath, printHtml, 'utf-8');

const browser2 = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
  defaultViewport: { width: 1920, height: 1080 },
});

const printPage = await browser2.newPage();
await printPage.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, {
  waitUntil: 'networkidle0',
  timeout: 30000,
});
await sleep(1000);

await printPage.pdf({
  path: PDF_OUT,
  width: '1920px',
  height: '1080px',
  printBackground: true,
  margin: { top: '0', right: '0', bottom: '0', left: '0' },
});

await browser2.close();
console.log(`\n✓ PDF saved to: ${PDF_OUT}`);
