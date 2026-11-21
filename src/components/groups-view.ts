import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { FrigateSwipesApi } from '../api';
import { formatPct, scoreTier } from '../quality';
import { sharedStyles } from '../styles';
import type { TrainCandidate } from '../types';
import './auth-img';

@customElement('frigate-groups-view')
export class FrigateGroupsView extends LitElement {
  static styles = [
    sharedStyles,
    css`
      .toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }
      .group-card {
        background: var(--t-surface);
        border: 1px solid var(--t-border);
        border-radius: 14px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .group-hdr {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .img-box {
        width: 100%;
        aspect-ratio: 1;
        border-radius: 7px;
        overflow: hidden;
      }
    `,
  ];

  @property({ attribute: false }) api?: FrigateSwipesApi;
  @property({ attribute: false }) deck: TrainCandidate[] = [];
  @property({ type: Array }) people: string[] = [];

  @state() private selected = new Set<string>();
  @state() private batchTarget = '';

  private toggle(filename: string) {
    const next = new Set(this.selected);
    if (next.has(filename)) next.delete(filename);
    else next.add(filename);
    this.selected = next;
  }

  private selectGroup(items: TrainCandidate[]) {
    const next = new Set(this.selected);
    items.slice(0, 24).forEach((i) => next.add(i.filename));
    this.selected = next;
  }

  private emitBatch(action: 'assign' | 'trash') {
    const files = Array.from(this.selected);
    if (!files.length) return;
    if (action === 'assign' && !this.batchTarget) return;
    this.dispatchEvent(
      new CustomEvent('batch', {
        detail: { action, files, targetName: this.batchTarget },
        bubbles: true,
        composed: true,
      })
    );
    this.selected = new Set();
  }

  render() {
    const groups = new Map<string, TrainCandidate[]>();
    for (const item of this.deck) {
      const key = item.predicted || 'unknown';
      const arr = groups.get(key) || [];
      arr.push(item);
      groups.set(key, arr);
    }

    if (!groups.size) {
      return html`<div class="empty">No pending training images to group.</div>`;
    }

    return html`
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div style="font-size:12px;color:var(--t-muted);">
          Tip: Select 1–3 clear, varied angles per person to confirm, and trash blurry/duplicate frames to avoid overfitting Frigate.
        </div>

        <div class="toolbar">
          <span style="font-size:12px;">Selected: <strong>${this.selected.size}</strong></span>
          <select
            .value=${this.batchTarget}
            @change=${(e: Event) => {
              this.batchTarget = (e.target as HTMLSelectElement).value;
            }}
          >
            <option value="">Assign selected to...</option>
            ${this.people.map((p) => html`<option value=${p}>${p}</option>`)}
          </select>
          <button class="btn green" @click=${() => this.emitBatch('assign')}>Save Selected</button>
          <button class="btn danger" @click=${() => this.emitBatch('trash')}>Trash Selected</button>
        </div>

        ${Array.from(groups.entries()).map(
          ([name, items]) => html`
            <div class="group-card">
              <div class="group-hdr">
                <strong>
                  ${name === 'unknown' ? 'Unknown Visitors' : `Predicted: ${name}`} (${items.length})
                </strong>
                <button class="btn" @click=${() => this.selectGroup(items)}>Select All</button>
              </div>
              <div class="tile-grid">
                ${items.slice(0, 24).map((it) => {
                  const sel = this.selected.has(it.filename);
                  return html`
                    <div
                      class="tile ${sel ? 'selected' : ''}"
                      @click=${() => this.toggle(it.filename)}
                    >
                      <div class="img-box">
                        <frigate-auth-img
                          .api=${this.api}
                          path=${`clips/faces/train/${it.filename}`}
                          alt=${name}
                        ></frigate-auth-img>
                      </div>
                      <span class="score-pill tier-${scoreTier(it.score)}" style="text-align:center;">
                        ${formatPct(it.score)}
                      </span>
                    </div>
                  `;
                })}
              </div>
            </div>
          `
        )}
      </div>
    `;
  }
}
