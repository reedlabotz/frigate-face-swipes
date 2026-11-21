import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { FrigateSwipesApi } from '../api';
import { formatPct, qualityTier, scoreTier } from '../quality';
import { sharedStyles } from '../styles';
import type { FaceQuality, FrigateFacesMap, TrainCandidate } from '../types';
import './auth-img';
import './reassign-modal';

@customElement('frigate-swipe-view')
export class FrigateSwipeView extends LitElement {
  static styles = [
    sharedStyles,
    css`
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
      .swipe-card {
        position: relative;
        width: 100%;
        background: var(--t-surface);
        border: 1px solid var(--t-border);
        border-radius: 22px;
        overflow: hidden;
        box-shadow: 0 16px 36px rgba(0, 0, 0, 0.32);
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
      .swipe-card.dragging {
        transition: none;
      }
      .stamp {
        position: absolute;
        top: 22px;
        padding: 6px 14px;
        border-radius: 10px;
        font-size: 20px;
        font-weight: 900;
        letter-spacing: 0.08em;
        border: 4px solid;
        pointer-events: none;
        z-index: 5;
      }
      .stamp.confirm {
        left: 18px;
        color: #22c55e;
        border-color: #22c55e;
        transform: rotate(-12deg);
      }
      .stamp.trash {
        right: 18px;
        color: #ef4444;
        border-color: #ef4444;
        transform: rotate(12deg);
      }
      .stamp.reassign {
        left: 50%;
        transform: translateX(-50%);
        color: #3b82f6;
        border-color: #3b82f6;
      }
      .hero-wrap {
        position: relative;
        width: 100%;
        aspect-ratio: 1;
        background: #0d0f13;
        --img-fit: contain;
      }
      .hero-q {
        position: absolute;
        top: 10px;
        left: 10px;
        z-index: 4;
      }
      .snap-toggle {
        position: absolute;
        bottom: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.7);
        color: #fff;
        border: 1px solid rgba(255, 255, 255, 0.25);
        border-radius: 999px;
        padding: 5px 10px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
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
      .pred-title {
        font-size: 18px;
        font-weight: 700;
      }
      .quick-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .quick-pill {
        background: var(--t-bg);
        color: inherit;
        border: 1px solid var(--t-border);
        border-radius: 999px;
        padding: 5px 10px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
      }
      .quick-pill:hover {
        border-color: #3b82f6;
      }
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
      .act-btn:hover {
        transform: scale(1.08);
      }
      .act-btn.small {
        width: 42px;
        height: 42px;
        font-size: 16px;
      }
      .act-btn.trash {
        border-color: rgba(239, 68, 68, 0.5);
        color: #f87171;
      }
      .act-btn.confirm {
        border-color: rgba(34, 197, 94, 0.6);
        color: #4ade80;
      }
      .act-btn.reassign {
        border-color: rgba(59, 130, 246, 0.6);
        color: #60a5fa;
      }
      .kbd-hint {
        font-size: 11px;
        color: var(--t-muted);
        text-align: center;
      }
      @media (max-width: 600px), (hover: none) {
        .kbd-hint {
          display: none;
        }
      }
      @media (max-width: 600px) {
        .hero-wrap {
          aspect-ratio: auto;
          height: min(290px, 34vh);
        }
        .card-body {
          padding: 10px;
          gap: 7px;
        }
        .pred-title {
          font-size: 16px;
        }
        .actions {
          gap: 10px;
        }
        .act-btn {
          width: 50px;
          height: 50px;
          font-size: 20px;
        }
        .act-btn.small {
          width: 38px;
          height: 38px;
          font-size: 15px;
        }
      }
    `,
  ];

  @property({ attribute: false }) api?: FrigateSwipesApi;
  @property({ attribute: false }) deck: TrainCandidate[] = [];
  @property({ attribute: false }) faces: FrigateFacesMap = {};
  @property({ type: Array }) people: string[] = [];

  @state() private showSnapshot = false;
  @state() private showPicker = false;
  @state() private dragDx = 0;
  @state() private dragDy = 0;
  @state() private dragging = false;
  @state() private candQuality: FaceQuality | null = null;

  private startX = 0;
  private startY = 0;
  private lastTopFile = '';

  updated() {
    const topFile = this.deck[0]?.filename ?? '';
    if (topFile !== this.lastTopFile) {
      this.lastTopFile = topFile;
      this.showSnapshot = false;
      this.showPicker = false;
      this.dragDx = 0;
      this.dragDy = 0;
      this.dragging = false;
      this.candQuality = topFile
        ? this.api?.getCachedQuality(`clips/faces/train/${topFile}`) ?? null
        : null;
    }
  }

  togglePicker() {
    this.showPicker = !this.showPicker;
  }

  closePicker() {
    this.showPicker = false;
  }

  get isPickerOpen() {
    return this.showPicker;
  }

