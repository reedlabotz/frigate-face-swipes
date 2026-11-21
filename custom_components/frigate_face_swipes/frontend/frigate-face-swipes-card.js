const DEFAULT_CARD_CONFIG = {
  entry_id: 'default',
  sort: 'newest',
};

function escapeHtml(val) {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseTrainFilename(filename) {
  const base = String(filename || '').replace(/\.[^.]+$/, '');
  const parts = base.split('-');
  if (parts.length >= 4) {
    const maybeScore = Number(parts[parts.length - 1]);
    if (!Number.isNaN(maybeScore) && maybeScore >= 0 && maybeScore <= 1) {
      return {
        filename,
        predicted: parts[parts.length - 2] || 'unknown',
        score: maybeScore,
        eventId: parts.length >= 5 ? `${parts[0]}-${parts[1]}` : null,
        ts: Number(parts[0]) || 0,
      };
    }
  }
  return { filename, predicted: 'unknown', score: null, eventId: null, ts: 0 };
}

function formatPct(score) {
  if (typeof score !== 'number' || Number.isNaN(score)) return '—';
  return `${Math.round((score > 1 ? score : score * 100))}%`;
}

function scoreTier(score) {
  if (typeof score !== 'number' || Number.isNaN(score)) return 'none';
  const s = score > 1 ? score / 100 : score;
  if (s >= 0.85) return 'high';
  if (s >= 0.65) return 'mid';
  return 'low';
}

function qualityTier(q) {
  if (typeof q !== 'number' || Number.isNaN(q)) return 'none';
  if (q >= 75) return 'high';
  if (q >= 50) return 'mid';
  return 'low';
}

async function analyzeFaceQuality(blob) {
  const bmp = await createImageBitmap(blob);
  const origW = bmp.width;
  const origH = bmp.height;
  const minDim = Math.min(origW, origH);

  // Sample on a normalized 64x64 grid for fast sharpness & exposure metrics
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bmp, 0, 0, size, size);
  bmp.close?.();

  const data = ctx.getImageData(0, 0, size, size).data;
  const lum = new Float32Array(size * size);
  let sum = 0;
  for (let i = 0; i < size * size; i++) {
    const l = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
    lum[i] = l;
    sum += l;
  }
  const meanLum = sum / (size * size);

  let varSum = 0;
  let lapSum = 0;
  let lapCount = 0;
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const idx = y * size + x;
      const diff = lum[idx] - meanLum;
      varSum += diff * diff;
      const lap = Math.abs(
        4 * lum[idx] - lum[idx - 1] - lum[idx + 1] - lum[idx - size] - lum[idx + size]
      );
      lapSum += lap;
      lapCount++;
    }
  }
  const stdLum = Math.sqrt(varSum / Math.max(1, lapCount));
  const meanLap = lapSum / Math.max(1, lapCount);

  // Score components: Resolution (0-35), Sharpness (0-40), Exposure/Contrast (0-25)
  const resScore = Math.min(35, Math.max(0, ((minDim - 32) / 96) * 35));
  const sharpScore = Math.min(40, Math.max(0, (meanLap / 26) * 40));
  const lumPenalty = meanLum < 45 ? (45 - meanLum) / 45 : meanLum > 220 ? (meanLum - 220) / 35 : 0;
  const contrastScore = Math.min(25, Math.max(0, (stdLum / 52) * 25)) * (1 - Math.min(0.8, lumPenalty));

  const total = Math.round(Math.min(100, Math.max(0, resScore + sharpScore + contrastScore)));
  const flags = [];
  if (minDim < 60) flags.push(`${minDim}px`);
  if (meanLap < 9) flags.push('Blurry');
  if (meanLum < 45) flags.push('Dark');
  if (!flags.length) flags.push(`${minDim}px`);

  return {
    score: total,
    width: origW,
    height: origH,
    tag: flags.join(' · '),
  };
}

class FrigateFaceSwipesCard extends HTMLElement {
  constructor() {
    super();
    this._config = { ...DEFAULT_CARD_CONFIG };
    this._faces = {};
    this._deck = [];
    this._history = [];
    this._stats = { confirmed: 0, trashed: 0, reassigned: 0, replaced: 0, skipped: 0 };
    this._mode = 'swipe'; // 'swipe' | 'groups' | 'library'
    this._sort = 'newest';
    this._loading = false;
    this._error = '';
    this._toast = '';
    this._showSnapshot = false;
    this._showPicker = false;
    this._replaceTarget = null; // filename in predicted person's folder to replace
    this._selectedGroupFiles = new Set();
    this._imgCache = new Map();
    this._qualityCache = new Map();
    this._keyHandler = (e) => this.handleKeyDown(e);
  }

  static getStubConfig() {
    return { ...DEFAULT_CARD_CONFIG };
  }

  setConfig(config) {
    this._config = { ...DEFAULT_CARD_CONFIG, ...config };
    this._sort = this._config.sort || 'newest';
    if (this.shadowRoot) this.render();
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (!this._initialized) {
      this._initialized = true;
      this.attachShadow({ mode: 'open' });
      this.render();
    }
    if (first) {
      this.loadFaces();
    }
  }

  connectedCallback() {
    window.addEventListener('keydown', this._keyHandler);
  }

  disconnectedCallback() {
    window.removeEventListener('keydown', this._keyHandler);
  }

  proxyBase() {
    const entryId = encodeURIComponent(this._config.entry_id || 'default');
    return `/api/frigate_face_swipes/proxy/${entryId}`;
  }

