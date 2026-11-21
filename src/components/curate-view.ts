import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { FrigateSwipesApi } from '../api';
import { qualityTier, selectDiverseBestN } from '../quality';
import { sharedStyles } from '../styles';
import type { FrigateFacesMap } from '../types';
import './auth-img';

@customElement('frigate-curate-view')
export class FrigateCurateView extends LitElement {
  static styles = [
    sharedStyles,
    css`
      .curate-bar {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        justify-content: space-between;
        background: var(--t-surface);
        border: 1px solid var(--t-border);
        border-radius: 12px;
        padding: 10px;
      }
      .controls {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
      }
      .img-wrap {
        position: relative;
        width: 100%;
        aspect-ratio: 1;
        border-radius: 7px;
        overflow: hidden;
      }
      .q-pos {
        position: absolute;
        bottom: 4px;
        right: 4px;
      }
      .status-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 4px;
      }
      .curate-badge {
        font-size: 10px;
        font-weight: 800;
        padding: 2px 6px;
        border-radius: 5px;
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }
      .curate-badge.keep {
        background: rgba(34, 197, 94, 0.2);
        color: #4ade80;
      }
      .curate-badge.prune {
        background: rgba(239, 68, 68, 0.2);
        color: #f87171;
      }
      .hint {
        font-size: 12px;
        color: var(--t-muted);
      }
    `,
  ];

  @property({ attribute: false }) api?: FrigateSwipesApi;
  @property({ attribute: false }) faces: FrigateFacesMap = {};
  @property({ type: Array }) people: string[] = [];

  @state() private selectedPerson = '';
  @state() private keepN = 8;
  @state() private keepSet = new Set<string>();
  @state() private reasons = new Map<string, string>();
  @state() private analyzing = false;

  private lastAnalyzedKey = '';

  updated(changed: Map<string, unknown>) {
    if (changed.has('people') || changed.has('faces')) {
      if (!this.selectedPerson || !this.people.includes(this.selectedPerson)) {
        const sorted = [...this.people].sort(
          (a, b) => (this.faces[b]?.length || 0) - (this.faces[a]?.length || 0)
        );
        this.selectedPerson = sorted[0] || '';
      }
      const files = this.faces[this.selectedPerson] || [];
      const key = `${this.selectedPerson}:${this.keepN}:${files.length}`;
      if (this.selectedPerson && key !== this.lastAnalyzedKey) {
        this.lastAnalyzedKey = key;
        void this.autoPick();
      }
    }
  }

  async autoPick() {
    if (!this.api || !this.selectedPerson) return;
    const files = this.faces[this.selectedPerson] || [];
    if (!files.length) {
      this.keepSet = new Set();
      this.reasons = new Map();
      return;
    }
    this.analyzing = true;
    await Promise.all(files.map((f) => this.api!.fetchMedia(`clips/faces/${this.selectedPerson}/${f}`)));
    const items = files.map((f) => ({
      filename: f,
      quality: this.api!.getCachedQuality(`clips/faces/${this.selectedPerson}/${f}`),
    }));
    const res = selectDiverseBestN(items, this.keepN);
    this.keepSet = res.keepSet;
    this.reasons = res.reasons;
    this.analyzing = false;
  }

  private toggleTile(file: string) {
    const next = new Set(this.keepSet);
    if (next.has(file)) next.delete(file);
    else next.add(file);
    this.keepSet = next;
  }

  private emitPrune() {
    const files = this.faces[this.selectedPerson] || [];
    const ids = files.filter((f) => !this.keepSet.has(f));
    if (!ids.length) return;
    this.dispatchEvent(
      new CustomEvent('prune', {
        detail: { person: this.selectedPerson, ids },
        bubbles: true,
        composed: true,
      })
    );
  }

