import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { FrigateSwipesApi } from '../api';
import { sharedStyles } from '../styles';
import type { FrigateFacesMap } from '../types';
import './auth-img';

@customElement('frigate-reassign-modal')
export class FrigateReassignModal extends LitElement {
  static styles = [
    sharedStyles,
    css`
      .backdrop {
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
      .modal {
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
      .hdr {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }
      .title-wrap {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .thumb {
        width: 42px;
        height: 42px;
        border-radius: 10px;
        overflow: hidden;
        background: #0d0f13;
        border: 1px solid var(--t-border);
      }
      .close-btn {
        background: var(--t-surface);
        color: var(--primary-text-color, #fff);
        border: 1px solid var(--t-border);
        border-radius: 999px;
        padding: 5px 11px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
      }
      .grid {
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
        transition: transform 0.1s ease, border-color 0.1s ease;
      }
      .person-choice:hover {
        transform: translateY(-1px);
        border-color: #3b82f6;
      }
      .avatar {
        width: 52px;
        height: 52px;
        border-radius: 50%;
        overflow: hidden;
        background: var(--t-bg);
      }
      .new-row {
        display: flex;
        gap: 6px;
      }
    `,
  ];

  @property({ attribute: false }) api?: FrigateSwipesApi;
  @property({ attribute: false }) faces: FrigateFacesMap = {};
  @property({ type: Array }) people: string[] = [];
  @property({ type: String }) candidateFilename = '';

  @state() private filter = '';
  @state() private newName = '';

  private close() {
    this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
  }

  private pick(person: string) {
    const clean = person.trim();
    if (!clean) return;
    this.dispatchEvent(new CustomEvent('pick', { detail: clean, bubbles: true, composed: true }));
  }

  render() {
    const q = this.filter.trim().toLowerCase();
    const filtered = q ? this.people.filter((p) => p.toLowerCase().includes(q)) : this.people;

    return html`
      <div
        class="backdrop"
        @click=${(e: Event) => {
          if (e.target === e.currentTarget) this.close();
        }}
      >
        <div class="modal">
          <div class="hdr">
            <div class="title-wrap">
              <div class="thumb">
                <frigate-auth-img
                  .api=${this.api}
                  path=${`clips/faces/train/${this.candidateFilename}`}
                  alt="Candidate"
                ></frigate-auth-img>
              </div>
              <strong style="font-size:15px;">Who is this?</strong>
            </div>
            <button class="close-btn" @click=${() => this.close()}>✕ Close</button>
          </div>

          <input
            type="text"
            placeholder="Filter people..."
            .value=${this.filter}
            @input=${(e: Event) => {
              this.filter = (e.target as HTMLInputElement).value;
            }}
          />

          <div class="grid">
            ${filtered.map((p) => {
              const firstImg = this.faces[p]?.[0];
              return html`
                <button class="person-choice" @click=${() => this.pick(p)}>
                  <div class="avatar">
                    ${firstImg
                      ? html`<frigate-auth-img
                          .api=${this.api}
                          path=${`clips/faces/${p}/${firstImg}`}
                          alt=${p}
                        ></frigate-auth-img>`
                      : ''}
                  </div>
                  <span>${p}</span>
                </button>
              `;
            })}
          </div>

          <div class="new-row">
            <input
              type="text"
              placeholder="New person name..."
              style="flex:1;"
              .value=${this.newName}
              @input=${(e: Event) => {
                this.newName = (e.target as HTMLInputElement).value;
              }}
              @keydown=${(e: KeyboardEvent) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  this.pick(this.newName);
                }
              }}
            />
            <button class="btn primary" @click=${() => this.pick(this.newName)}>Save</button>
          </div>
        </div>
      </div>
    `;
  }
}