  private emit(name: string, detail?: unknown) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  private onPointerDown(e: PointerEvent) {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    this.dragging = true;
    this.startX = e.clientX;
    this.startY = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  private onPointerMove(e: PointerEvent) {
    if (!this.dragging) return;
    this.dragDx = e.clientX - this.startX;
    this.dragDy = e.clientY - this.startY;
  }

  private onPointerUp() {
    if (!this.dragging) return;
    const dx = this.dragDx;
    const dy = this.dragDy;
    this.dragging = false;
    this.dragDx = 0;
    this.dragDy = 0;

    if (dx > 85) this.emit('confirm');
    else if (dx < -85) this.emit('trash');
    else if (dy < -85) this.showPicker = true;
  }

  render() {
    const top = this.deck[0];
    const next = this.deck[1];

    if (!top) {
      return html`
        <div class="empty">
          <strong>Assign queue is empty!</strong><br />
          Switch to <strong>Curate</strong> to pick the best diverse shots for each person.
        </div>
      `;
    }

    const isUnknown = !top.predicted || top.predicted === 'unknown';
    const tier = scoreTier(top.score);
    const quickPeople = this.people.filter((p) => p !== top.predicted).slice(0, 5);
    const confirmOpacity = Math.max(0, Math.min(1, this.dragDx / 90));
    const trashOpacity = Math.max(0, Math.min(1, -this.dragDx / 90));
    const reassignOpacity = Math.max(0, Math.min(1, -this.dragDy / 90));
    const cardTransform = this.dragging
      ? `translate(${this.dragDx}px, ${this.dragDy}px) rotate(${this.dragDx * 0.05}deg)`
      : '';

    const imgPath =
      this.showSnapshot && top.eventId
        ? `api/events/${top.eventId}/snapshot.jpg?bbox=1`
        : `clips/faces/train/${top.filename}`;

    return html`
      <div class="deck-stage">
        <div class="card-stack">
          ${next
            ? html`
                <div class="swipe-card under">
                  <div class="hero-wrap">
                    <frigate-auth-img
                      .api=${this.api}
                      path=${`clips/faces/train/${next.filename}`}
                      alt="Next"
                    ></frigate-auth-img>
                  </div>
                </div>
              `
            : ''}

          <div
            class="swipe-card ${this.dragging ? 'dragging' : ''}"
            style="transform:${cardTransform}"
            @pointerdown=${(e: PointerEvent) => this.onPointerDown(e)}
            @pointermove=${(e: PointerEvent) => this.onPointerMove(e)}
            @pointerup=${() => this.onPointerUp()}
            @pointercancel=${() => this.onPointerUp()}
          >
            <div class="stamp confirm" style="opacity:${confirmOpacity}">CONFIRM</div>
            <div class="stamp trash" style="opacity:${trashOpacity}">TRASH</div>
            <div class="stamp reassign" style="opacity:${reassignOpacity}">WHO?</div>

            <div class="hero-wrap">
              ${!this.showSnapshot
                ? html`<span class="q-badge hero-q tier-${qualityTier(this.candQuality?.score)}">
                    ${this.candQuality ? `Q:${this.candQuality.score}` : 'Q:…'}
                  </span>`
                : ''}
              <frigate-auth-img
                .api=${this.api}
                path=${imgPath}
                alt="Candidate face"
                @quality=${(e: CustomEvent<FaceQuality>) => {
                  this.candQuality = e.detail;
                }}
              ></frigate-auth-img>
              ${top.eventId
                ? html`<button
                    class="snap-toggle"
                    @click=${() => {
                      this.showSnapshot = !this.showSnapshot;
                    }}
                  >
                    ${this.showSnapshot ? 'Show Face Crop' : 'Full Snapshot'}
                  </button>`
                : ''}
            </div>

            <div class="card-body">
              <div class="pred-row">
                <span class="pred-title">${isUnknown ? 'Who is this?' : `Is this ${top.predicted}?`}</span>
                <span class="score-pill tier-${tier}">${formatPct(top.score)}</span>
              </div>
              ${quickPeople.length
                ? html`
                    <div class="quick-pills">
                      ${quickPeople.map(
                        (p) =>
                          html`<button class="quick-pill" @click=${() => this.emit('assign', p)}>
                            ${p}
                          </button>`
                      )}
                      <button
                        class="quick-pill"
                        style="color:#60a5fa;"
                        @click=${() => {
                          this.showPicker = true;
                        }}
                      >
                        + More…
                      </button>
                    </div>
                  `
                : html`<div style="font-size:12px;color:var(--t-muted);">
                    Swipe right to confirm, left to trash, or tap ✎ to pick a person.
                  </div>`}
            </div>
          </div>
        </div>

        <div class="actions">
          <button class="act-btn small" title="Undo skip (Z)" @click=${() => this.emit('undo')}>↺</button>
          <button class="act-btn trash" title="Trash bad crop (←)" @click=${() => this.emit('trash')}>✕</button>
          <button
            class="act-btn reassign"
            title="Pick person (↑)"
            @click=${() => {
              this.showPicker = !this.showPicker;
            }}
          >
            ✎
          </button>
          <button class="act-btn small" title="Skip for now (↓)" @click=${() => this.emit('skip')}>↷</button>
          <button class="act-btn confirm" title="Confirm (→)" @click=${() => this.emit('confirm')}>✓</button>
        </div>
        <div class="kbd-hint">Swipe or keys: ← Trash · → Confirm · ↑ Pick Person · ↓ Skip · Z Undo</div>

        ${this.showPicker
          ? html`
              <frigate-reassign-modal
                .api=${this.api}
                .faces=${this.faces}
                .people=${this.people}
                candidateFilename=${top.filename}
                @close=${() => {
                  this.showPicker = false;
                }}
                @pick=${(e: CustomEvent<string>) => {
                  this.showPicker = false;
                  this.emit('assign', e.detail);
                }}
              ></frigate-reassign-modal>
            `
          : ''}
      </div>
    `;
  }
}