  private emitMove(file: string, toPerson: string) {
    if (!toPerson || toPerson === this.selectedPerson) return;
    this.dispatchEvent(
      new CustomEvent('move', {
        detail: { fromPerson: this.selectedPerson, file, toPerson },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    if (!this.people.length) {
      return html`<div class="empty">No registered people found in Frigate.</div>`;
    }

    const person = this.people.includes(this.selectedPerson) ? this.selectedPerson : this.people[0];
    const files = this.faces[person] || [];
    const hasPlan = this.keepSet.size > 0 || files.length === 0;
    const keptCount = files.filter((f) => this.keepSet.has(f)).length;
    const pruneCount = hasPlan ? Math.max(0, files.length - keptCount) : 0;

    const ordered = [...files].sort((a, b) => {
      if (hasPlan) {
        const ak = this.keepSet.has(a) ? 0 : 1;
        const bk = this.keepSet.has(b) ? 0 : 1;
        if (ak !== bk) return ak - bk;
      }
      const qa = this.api?.getCachedQuality(`clips/faces/${person}/${a}`)?.score ?? 0;
      const qb = this.api?.getCachedQuality(`clips/faces/${person}/${b}`)?.score ?? 0;
      return qb - qa;
    });

    return html`
      <div style="display:flex;flex-direction:column;gap:10px;">
        <div class="curate-bar">
          <div class="controls">
            <select
              .value=${person}
              @change=${(e: Event) => {
                this.selectedPerson = (e.target as HTMLSelectElement).value;
                this.lastAnalyzedKey = '';
                void this.autoPick();
              }}
            >
              ${this.people.map(
                (p) => html`<option value=${p} ?selected=${p === person}>
                  ${p} (${(this.faces[p] || []).length})
                </option>`
              )}
            </select>

            <label style="font-size:12px;display:flex;align-items:center;gap:5px;">
              Keep best:
              <select
                .value=${String(this.keepN)}
                @change=${(e: Event) => {
                  this.keepN = Number((e.target as HTMLSelectElement).value) || 8;
                  void this.autoPick();
                }}
              >
                ${[3, 5, 8, 10, 12, 15, 20].map(
                  (n) => html`<option value=${String(n)} ?selected=${this.keepN === n}>${n}</option>`
                )}
              </select>
            </label>

            <button class="btn primary" @click=${() => this.autoPick()}>
              ${this.analyzing ? 'Analyzing…' : 'Auto-Pick Diverse'}
            </button>
          </div>

          ${pruneCount > 0
            ? html`<button class="btn danger" @click=${() => this.emitPrune()}>
                ✂ Prune ${pruneCount} Unkept
              </button>`
            : ''}
        </div>

        <div class="hint">
          Picks the sharpest, best-lit <strong>${this.keepN}</strong> shots while penalizing near-duplicates. Tap any tile to toggle Keep/Prune.
        </div>

        ${files.length === 0
          ? html`<div class="empty">No photos registered for ${person}.</div>`
          : html`
              <div class="tile-grid">
                ${ordered.map((file) => {
                  const path = `clips/faces/${person}/${file}`;
                  const q = this.api?.getCachedQuality(path)?.score;
                  const isKeep = !hasPlan || this.keepSet.has(file);
                  const reason = this.reasons.get(file) || '';
                  return html`
                    <div
                      class="tile ${hasPlan ? (isKeep ? 'keep' : 'prune') : ''}"
                      @click=${(e: Event) => {
                        if ((e.target as HTMLElement).closest('select')) return;
                        this.toggleTile(file);
                      }}
                    >
                      <div class="img-wrap">
                        <frigate-auth-img .api=${this.api} path=${path} alt=${person}></frigate-auth-img>
                        <span class="q-badge q-pos tier-${qualityTier(q)}">
                          ${q != null ? `Q:${q}` : '…'}
                        </span>
                      </div>
                      <div class="status-row">
                        <span class="curate-badge ${isKeep ? 'keep' : 'prune'}">
                          ${isKeep ? 'Keep' : 'Prune'}
                        </span>
                        <span style="font-size:10px;color:var(--t-muted);">${reason}</span>
                      </div>
                      <select
                        style="width:100%;padding:3px;font-size:11px;"
                        @change=${(e: Event) => {
                          const sel = e.target as HTMLSelectElement;
                          if (sel.value) {
                            this.emitMove(file, sel.value);
                            sel.value = '';
                          }
                        }}
                      >
                        <option value="">Move to...</option>
                        ${this.people
                          .filter((p) => p !== person)
                          .map((p) => html`<option value=${p}>${p}</option>`)}
                      </select>
                    </div>
                  `;
                })}
              </div>
            `}
      </div>
    `;
  }
}
