import { LitElement, css, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { FrigateSwipesApi } from './api';
import './components/curate-view';
import './components/groups-view';
import type { FrigateSwipeView } from './components/swipe-view';
import './components/swipe-view';
import { parseTrainFilename } from './quality';
import { sharedStyles } from './styles';
import type {
  FaceSwipesConfig,
  FrigateFacesMap,
  HomeAssistant,
  SessionStats,
  SortOrder,
  ToastMessage,
  TrainCandidate,
  ViewMode,
} from './types';

@customElement('frigate-face-swipes-card')
export class FrigateFaceSwipesCard extends LitElement {
  static styles = [
    sharedStyles,
    css`
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
      .stat-pills {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
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
      @media (max-width: 600px) {
        ha-card {
          padding: 10px;
          gap: 8px;
          border-radius: 14px;
        }
        .brand {
          font-size: 14px;
        }
        .brand-sub {
          display: none;
        }
        .mode-tab {
          padding: 5px 9px;
          font-size: 11px;
        }
        .stats-bar {
          gap: 6px;
          font-size: 11px;
        }
        .stat-pill {
          padding: 2px 7px;
        }
      }
    `,
  ];

  @property({ attribute: false }) hass?: HomeAssistant;

  @state() private config: FaceSwipesConfig = { entry_id: 'default', sort: 'newest' };
  @state() private faces: FrigateFacesMap = {};
  @state() private deck: TrainCandidate[] = [];
  @state() private mode: ViewMode = 'swipe';
  @state() private sort: SortOrder = 'newest';
  @state() private loading = false;
  @state() private error = '';
  @state() private toast: ToastMessage | null = null;
  @state() private stats: SessionStats = { confirmed: 0, reassigned: 0, pruned: 0, trashed: 0, skipped: 0 };

  @query('frigate-swipe-view') private swipeView?: FrigateSwipeView;

  private api?: FrigateSwipesApi;
  private history: TrainCandidate[] = [];
  private keyHandler = (e: KeyboardEvent) => this.handleKeyDown(e);

  static getStubConfig(): FaceSwipesConfig {
    return { entry_id: 'default', sort: 'newest' };
  }

  setConfig(config: FaceSwipesConfig) {
    this.config = { entry_id: 'default', sort: 'newest', ...config };
    this.sort = this.config.sort || 'newest';
    if (this.api) {
      this.api.entryId = this.config.entry_id || 'default';
    }
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('hass') && this.hass) {
      const first = !this.api;
      if (!this.api) {
        this.api = new FrigateSwipesApi(this.hass, this.config.entry_id || 'default');
      } else {
        this.api.hass = this.hass;
      }
      if (first) void this.loadFaces();
    }
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('keydown', this.keyHandler);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('keydown', this.keyHandler);
  }

  private getPeople(): string[] {
    return Object.keys(this.faces)
      .filter((k) => k !== 'train')
      .sort((a, b) => a.localeCompare(b));
  }

  private makeToast(text: string, trainFilename?: string): ToastMessage {
    const thumbUrl = trainFilename && this.api ? this.api.getCachedUrl(`clips/faces/train/${trainFilename}`) : null;
    return { text, thumbUrl };
  }

  private async loadFaces() {
    if (!this.api) return;
    this.loading = true;
    this.error = '';
    try {
      const data = await this.api.getFaces();
      this.faces = data && typeof data === 'object' ? data : {};
      this.rebuildDeck();
    } catch (err) {
      this.error = err instanceof Error ? err.message : String(err);
    }
    this.loading = false;
  }

  private rebuildDeck() {
    const list = Array.isArray(this.faces.train) ? this.faces.train : [];
    const items = list.map(parseTrainFilename);
    if (this.sort === 'lowest') {
      items.sort((a, b) => (a.score ?? -1) - (b.score ?? -1));
    } else if (this.sort === 'unknown_first') {
      items.sort((a, b) => {
        const au = a.predicted === 'unknown' ? 0 : 1;
        const bu = b.predicted === 'unknown' ? 0 : 1;
        return au !== bu ? au - bu : b.ts - a.ts;
      });
    } else {
      items.sort((a, b) => b.ts - a.ts);
    }
    this.deck = items;
  }

  private async handleConfirm() {
    const top = this.deck[0];
    if (!top) return;
    if (!top.predicted || top.predicted === 'unknown') {
      this.swipeView?.togglePicker();
      return;
    }
    await this.classify(top, top.predicted, 'confirmed');
  }

  private async classify(item: TrainCandidate, person: string, statKey: 'confirmed' | 'reassigned') {
    if (!this.api || !person.trim()) return;
    this.deck = this.deck.slice(1);
    try {
      await this.api.classifyTrainFile(person, item.filename);
      this.stats = { ...this.stats, [statKey]: this.stats[statKey] + 1 };
      const nextTrain = (this.faces.train || []).filter((f) => f !== item.filename);
      const nextPerson = this.faces[person] ? [...this.faces[person]!] : [];
      this.faces = { ...this.faces, train: nextTrain, [person]: nextPerson };
      this.toast = this.makeToast(`Saved to "${person}"`, item.filename);
    } catch (err) {
      this.deck = [item, ...this.deck];
      this.toast = this.makeToast(`Error: ${err instanceof Error ? err.message : String(err)}`, item.filename);
    }
  }

  private async handleTrash() {
    const top = this.deck[0];
    if (!top || !this.api) return;
    this.deck = this.deck.slice(1);
    try {
      await this.api.deleteFaces('train', [top.filename]);
      this.stats = { ...this.stats, trashed: this.stats.trashed + 1 };
      this.faces = { ...this.faces, train: (this.faces.train || []).filter((f) => f !== top.filename) };
      this.toast = this.makeToast('Trashed bad crop', top.filename);
    } catch (err) {
      this.deck = [top, ...this.deck];
      this.toast = this.makeToast(`Delete error: ${err instanceof Error ? err.message : String(err)}`, top.filename);
    }
  }

  private handleSkip() {
    const top = this.deck[0];
    if (!top) return;
    this.deck = [...this.deck.slice(1), top];
    this.history.push(top);
    this.stats = { ...this.stats, skipped: this.stats.skipped + 1 };
    this.toast = this.makeToast('Skipped for later', top.filename);
  }

  private handleUndo() {
    const last = this.history.pop();
    if (!last) {
      this.toast = this.makeToast('Nothing to undo (only Skips can be undone)');
      return;
    }
    this.deck = [last, ...this.deck.filter((x) => x.filename !== last.filename)];
    this.stats = { ...this.stats, skipped: Math.max(0, this.stats.skipped - 1) };
    this.toast = this.makeToast('Restored skipped face', last.filename);
  }

  private async handleBatch(detail: { action: 'assign' | 'trash'; files: string[]; targetName: string }) {
    if (!this.api) return;
    const { action, files, targetName } = detail;
    this.toast = this.makeToast(`${action === 'trash' ? 'Deleting' : 'Saving'} ${files.length} face(s)...`);
    try {
      if (action === 'trash') {
        await this.api.deleteFaces('train', files);
        this.stats = { ...this.stats, trashed: this.stats.trashed + files.length };
      } else {
        for (const f of files) {
          await this.api.classifyTrainFile(targetName, f);
        }
        this.stats = { ...this.stats, confirmed: this.stats.confirmed + files.length };
      }
      await this.loadFaces();
      this.toast = this.makeToast(`Updated ${files.length} face(s)`);
    } catch (err) {
      this.toast = this.makeToast(`Batch error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private async handlePrune(detail: { person: string; ids: string[] }) {
    if (!this.api) return;
    const { person, ids } = detail;
    this.toast = this.makeToast(`Pruning ${ids.length} photo(s) from "${person}"...`);
    try {
      await this.api.deleteFaces(person, ids);
      this.stats = { ...this.stats, pruned: this.stats.pruned + ids.length };
      const idSet = new Set(ids);
      const remaining = (this.faces[person] || []).filter((f) => !idSet.has(f));
      this.faces = { ...this.faces, [person]: remaining };
      this.toast = this.makeToast(`Kept ${remaining.length} best diverse photos for "${person}"`);
    } catch (err) {
      this.toast = this.makeToast(`Prune error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private async handleMove(detail: { fromPerson: string; file: string; toPerson: string }) {
    if (!this.api) return;
    const { fromPerson, file, toPerson } = detail;
    try {
      await this.api.reclassifyFace(fromPerson, file, toPerson);
      this.toast = this.makeToast(`Moved ${file} to "${toPerson}"`);
      await this.loadFaces();
    } catch (err) {
      this.toast = this.makeToast(`Move error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (this.mode !== 'swipe' || !this.deck.length) return;
    if (e.key === 'Escape' && this.swipeView?.isPickerOpen) {
      e.preventDefault();
      this.swipeView.closePicker();
      return;
    }
    const active = this.shadowRoot?.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'SELECT')) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      void this.handleConfirm();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      void this.handleTrash();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.swipeView?.togglePicker();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.handleSkip();
    } else if (e.key.toLowerCase() === 'z') {
      e.preventDefault();
      this.handleUndo();
    }
  }

  getCardSize() {
    return 6;
  }

  render() {
    const people = this.getPeople();
    return html`
      <ha-card>
        <div class="topbar">
          <div class="brand">
            <span class="pill-badge">Face Swipes</span>
            <span class="brand-sub">Frigate Face Trainer</span>
          </div>
          <div class="mode-tabs">
            <button class="mode-tab ${this.mode === 'swipe' ? 'active' : ''}" @click=${() => (this.mode = 'swipe')}>
              Swipe (${this.deck.length})
            </button>
            <button class="mode-tab ${this.mode === 'curate' ? 'active' : ''}" @click=${() => (this.mode = 'curate')}>
              Curate (${people.length})
            </button>
            <button class="mode-tab ${this.mode === 'groups' ? 'active' : ''}" @click=${() => (this.mode = 'groups')}>
              Groups
            </button>
          </div>
        </div>

        <div class="stats-bar">
          <div class="stat-pills">
            <span class="stat-pill">✓ ${this.stats.confirmed}</span>
            <span class="stat-pill">✎ ${this.stats.reassigned}</span>
            <span class="stat-pill">✂ ${this.stats.pruned}</span>
            <span class="stat-pill">✕ ${this.stats.trashed}</span>
          </div>
          <div style="display:flex;gap:6px;align-items:center;">
            <select
              .value=${this.sort}
              @change=${(e: Event) => {
                this.sort = (e.target as HTMLSelectElement).value as SortOrder;
                this.rebuildDeck();
              }}
            >
              <option value="newest">Newest first</option>
              <option value="lowest">Lowest score first</option>
              <option value="unknown_first">Unknown first</option>
            </select>
            <button class="btn" @click=${() => this.loadFaces()}>${this.loading ? '...' : 'Refresh'}</button>
          </div>
        </div>

        ${this.toast
          ? html`
              <div class="toast">
                ${this.toast.thumbUrl
                  ? html`<img class="toast-thumb" src=${this.toast.thumbUrl} alt="Last face" />`
                  : ''}
                <span class="toast-tag">Last:</span>
                <span>${this.toast.text}</span>
              </div>
            `
          : ''}
        ${this.error ? html`<div class="err">${this.error}</div>` : ''}

        ${this.mode === 'swipe'
          ? html`<frigate-swipe-view
              .api=${this.api}
              .deck=${this.deck}
              .faces=${this.faces}
              .people=${people}
              @confirm=${() => this.handleConfirm()}
              @assign=${(e: CustomEvent<string>) => {
                const top = this.deck[0];
                if (top) void this.classify(top, e.detail, 'reassigned');
              }}
              @trash=${() => this.handleTrash()}
              @skip=${() => this.handleSkip()}
              @undo=${() => this.handleUndo()}
            ></frigate-swipe-view>`
          : ''}

        ${this.mode === 'curate'
          ? html`<frigate-curate-view
              .api=${this.api}
              .faces=${this.faces}
              .people=${people}
              @prune=${(e: CustomEvent<{ person: string; ids: string[] }>) => this.handlePrune(e.detail)}
              @move=${(e: CustomEvent<{ fromPerson: string; file: string; toPerson: string }>) =>
                this.handleMove(e.detail)}
            ></frigate-curate-view>`
          : ''}

        ${this.mode === 'groups'
          ? html`<frigate-groups-view
              .api=${this.api}
              .deck=${this.deck}
              .people=${people}
              @batch=${(e: CustomEvent<{ action: 'assign' | 'trash'; files: string[]; targetName: string }>) =>
                this.handleBatch(e.detail)}
            ></frigate-groups-view>`
          : ''}
      </ha-card>
    `;
  }
}

@customElement('frigate-face-swipes-panel')
export class FrigateFaceSwipesPanel extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 16px;
      max-width: 960px;
      margin: 0 auto;
    }
    @media (max-width: 600px) {
      :host {
        padding: 6px;
      }
    }
  `;

  @property({ attribute: false }) hass?: HomeAssistant;

  render() {
    return html`<frigate-face-swipes-card .hass=${this.hass}></frigate-face-swipes-card>`;
  }
}

declare global {
  interface Window {
    customCards?: Array<{ type: string; name: string; description: string; preview?: boolean }>;
  }
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'frigate-face-swipes-card',
  name: 'Frigate Face Swipes Card',
  description: 'Tinder & Google Photos-style face assignment and diverse Best-N curation tool for Frigate.',
  preview: true,
});