  async apiJson(path, options = {}) {
    const resp = await this._hass.fetchWithAuth(`${this.proxyBase()}/${path.replace(/^\/+/, '')}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    const text = await resp.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (_) { data = text; }
    if (!resp.ok) {
      throw new Error(data?.error || data?.message || data?.detail || text || `HTTP ${resp.status}`);
    }
    return data;
  }

  async fetchAndAnalyze(path) {
    if (!this._hass || !path) return null;
    if (this._imgCache.has(path)) {
      return { url: this._imgCache.get(path), quality: this._qualityCache.get(path) || null };
    }
    try {
      const resp = await this._hass.fetchWithAuth(`${this.proxyBase()}/${path.replace(/^\/+/, '')}`);
      if (!resp.ok) return null;
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      this._imgCache.set(path, url);
      let quality = null;
      if (path.startsWith('clips/faces/')) {
        quality = await analyzeFaceQuality(blob).catch(() => null);
        if (quality) this._qualityCache.set(path, quality);
      }
      return { url, quality };
    } catch (_) {
      return null;
    }
  }

  async loadAuthImg(imgEl, path, badgeEl = null) {
    const res = await this.fetchAndAnalyze(path);
    if (!res) return;
    imgEl.src = res.url;
    if (badgeEl && res.quality) {
      badgeEl.textContent = `Q:${res.quality.score}`;
      badgeEl.title = `${res.quality.width}×${res.quality.height} (${res.quality.tag})`;
      badgeEl.className = `q-badge tier-${qualityTier(res.quality.score)}`;
    }
  }

  async preloadPersonQuality(person) {
    const files = Array.isArray(this._faces?.[person]) ? this._faces[person] : [];
    const uncached = files.filter(f => !this._qualityCache.has(`clips/faces/${person}/${f}`));
    if (!uncached.length) return;
    await Promise.all(uncached.slice(0, 12).map(f => this.fetchAndAnalyze(`clips/faces/${person}/${f}`)));
    this.render();
  }

  getWeakestForPerson(person) {
    const files = Array.isArray(this._faces?.[person]) ? this._faces[person] : [];
    let weakest = null;
    for (const f of files) {
      const q = this._qualityCache.get(`clips/faces/${person}/${f}`);
      if (q && (!weakest || q.score < weakest.quality.score)) {
        weakest = { filename: f, quality: q };
      }
    }
    return weakest;
  }

  async loadFaces() {
    if (!this._hass) return;
    this._loading = true;
    this._error = '';
    this.render();
    try {
      const data = await this.apiJson('api/faces');
      this._faces = data && typeof data === 'object' ? data : {};
      this.rebuildDeck();
    } catch (err) {
      this._error = err?.message || String(err);
    }
    this._loading = false;
    this.render();
    const top = this._deck[0];
    if (top?.predicted && top.predicted !== 'unknown') {
      this.preloadPersonQuality(top.predicted);
    }
  }

  rebuildDeck() {
    const trainList = Array.isArray(this._faces?.train) ? this._faces.train : [];
    const items = trainList.map(parseTrainFilename);
    if (this._sort === 'lowest') {
      items.sort((a, b) => (a.score ?? -1) - (b.score ?? -1));
    } else if (this._sort === 'unknown_first') {
      items.sort((a, b) => {
        const au = a.predicted === 'unknown' ? 0 : 1;
        const bu = b.predicted === 'unknown' ? 0 : 1;
        return au !== bu ? au - bu : (b.ts - a.ts);
      });
    } else {
      items.sort((a, b) => b.ts - a.ts);
    }
    this._deck = items;
    this._showSnapshot = false;
    this._showPicker = false;
    this._replaceTarget = null;
  }

  getPeopleNames() {
    return Object.keys(this._faces || {})
      .filter(k => k !== 'train')
      .sort((a, b) => a.localeCompare(b));
  }

  makeToast(text, trainFilename = null) {
    const thumbUrl = trainFilename
      ? (this._imgCache.get(`clips/faces/train/${trainFilename}`) || null)
      : null;
    return { text, thumbUrl };
  }

  setToast(msg, trainFilename = null) {
    this._toast = typeof msg === 'string' ? this.makeToast(msg, trainFilename) : msg;
    this.render();
  }

  advanceDeckCleanup() {
    this._showPicker = false;
    this._showSnapshot = false;
    this._replaceTarget = null;
    const nextTop = this._deck[0];
    if (nextTop?.predicted && nextTop.predicted !== 'unknown') {
      this.preloadPersonQuality(nextTop.predicted);
    }
  }

  async confirmCurrent() {
    const top = this._deck[0];
    if (!top) return;
    if (!top.predicted || top.predicted === 'unknown') {
      this._showPicker = true;
      this.render();
      return;
    }
    await this.classifyItem(top, top.predicted, 'confirmed');
  }

  async replaceWeakestCurrent() {
    const top = this._deck[0];
    if (!top || !top.predicted || top.predicted === 'unknown') return;
    const person = top.predicted;
    const weakest = this.getWeakestForPerson(person);
    const targetToReplace = this._replaceTarget || weakest?.filename;
    if (!targetToReplace) {
      await this.confirmCurrent();
      return;
    }
    const oldQ = this._qualityCache.get(`clips/faces/${person}/${targetToReplace}`)?.score;
    const newQ = this._qualityCache.get(`clips/faces/train/${top.filename}`)?.score;

    this._deck.shift();
    this.advanceDeckCleanup();
    this.render();
    try {
      await this.apiJson(`api/faces/train/${encodeURIComponent(person)}/classify`, {
        method: 'POST',
        body: JSON.stringify({ training_file: top.filename }),
      });
      await this.apiJson(`api/faces/${encodeURIComponent(person)}/delete`, {
        method: 'POST',
        body: JSON.stringify({ ids: [targetToReplace] }),
      });
      this._stats.replaced++;
      this._faces.train = (this._faces.train || []).filter(f => f !== top.filename);
      this._faces[person] = (this._faces[person] || []).filter(f => f !== targetToReplace);
      const qNote = oldQ != null && newQ != null ? ` (Q:${oldQ} → Q:${newQ})` : '';
      this._toast = this.makeToast(`Replaced weak photo for "${person}"${qNote}`, top.filename);
    } catch (err) {
      this._deck.unshift(top);
      this._toast = this.makeToast(`Replace error: ${err?.message || err}`, top.filename);
    }
    this.render();
  }

  async classifyItem(item, targetName, statKey = 'reassigned') {
    const name = String(targetName || '').trim();
    if (!name) return;
    this._deck.shift();
    this.advanceDeckCleanup();
    this.render();
    try {
      await this.apiJson(`api/faces/train/${encodeURIComponent(name)}/classify`, {
        method: 'POST',
        body: JSON.stringify({ training_file: item.filename }),
      });
      this._stats[statKey]++;
      this._faces.train = (this._faces.train || []).filter(f => f !== item.filename);
      if (!Array.isArray(this._faces[name])) this._faces[name] = [];
      this._toast = this.makeToast(`Saved to "${name}"`, item.filename);
    } catch (err) {
      this._deck.unshift(item);
      this._toast = this.makeToast(`Error: ${err?.message || err}`, item.filename);
    }
    this.render();
  }

  async trashCurrent() {
    const top = this._deck[0];
    if (!top) return;
    this._deck.shift();
    this.advanceDeckCleanup();
    this.render();
    try {
      await this.apiJson('api/faces/train/delete', {
        method: 'POST',
        body: JSON.stringify({ ids: [top.filename] }),
      });
      this._stats.trashed++;
      this._faces.train = (this._faces.train || []).filter(f => f !== top.filename);
      this._toast = this.makeToast('Trashed bad crop', top.filename);
    } catch (err) {
      this._deck.unshift(top);
      this._toast = this.makeToast(`Delete error: ${err?.message || err}`, top.filename);
    }
    this.render();
  }

  skipCurrent() {
    const top = this._deck[0];
    if (!top) return;
    this._deck.shift();
    this._deck.push(top);
    this._history.push({ type: 'skip', item: top });
    this._stats.skipped++;
    this._toast = this.makeToast('Skipped for later', top.filename);
    this.advanceDeckCleanup();
    this.render();
  }

  undoLast() {
    const last = this._history.pop();
    if (!last) {
      this.setToast('Nothing to undo (only Skips can be undone)');
      return;
    }
    if (last.type === 'skip') {
      this._deck = this._deck.filter(x => x.filename !== last.item.filename);
      this._deck.unshift(last.item);
      this._stats.skipped = Math.max(0, this._stats.skipped - 1);
      this._toast = this.makeToast('Restored skipped face', last.item.filename);
      this.render();
    }
  }

  async batchAction(action, targetName = '') {
    const files = Array.from(this._selectedGroupFiles);
    if (!files.length) return;
    this._toast = `${action === 'trash' ? 'Deleting' : 'Saving'} ${files.length} face(s)...`;
    this.render();
    try {
      if (action === 'trash') {
        await this.apiJson('api/faces/train/delete', {
          method: 'POST',
          body: JSON.stringify({ ids: files }),
        });
        this._stats.trashed += files.length;
      } else {
        for (const f of files) {
          await this.apiJson(`api/faces/train/${encodeURIComponent(targetName)}/classify`, {
            method: 'POST',
            body: JSON.stringify({ training_file: f }),
          });
        }
        this._stats.confirmed += files.length;
      }
      this._selectedGroupFiles.clear();
      await this.loadFaces();
      this._toast = `Updated ${files.length} face(s).`;
    } catch (err) {
      this._toast = `Batch error: ${err?.message || err}`;
    }
    this.render();
  }

  async deleteLibraryFace(person, filename) {
    try {
      await this.apiJson(`api/faces/${encodeURIComponent(person)}/delete`, {
        method: 'POST',
        body: JSON.stringify({ ids: [filename] }),
      });
      this._toast = `Removed ${filename} from "${person}"`;
      await this.loadFaces();
    } catch (err) {
      this.setToast(`Error: ${err?.message || err}`);
    }
  }

  async reclassifyLibraryFace(fromPerson, filename, toPerson) {
    if (!toPerson || toPerson === fromPerson) return;
    try {
      await this.apiJson(`api/faces/${encodeURIComponent(fromPerson)}/reclassify`, {
        method: 'POST',
        body: JSON.stringify({ id: filename, new_name: toPerson }),
      });
      this._toast = `Moved ${filename} to "${toPerson}"`;
      await this.loadFaces();
    } catch (err) {
      this.setToast(`Error: ${err?.message || err}`);
    }
  }

  handleKeyDown(e) {
    if (this._mode !== 'swipe' || !this._deck.length) return;
    if (e.key === 'Escape' && this._showPicker) {
      e.preventDefault();
      this._showPicker = false;
      this.render();
      return;
    }
    const active = this.shadowRoot?.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'SELECT')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); this.confirmCurrent(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); this.trashCurrent(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); this._showPicker = !this._showPicker; this.render(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); this.skipCurrent(); }
    else if (e.key.toLowerCase() === 'r') { e.preventDefault(); this.replaceWeakestCurrent(); }
    else if (e.key.toLowerCase() === 'z') { e.preventDefault(); this.undoLast(); }
  }

  render() {
    if (!this.shadowRoot) return;
    const people = this.getPeopleNames();
    const top = this._deck[0] || null;
    const next = this._deck[1] || null;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: inherit;
          color: var(--primary-text-color, #f3f4f6);
          --t-bg: var(--card-background-color, #14171c);
          --t-surface: var(--secondary-background-color, #1e232b);
          --t-border: var(--divider-color, rgba(255,255,255,0.1));
          --t-muted: var(--secondary-text-color, #9ca3af);
        }
        ha-card {
          background: var(--t-bg);
          border-radius: 18px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .topbar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          font-size: 16px;
        }
        .pill-badge {
          background: linear-gradient(135deg, #ec4899, #f97316);
          color: #fff;
          font-size: 10px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 999px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .mode-tabs {
          display: flex;
          gap: 6px;
          background: var(--t-surface);
          padding: 4px;
          border-radius: 10px;
        }
        .mode-tab {
          border: none;
          background: transparent;
          color: var(--t-muted);
          padding: 6px 12px;
          border-radius: 7px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
        }
        .mode-tab.active {
          background: #2563eb;
          color: #fff;
        }
        .stats-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
          justify-content: space-between;
          font-size: 12px;
          color: var(--t-muted);
        }
        .stat-pills { display: flex; gap: 8px; flex-wrap: wrap; }
        .stat-pill {
          background: var(--t-surface);
          border: 1px solid var(--t-border);
          padding: 3px 9px;
          border-radius: 999px;
          font-variant-numeric: tabular-nums;
        }
        .toast {
          font-size: 12px;
          padding: 6px 10px;
          border-radius: 10px;
          background: rgba(37, 99, 235, 0.14);
          border: 1px solid rgba(37, 99, 235, 0.35);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .toast-thumb {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          object-fit: cover;
          flex-shrink: 0;
          background: #0d0f13;
        }
        .toast-tag {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #60a5fa;
          flex-shrink: 0;
        }
        .err {
          font-size: 13px;
          padding: 12px;
          border-radius: 10px;
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.35);
          color: #fca5a5;
        }
        .deck-stage {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .card-stack {
          position: relative;
          width: 100%;
          max-width: 390px;
        }
        button { touch-action: manipulation; }
        @media (max-width: 600px), (hover: none) {
          .kbd-hint { display: none; }
        }
        @media (max-width: 600px) {
          ha-card { padding: 10px; gap: 8px; border-radius: 14px; }
          .brand { font-size: 14px; }
          .brand-sub { display: none; }
          .mode-tab { padding: 5px 9px; font-size: 11px; }
          .stats-bar { gap: 6px; font-size: 11px; }
          .stat-pill { padding: 2px 7px; }
          .hero-wrap { aspect-ratio: auto; height: min(290px, 34vh); }
          .card-body { padding: 10px; gap: 7px; }
          .pred-title { font-size: 16px; }
          .ref-imgs { gap: 4px; }
          .actions { gap: 10px; }
          .act-btn { width: 50px; height: 50px; font-size: 20px; }
          .act-btn.small { width: 38px; height: 38px; font-size: 15px; }
        }
        .swipe-card {
          position: relative;
          width: 100%;
          background: var(--t-surface);
          border: 1px solid var(--t-border);
          border-radius: 22px;
          overflow: hidden;
          box-shadow: 0 16px 36px rgba(0,0,0,0.32);
          user-select: none;
          touch-action: none;
          transition: transform 0.18s ease-out;
        }
        .swipe-card.under {
          position: absolute;
          inset: 0;
          transform: scale(0.95) translateY(10px);
          opacity: 0.5;
          pointer-events: none;
        }
        .swipe-card.dragging { transition: none; }
        .stamp {
          position: absolute;
          top: 22px;
          padding: 6px 14px;
          border-radius: 10px;
          font-size: 20px;
          font-weight: 900;
          letter-spacing: 0.08em;
          border: 4px solid;
          opacity: 0;
          pointer-events: none;
          z-index: 5;
        }
        .stamp.confirm { left: 18px; color: #22c55e; border-color: #22c55e; transform: rotate(-12deg); }
        .stamp.trash { right: 18px; color: #ef4444; border-color: #ef4444; transform: rotate(12deg); }
        .stamp.reassign { left: 50%; transform: translateX(-50%); color: #3b82f6; border-color: #3b82f6; }
        .hero-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 1;
          background: #0d0f13;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .hero-wrap img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .hero-q {
          position: absolute;
          top: 10px;
          left: 10px;
          z-index: 4;
        }
        .q-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 6px;
          background: rgba(0,0,0,0.72);
          color: #e5e7eb;
          font-variant-numeric: tabular-nums;
        }
        .q-badge.tier-high { background: rgba(22,163,74,0.88); color: #fff; }
        .q-badge.tier-mid { background: rgba(217,119,6,0.88); color: #fff; }
        .q-badge.tier-low { background: rgba(220,38,38,0.88); color: #fff; }
        .snap-toggle {
          position: absolute;
          bottom: 10px;
          right: 10px;
          background: rgba(0,0,0,0.7);
          color: #fff;
          border: 1px solid rgba(255,255,255,0.25);
          border-radius: 999px;
          padding: 5px 10px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
        }
        .card-body {
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .pred-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }
        .pred-title { font-size: 18px; font-weight: 700; }
        .score-pill {
          font-size: 12px;
          font-weight: 700;
          padding: 3px 9px;
          border-radius: 999px;
          font-variant-numeric: tabular-nums;
        }
        .tier-high { background: rgba(34,197,94,0.2); color: #4ade80; }
        .tier-mid { background: rgba(245,158,11,0.2); color: #fbbf24; }
        .tier-low { background: rgba(239,68,68,0.2); color: #f87171; }
        .tier-none { background: rgba(156,163,175,0.2); color: var(--t-muted); }
        .ref-strip {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .ref-imgs {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
        }
        .ref-item {
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          border: 2px solid transparent;
          cursor: pointer;
          background: #0d0f13;
          aspect-ratio: 1;
        }
        .ref-item.replace-selected {
          border-color: #f59e0b;
          box-shadow: 0 0 0 2px rgba(245,158,11,0.35);
        }
        .ref-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .ref-item .q-badge {
          position: absolute;
          bottom: 3px;
          right: 3px;
          font-size: 9px;
          padding: 1px 4px;
        }
        .replace-btn {
          width: 100%;
          background: linear-gradient(135deg, #d97706, #ea580c);
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
        }
        .replace-btn:hover { filter: brightness(1.08); }
        .actions {
          display: flex;
          gap: 12px;
          align-items: center;
          justify-content: center;
        }
        .act-btn {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: 2px solid var(--t-border);
          background: var(--t-surface);
          color: var(--primary-text-color, #fff);
          font-size: 22px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.12s ease;
        }
        .act-btn:hover { transform: scale(1.08); }
        .act-btn.small { width: 42px; height: 42px; font-size: 16px; }
        .act-btn.trash { border-color: rgba(239,68,68,0.5); color: #f87171; }
        .act-btn.confirm { border-color: rgba(34,197,94,0.6); color: #4ade80; }
        .act-btn.reassign { border-color: rgba(59,130,246,0.6); color: #60a5fa; }
        .kbd-hint { font-size: 11px; color: var(--t-muted); text-align: center; }
        .picker-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(5px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .picker {
          width: 100%;
          max-width: 420px;
          max-height: 84vh;
          background: var(--t-bg);
          border: 1px solid var(--t-border);
          border-radius: 20px;
          padding: 16px;
          box-shadow: 0 24px 56px rgba(0, 0, 0, 0.45);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .picker-hdr {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .picker-title-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .picker-thumb {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          object-fit: cover;
          background: #0d0f13;
          border: 1px solid var(--t-border);
        }
        .picker-close {
          background: var(--t-surface);
          color: var(--primary-text-color, #fff);
          border: 1px solid var(--t-border);
          border-radius: 999px;
          padding: 5px 11px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
        }
        .picker-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
          gap: 8px;
          max-height: 44vh;
          overflow-y: auto;
          padding-right: 2px;
        }
        .person-choice {
          background: var(--t-surface);
          border: 1px solid var(--t-border);
          border-radius: 12px;
          padding: 8px 6px;
          color: inherit;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          font-family: inherit;
          transition: transform 0.1s ease, border-color 0.1s ease;
        }
        .person-choice:hover {
          transform: translateY(-1px);
          border-color: #3b82f6;
        }
        .person-choice img {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          object-fit: cover;
        }
        .new-row { display: flex; gap: 6px; }
        input[type="text"], select {
          background: var(--t-surface);
          color: var(--primary-text-color, #fff);
          border: 1px solid var(--t-border);
          border-radius: 8px;
          padding: 6px 9px;
          font-size: 12px;
          font-family: inherit;
        }
        .btn {
          background: var(--t-surface);
          color: var(--primary-text-color, #fff);
          border: 1px solid var(--t-border);
          border-radius: 8px;
          padding: 6px 11px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
        }
        .btn.primary { background: #2563eb; border-color: #2563eb; color: #fff; }
        .btn.green { background: #16a34a; border-color: #16a34a; color: #fff; }
        .btn.danger { background: rgba(239,68,68,0.18); border-color: rgba(239,68,68,0.45); color: #fca5a5; }
        .group-card {
          background: var(--t-surface);
          border: 1px solid var(--t-border);
          border-radius: 14px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .tile-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
          gap: 8px;
        }
        .tile {
          position: relative;
          background: var(--t-bg);
          border: 2px solid transparent;
          border-radius: 10px;
          padding: 4px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .tile.selected { border-color: #3b82f6; }
        .tile img {
          width: 100%;
          aspect-ratio: 1;
          object-fit: cover;
          border-radius: 7px;
        }
        .empty {
          text-align: center;
          padding: 36px 16px;
          color: var(--t-muted);
          font-size: 14px;
        }
      </style>
      <ha-card>
        <div class="topbar">
          <div class="brand">
            <span class="pill-badge">Face Swipes</span>
            <span class="brand-sub">Frigate Face Trainer</span>
          </div>
          <div class="mode-tabs">
            <button class="mode-tab ${this._mode === 'swipe' ? 'active' : ''}" data-mode="swipe">Swipe (${this._deck.length})</button>
            <button class="mode-tab ${this._mode === 'groups' ? 'active' : ''}" data-mode="groups">Groups</button>
            <button class="mode-tab ${this._mode === 'library' ? 'active' : ''}" data-mode="library">Library (${people.length})</button>
          </div>
        </div>

        <div class="stats-bar">
          <div class="stat-pills">
            <span class="stat-pill">✓ ${this._stats.confirmed}</span>
            <span class="stat-pill">⇄ ${this._stats.replaced}</span>
            <span class="stat-pill">✎ ${this._stats.reassigned}</span>
            <span class="stat-pill">✕ ${this._stats.trashed}</span>
          </div>
          <div style="display:flex;gap:6px;align-items:center;">
            <select id="sort-sel">
              <option value="newest" ${this._sort === 'newest' ? 'selected' : ''}>Newest first</option>
              <option value="lowest" ${this._sort === 'lowest' ? 'selected' : ''}>Lowest score first</option>
              <option value="unknown_first" ${this._sort === 'unknown_first' ? 'selected' : ''}>Unknown first</option>
            </select>
            <button class="btn" id="btn-refresh">${this._loading ? '...' : 'Refresh'}</button>
          </div>
        </div>

        ${this._toast ? `
          <div class="toast">
            ${this._toast.thumbUrl ? `<img class="toast-thumb" src="${escapeHtml(this._toast.thumbUrl)}" alt="Last face" />` : ''}
            <span class="toast-tag">Last:</span>
            <span>${escapeHtml(typeof this._toast === 'string' ? this._toast : this._toast.text)}</span>
          </div>
        ` : ''}
        ${this._error ? `<div class="err">${escapeHtml(this._error)}</div>` : ''}

        ${this._mode === 'swipe' ? this.renderSwipeMode(top, next, people) : ''}
        ${this._mode === 'groups' ? this.renderGroupsMode(people) : ''}
        ${this._mode === 'library' ? this.renderLibraryMode(people) : ''}
      </ha-card>
    `;

    this.bindEvents(top);
  }

  renderSwipeMode(top, next, people) {
    if (!top) {
      return `
        <div class="empty">
          <strong>Queue is empty!</strong><br/>
          All pending faces in Frigate's train queue have been reviewed.
        </div>
      `;
    }
    const isUnknown = !top.predicted || top.predicted === 'unknown';
    const allRefs = !isUnknown && Array.isArray(this._faces?.[top.predicted])
      ? this._faces[top.predicted]
      : [];
    // Sort existing photos so weakest quality appears first for easy replacement
    const sortedRefs = [...allRefs].sort((a, b) => {
      const qa = this._qualityCache.get(`clips/faces/${top.predicted}/${a}`)?.score ?? 999;
      const qb = this._qualityCache.get(`clips/faces/${top.predicted}/${b}`)?.score ?? 999;
      return qa - qb;
    }).slice(0, 4);

    const weakest = !isUnknown ? this.getWeakestForPerson(top.predicted) : null;
    const replaceFile = this._replaceTarget || weakest?.filename || null;
    const replaceQ = replaceFile
      ? this._qualityCache.get(`clips/faces/${top.predicted}/${replaceFile}`)?.score
      : null;
    const candQ = this._qualityCache.get(`clips/faces/train/${top.filename}`)?.score;
    const tier = scoreTier(top.score);

    return `
      <div class="deck-stage">
        <div class="card-stack">
          ${next ? `
            <div class="swipe-card under">
              <div class="hero-wrap"><img data-auth-img="clips/faces/train/${escapeHtml(next.filename)}" alt="Next" /></div>
            </div>
          ` : ''}
          <div class="swipe-card" id="active-card">
            <div class="stamp confirm" id="stamp-confirm">CONFIRM</div>
            <div class="stamp trash" id="stamp-trash">TRASH</div>
            <div class="stamp reassign" id="stamp-reassign">REASSIGN</div>
            <div class="hero-wrap">
              ${!this._showSnapshot ? `<span class="q-badge hero-q ${candQ != null ? `tier-${qualityTier(candQ)}` : ''}" id="hero-q-badge">${candQ != null ? `Q:${candQ}` : 'Q:…'}</span>` : ''}
              ${this._showSnapshot && top.eventId
                ? `<img data-auth-img="api/events/${escapeHtml(top.eventId)}/snapshot.jpg?bbox=1" alt="Full snapshot" />`
                : `<img data-auth-img="clips/faces/train/${escapeHtml(top.filename)}" data-q-target="hero-q-badge" alt="Candidate face" />`}
              ${top.eventId ? `<button class="snap-toggle" id="btn-snap-toggle">${this._showSnapshot ? 'Show Face Crop' : 'Full Snapshot'}</button>` : ''}
            </div>
            <div class="card-body">
              <div class="pred-row">
                <span class="pred-title">${isUnknown ? 'Unknown Person' : `Is this ${escapeHtml(top.predicted)}?`}</span>
                <span class="score-pill tier-${tier}">${formatPct(top.score)}</span>
              </div>
              ${sortedRefs.length ? `
                <div class="ref-strip">
                  <span style="font-size:11px;color:var(--t-muted);">
                    Weakest / existing for ${escapeHtml(top.predicted)} (tap one to target replace):
                  </span>
                  <div class="ref-imgs">
                    ${sortedRefs.map((rf, idx) => {
                      const path = `clips/faces/${top.predicted}/${rf}`;
                      const rq = this._qualityCache.get(path)?.score;
                      const isTarget = replaceFile === rf;
                      return `
                        <div class="ref-item ${isTarget ? 'replace-selected' : ''}" data-pick-replace="${escapeHtml(rf)}" title="Click to select for replacement">
                          <img data-auth-img="${escapeHtml(path)}" data-q-target="ref-q-${idx}" alt="${escapeHtml(top.predicted)}" />
                          <span class="q-badge ${rq != null ? `tier-${qualityTier(rq)}` : ''}" id="ref-q-${idx}">${rq != null ? `Q:${rq}` : '…'}</span>
                        </div>
                      `;
                    }).join('')}
                  </div>
                  ${replaceFile ? `
                    <button class="replace-btn" id="btn-replace-weakest">
                      ⇄ Replace Selected (${replaceQ != null ? `Q:${replaceQ}` : 'weakest'} → ${candQ != null ? `Q:${candQ}` : 'new'})
                    </button>
                  ` : ''}
                </div>
              ` : `<div style="font-size:12px;color:var(--t-muted);">Swipe right or tap Confirm to label, or Trash if blurry/bad.</div>`}
            </div>
          </div>
        </div>

        <div class="actions">
          <button class="act-btn small" id="btn-undo" title="Undo skip (Z)">↺</button>
          <button class="act-btn trash" id="btn-trash" title="Trash bad crop (←)">✕</button>
          <button class="act-btn reassign" id="btn-reassign" title="Reassign person (↑)">✎</button>
          <button class="act-btn small" id="btn-skip" title="Skip for now (↓)">↷</button>
          <button class="act-btn confirm" id="btn-confirm" title="Confirm & Add (→)">✓</button>
        </div>
        <div class="kbd-hint">Swipe or keys: ← Trash · → Add · R Replace weakest · ↑ Reassign · ↓ Skip · Z Undo</div>

        ${this._showPicker ? `
          <div class="picker-backdrop" id="picker-backdrop">
            <div class="picker">
              <div class="picker-hdr">
                <div class="picker-title-wrap">
                  <img class="picker-thumb" data-auth-img="clips/faces/train/${escapeHtml(top.filename)}" alt="Candidate" />
                  <strong style="font-size:15px;">Who is this?</strong>
                </div>
                <button class="picker-close" id="picker-close">✕ Close</button>
              </div>
              <input type="text" id="picker-filter" placeholder="Filter people..." />
              <div class="picker-grid" id="picker-grid">
                ${people.map(p => {
                  const firstImg = this._faces[p]?.[0];
                  return `
                    <button class="person-choice" data-pick-person="${escapeHtml(p)}">
                      ${firstImg ? `<img data-auth-img="clips/faces/${escapeHtml(p)}/${escapeHtml(firstImg)}" alt="${escapeHtml(p)}" />` : `<div style="width:52px;height:52px;border-radius:50%;background:var(--t-bg);"></div>`}
                      <span>${escapeHtml(p)}</span>
                    </button>
                  `;
                }).join('')}
              </div>
              <div class="new-row">
                <input type="text" id="new-person-input" placeholder="New person name..." style="flex:1;" />
                <button class="btn primary" id="btn-new-person">Save</button>
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  renderGroupsMode(people) {
    const groups = new Map();
    for (const item of this._deck) {
      const key = item.predicted || 'unknown';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    }

    if (!groups.size) {
      return `<div class="empty">No pending training images to group.</div>`;
    }

    return `
      <div style="font-size:12px;color:var(--t-muted);">
        Tip: Select 1–3 clear, varied angles per person to confirm, and trash blurry/duplicate frames to avoid overfitting Frigate.
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
        <span style="font-size:12px;">Selected: <strong>${this._selectedGroupFiles.size}</strong></span>
        <select id="batch-target">
          <option value="">Assign selected to...</option>
          ${people.map(p => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join('')}
        </select>
        <button class="btn green" id="btn-batch-assign">Save Selected</button>
        <button class="btn danger" id="btn-batch-trash">Trash Selected</button>
      </div>
      ${Array.from(groups.entries()).map(([name, items]) => `
        <div class="group-card">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <strong>${name === 'unknown' ? 'Unknown Visitors' : `Predicted: ${escapeHtml(name)}`} (${items.length})</strong>
            <button class="btn" data-select-group="${escapeHtml(name)}">Select All</button>
          </div>
          <div class="tile-grid">
            ${items.slice(0, 24).map(it => {
              const sel = this._selectedGroupFiles.has(it.filename);
              return `
                <div class="tile ${sel ? 'selected' : ''}" data-toggle-file="${escapeHtml(it.filename)}">
                  <img data-auth-img="clips/faces/train/${escapeHtml(it.filename)}" alt="${escapeHtml(name)}" />
                  <span class="score-pill tier-${scoreTier(it.score)}" style="text-align:center;">${formatPct(it.score)}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `).join('')}
    `;
  }

  renderLibraryMode(people) {
    if (!people.length) {
      return `<div class="empty">No registered people found in Frigate.</div>`;
    }
    return people.map((person, pIdx) => {
      const files = this._faces[person] || [];
      return `
        <div class="group-card">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <strong>${escapeHtml(person)}</strong>
            <span style="font-size:12px;color:var(--t-muted);">${files.length} image${files.length === 1 ? '' : 's'}</span>
          </div>
          <div class="tile-grid">
            ${files.map((file, fIdx) => {
              const path = `clips/faces/${person}/${file}`;
              const q = this._qualityCache.get(path)?.score;
              const qId = `lib-q-${pIdx}-${fIdx}`;
              return `
                <div class="tile" style="cursor:default;">
                  <div style="position:relative;">
                    <img data-auth-img="${escapeHtml(path)}" data-q-target="${qId}" alt="${escapeHtml(person)}" />
                    <span class="q-badge ${q != null ? `tier-${qualityTier(q)}` : ''}" id="${qId}" style="position:absolute;bottom:4px;right:4px;">${q != null ? `Q:${q}` : '…'}</span>
                  </div>
                  <div style="display:flex;gap:4px;">
                    <select data-lib-move-from="${escapeHtml(person)}" data-lib-move-file="${escapeHtml(file)}" style="flex:1;min-width:0;padding:3px;">
                      <option value="">Move...</option>
                      ${people.filter(p => p !== person).map(p => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join('')}
                    </select>
                    <button class="btn danger" style="padding:3px 6px;" data-lib-del-person="${escapeHtml(person)}" data-lib-del-file="${escapeHtml(file)}">✕</button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  bindEvents(top) {
    const root = this.shadowRoot;

    root.querySelectorAll('img[data-auth-img]').forEach(img => {
      const badgeEl = img.dataset.qTarget ? root.getElementById(img.dataset.qTarget) : null;
      this.loadAuthImg(img, img.dataset.authImg, badgeEl);
    });

    root.querySelectorAll('.mode-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        this._mode = btn.dataset.mode;
        this.render();
      });
    });

    root.getElementById('sort-sel')?.addEventListener('change', (e) => {
      this._sort = e.target.value;
      this.rebuildDeck();
      this.render();
    });

    root.getElementById('btn-refresh')?.addEventListener('click', () => this.loadFaces());
    root.getElementById('btn-confirm')?.addEventListener('click', () => this.confirmCurrent());
    root.getElementById('btn-replace-weakest')?.addEventListener('click', () => this.replaceWeakestCurrent());
    root.getElementById('btn-trash')?.addEventListener('click', () => this.trashCurrent());
    root.getElementById('btn-skip')?.addEventListener('click', () => this.skipCurrent());
    root.getElementById('btn-undo')?.addEventListener('click', () => this.undoLast());
    root.getElementById('btn-reassign')?.addEventListener('click', () => {
      this._showPicker = !this._showPicker;
      this.render();
    });
    root.getElementById('btn-snap-toggle')?.addEventListener('click', () => {
      this._showSnapshot = !this._showSnapshot;
      this.render();
    });

    root.querySelectorAll('[data-pick-replace]').forEach(el => {
      el.addEventListener('click', () => {
        this._replaceTarget = el.dataset.pickReplace;
        this.render();
      });
    });

    root.getElementById('picker-close')?.addEventListener('click', () => {
      this._showPicker = false;
      this.render();
    });
    const pickerBackdrop = root.getElementById('picker-backdrop');
    if (pickerBackdrop) {
      pickerBackdrop.addEventListener('click', (e) => {
        if (e.target === pickerBackdrop) {
          this._showPicker = false;
          this.render();
        }
      });
    }
    root.getElementById('picker-filter')?.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      root.querySelectorAll('#picker-grid .person-choice').forEach(btn => {
        const name = (btn.dataset.pickPerson || '').toLowerCase();
        btn.style.display = !q || name.includes(q) ? '' : 'none';
      });
    });

    root.querySelectorAll('button[data-pick-person]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (top) this.classifyItem(top, btn.dataset.pickPerson, 'reassigned');
      });
    });

    const newPersonInput = root.getElementById('new-person-input');
    const submitNewPerson = () => {
      const val = newPersonInput?.value?.trim();
      if (val && top) this.classifyItem(top, val, 'reassigned');
    };
    root.getElementById('btn-new-person')?.addEventListener('click', submitNewPerson);
    newPersonInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitNewPerson();
      }
    });

    const activeCard = root.getElementById('active-card');
    if (activeCard && top) {
      let startX = 0;
      let startY = 0;
      let dragging = false;
      const stampC = root.getElementById('stamp-confirm');
      const stampT = root.getElementById('stamp-trash');
      const stampR = root.getElementById('stamp-reassign');

      activeCard.addEventListener('pointerdown', (e) => {
        if (e.target.closest('button') || e.target.closest('[data-pick-replace]')) return;
        dragging = true;
        startX = e.clientX;
        startY = e.clientY;
        activeCard.classList.add('dragging');
        activeCard.setPointerCapture(e.pointerId);
      });

      activeCard.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        activeCard.style.transform = `translate(${dx}px, ${dy}px) rotate(${dx * 0.05}deg)`;
        if (stampC) stampC.style.opacity = Math.max(0, Math.min(1, dx / 90));
        if (stampT) stampT.style.opacity = Math.max(0, Math.min(1, -dx / 90));
        if (stampR) stampR.style.opacity = Math.max(0, Math.min(1, -dy / 90));
      });

      const endDrag = (e) => {
        if (!dragging) return;
        dragging = false;
        activeCard.classList.remove('dragging');
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (dx > 85) {
          this.confirmCurrent();
        } else if (dx < -85) {
          this.trashCurrent();
        } else if (dy < -85) {
          activeCard.style.transform = '';
          if (stampC) stampC.style.opacity = 0;
          if (stampT) stampT.style.opacity = 0;
          if (stampR) stampR.style.opacity = 0;
          this._showPicker = true;
          this.render();
        } else {
          activeCard.style.transform = '';
          if (stampC) stampC.style.opacity = 0;
          if (stampT) stampT.style.opacity = 0;
          if (stampR) stampR.style.opacity = 0;
        }
      };
      activeCard.addEventListener('pointerup', endDrag);
      activeCard.addEventListener('pointercancel', endDrag);
    }

    root.querySelectorAll('.tile[data-toggle-file]').forEach(tile => {
      tile.addEventListener('click', () => {
        const f = tile.dataset.toggleFile;
        if (this._selectedGroupFiles.has(f)) this._selectedGroupFiles.delete(f);
        else this._selectedGroupFiles.add(f);
        this.render();
      });
    });

    root.querySelectorAll('button[data-select-group]').forEach(btn => {
      btn.addEventListener('click', () => {
        const grp = btn.dataset.selectGroup;
        this._deck.filter(i => (i.predicted || 'unknown') === grp).slice(0, 24).forEach(i => {
          this._selectedGroupFiles.add(i.filename);
        });
        this.render();
      });
    });

    root.getElementById('btn-batch-assign')?.addEventListener('click', () => {
      const target = root.getElementById('batch-target')?.value;
      if (target) this.batchAction('assign', target);
    });
    root.getElementById('btn-batch-trash')?.addEventListener('click', () => this.batchAction('trash'));

    root.querySelectorAll('button[data-lib-del-file]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.deleteLibraryFace(btn.dataset.libDelPerson, btn.dataset.libDelFile);
      });
    });
    root.querySelectorAll('select[data-lib-move-file]').forEach(sel => {
      sel.addEventListener('change', () => {
        if (sel.value) {
          this.reclassifyLibraryFace(sel.dataset.libMoveFrom, sel.dataset.libMoveFile, sel.value);
        }
      });
    });
  }

  getCardSize() { return 6; }
}

class FrigateFaceSwipesPanel extends HTMLElement {
  set hass(hass) {
    this._hass = hass;
    if (!this._initialized) {
      this._initialized = true;
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `
        <style>
          :host { display: block; padding: 16px; max-width: 960px; margin: 0 auto; }
          @media (max-width: 600px) { :host { padding: 6px; } }
        </style>
        <frigate-face-swipes-card id="card"></frigate-face-swipes-card>
      `;
      const card = this.shadowRoot.getElementById('card');
      card.setConfig({});
    }
    const card = this.shadowRoot.getElementById('card');
    if (card) card.hass = hass;
  }
}

customElements.define('frigate-face-swipes-card', FrigateFaceSwipesCard);
customElements.define('frigate-face-swipes-panel', FrigateFaceSwipesPanel);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'frigate-face-swipes-card',
  name: 'Frigate Face Swipes Card',
  description: 'Tinder & Google Photos-style face matching, quality scoring, and replacement tool for Frigate.',
  preview: true,
});
