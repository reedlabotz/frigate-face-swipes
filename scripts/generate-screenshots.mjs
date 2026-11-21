import { execSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright-core';

const ROOT = path.resolve(import.meta.dirname, '..');
const BUNDLE_PATH = path.join(ROOT, 'custom_components/frigate_face_swipes/frontend/frigate-face-swipes-card.js');
const OUT_DIR = path.join(ROOT, 'docs/screenshots');

if (!fs.existsSync(BUNDLE_PATH)) {
  console.log('Building frontend bundle first...');
  execSync('npm run build', { cwd: ROOT, stdio: 'inherit' });
}
fs.mkdirSync(OUT_DIR, { recursive: true });

function findBrowser() {
  for (const bin of ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser']) {
    if (fs.existsSync(bin)) return bin;
  }
  throw new Error('No Chromium/Chrome binary found.');
}

const HTML = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body {
      margin: 0;
      padding: 12px;
      background: #0b0e14;
      color: #f3f4f6;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      --primary-text-color: #f3f4f6;
      --secondary-text-color: #9ca3af;
      --card-background-color: #14171c;
      --secondary-background-color: #1e232b;
      --divider-color: rgba(255, 255, 255, 0.1);
    }
  </style>
</head>
<body>
  <frigate-face-swipes-card id="card"></frigate-face-swipes-card>
  <script type="module" src="/frigate-face-swipes-card.js"></script>
  <script type="module">
    await customElements.whenDefined('frigate-face-swipes-card');

    function makeEmojiBlob({ emoji, bg1, bg2, size = 180, blur = 0, dark = false, tilt = 0 }) {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      const grad = ctx.createLinearGradient(0, 0, size, size);
      grad.addColorStop(0, bg1);
      grad.addColorStop(1, bg2);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);

      if (blur > 0) ctx.filter = \`blur(\${blur}px)\`;
      if (dark) ctx.filter = (ctx.filter === 'none' ? '' : ctx.filter + ' ') + 'brightness(0.45)';
      ctx.save();
      ctx.translate(size / 2, size / 2 + size * 0.05);
      ctx.rotate(tilt);
      ctx.font = \`\${Math.round(size * 0.62)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif\`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, 0, 0);
      ctx.restore();

      return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    }

    const SAMPLES = {
      // Train queue
      'clips/faces/train/1768924500.1-abc1-1768924500.5-Person A-0.91.webp': { emoji: '🧑🏻', bg1: '#dbeafe', bg2: '#93c5fd', size: 192, tilt: 0.04 },
      'clips/faces/train/1768924480.1-abc2-1768924480.5-Person B-0.78.webp': { emoji: '👩🏽', bg1: '#fef3c7', bg2: '#fcd34d', size: 184, tilt: -0.08 },
      'clips/faces/train/1768924460.1-abc3-1768924460.5-unknown-0.42.webp': { emoji: '🧔🏼', bg1: '#dcfce7', bg2: '#86efac', size: 168, tilt: 0.1 },
      'clips/faces/train/1768924440.1-abc4-1768924440.5-Person C-0.64.webp': { emoji: '👨🏾‍🦱', bg1: '#374151', bg2: '#1f2937', size: 96, blur: 2, dark: true },

      // Registered library for Person A (6 shots: diverse + near-dup + weak)
      'clips/faces/Person A/a_1.webp': { emoji: '🧑🏻', bg1: '#dbeafe', bg2: '#60a5fa', size: 200, tilt: 0 },
      'clips/faces/Person A/a_2.webp': { emoji: '🧑🏻', bg1: '#dbeafe', bg2: '#60a5fa', size: 196, tilt: 0.02 },
      'clips/faces/Person A/a_3.webp': { emoji: '😄', bg1: '#fef3c7', bg2: '#f59e0b', size: 188, tilt: -0.1 },
      'clips/faces/Person A/a_4.webp': { emoji: '🕶️', bg1: '#e0e7ff', bg2: '#818cf8', size: 180, tilt: 0.12 },
      'clips/faces/Person A/a_5.webp': { emoji: '🧑🏻', bg1: '#dcfce7', bg2: '#34d399', size: 176, tilt: -0.06 },
      'clips/faces/Person A/a_6.webp': { emoji: '🧑🏻', bg1: '#1f2937', bg2: '#111827', size: 72, blur: 2.5, dark: true },

      // Other people
      'clips/faces/Person B/b_1.webp': { emoji: '👩🏽', bg1: '#fce7f3', bg2: '#f472b6', size: 190 },
      'clips/faces/Person C/c_1.webp': { emoji: '👨🏾‍🦱', bg1: '#fef9c3', bg2: '#facc15', size: 190 },
      'clips/faces/Person D/d_1.webp': { emoji: '🧔🏼', bg1: '#e0f2fe', bg2: '#38bdf8', size: 190 },
    };

    let facesState = {
      train: [
        '1768924500.1-abc1-1768924500.5-Person A-0.91.webp',
        '1768924480.1-abc2-1768924480.5-Person B-0.78.webp',
        '1768924460.1-abc3-1768924460.5-unknown-0.42.webp',
        '1768924440.1-abc4-1768924440.5-Person C-0.64.webp',
      ],
      'Person A': ['a_1.webp', 'a_2.webp', 'a_3.webp', 'a_4.webp', 'a_5.webp', 'a_6.webp'],
      'Person B': ['b_1.webp'],
      'Person C': ['c_1.webp'],
      'Person D': ['d_1.webp'],
    };

    const card = document.getElementById('card');
    card.setConfig({ entry_id: 'default', sort: 'newest' });
    card.hass = {
      async callWS() { return []; },
      async fetchWithAuth(url, init = {}) {
        const clean = url.replace(/^\\/api\\/frigate_face_swipes\\/proxy\\/default\\//, '');
        if (clean === 'api/faces') {
          return new Response(JSON.stringify(facesState), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        if (clean.startsWith('api/faces/train/') && clean.endsWith('/classify')) {
          const body = JSON.parse(init.body || '{}');
          facesState.train = facesState.train.filter((f) => f !== body.training_file);
          return new Response(JSON.stringify({ success: true }), { status: 200 });
        }
        if (clean.endsWith('/delete')) {
          return new Response(JSON.stringify({ success: true }), { status: 200 });
        }
        const sample = SAMPLES[clean] || { emoji: '🙂', bg1: '#334155', bg2: '#1e293b', size: 180 };
        const blob = await makeEmojiBlob(sample);
        return new Response(blob, { status: 200, headers: { 'Content-Type': 'image/png' } });
      },
    };
  </script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  if (req.url === '/frigate-face-swipes-card.js') {
    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    fs.createReadStream(BUNDLE_PATH).pipe(res);
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(HTML);
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const { port } = server.address();
const baseUrl = `http://127.0.0.1:${port}/`;

const browser = await chromium.launch({
  executablePath: findBrowser(),
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

try {
  const page = await browser.newPage({ viewport: { width: 412, height: 820 }, deviceScaleFactor: 2 });
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // Confirm first card so the "Last:" confirmation bar with thumbnail is shown on Person B's card
  await page.evaluate(() => {
    const card = document.querySelector('#card');
    const swipe = card.shadowRoot.querySelector('frigate-swipe-view');
    swipe.shadowRoot.querySelector('.act-btn.confirm').click();
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT_DIR, 'swipe-mode.png'), fullPage: false });

  // Open Reassign popover modal
  await page.evaluate(() => {
    const card = document.querySelector('#card');
    const swipe = card.shadowRoot.querySelector('frigate-swipe-view');
    swipe.shadowRoot.querySelector('.act-btn.reassign').click();
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT_DIR, 'reassign-modal.png'), fullPage: false });

  // Close modal and switch to Curate mode with Keep best: 3
  await page.evaluate(() => {
    const card = document.querySelector('#card');
    const swipe = card.shadowRoot.querySelector('frigate-swipe-view');
    swipe.shadowRoot.querySelector('frigate-reassign-modal').shadowRoot.querySelector('.close-btn').click();
    card.shadowRoot.querySelectorAll('.mode-tab')[1].click();
  });
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    const card = document.querySelector('#card');
    const curate = card.shadowRoot.querySelector('frigate-curate-view');
    const nSel = curate.shadowRoot.querySelectorAll('select')[1];
    nSel.value = '3';
    nSel.dispatchEvent(new Event('change'));
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT_DIR, 'curate-mode.png'), fullPage: true });

  console.log('Generated screenshots in docs/screenshots/');
} finally {
  await browser.close();
  server.close();
}
