import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { FrigateSwipesApi } from '../api';
import type { FaceQuality } from '../types';

@customElement('frigate-auth-img')
export class FrigateAuthImg extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    img {
      width: 100%;
      height: 100%;
      object-fit: var(--img-fit, cover);
      border-radius: var(--img-radius, 0);
      display: block;
    }
  `;

  @property({ attribute: false }) api?: FrigateSwipesApi;
  @property({ type: String }) path = '';
  @property({ type: String }) alt = '';

  @state() private srcUrl = '';
  private loadedPath = '';

  updated(changed: Map<string, unknown>) {
    if ((changed.has('path') || changed.has('api')) && this.api && this.path && this.path !== this.loadedPath) {
      this.loadedPath = this.path;
      const cached = this.api.getCachedUrl(this.path);
      if (cached) {
        this.srcUrl = cached;
        const q = this.api.getCachedQuality(this.path);
        if (q) this.emitQuality(q);
        return;
      }
      this.srcUrl = '';
      void this.load();
    }
  }

  private emitQuality(quality: FaceQuality) {
    this.dispatchEvent(new CustomEvent('quality', { detail: quality, bubbles: true, composed: true }));
  }

  private async load() {
    if (!this.api || !this.path) return;
    const targetPath = this.path;
    const res = await this.api.fetchMedia(targetPath);
    if (!res || targetPath !== this.path) return;
    this.srcUrl = res.url;
    if (res.quality) this.emitQuality(res.quality);
  }

  render() {
    return this.srcUrl ? html`<img src=${this.srcUrl} alt=${this.alt} />` : html``;
  }
}
