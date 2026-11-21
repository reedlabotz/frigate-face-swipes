import { analyzeFaceQuality } from './quality';
import type { FaceQuality, FrigateFacesMap, HomeAssistant } from './types';

export class FrigateSwipesApi {
  private imgCache = new Map<string, string>();
  private qualityCache = new Map<string, FaceQuality>();

  constructor(
    public hass: HomeAssistant,
    public entryId = 'default'
  ) {}

  private get proxyBase(): string {
    return `/api/frigate_face_swipes/proxy/${encodeURIComponent(this.entryId || 'default')}`;
  }

  async requestJson<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
    const resp = await this.hass.fetchWithAuth(`${this.proxyBase}/${path.replace(/^\/+/, '')}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    const text = await resp.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    if (!resp.ok) {
      const errObj = data as { error?: string; message?: string; detail?: string } | null;
      throw new Error(errObj?.error || errObj?.message || errObj?.detail || text || `HTTP ${resp.status}`);
    }
    return data as T;
  }

  getFaces(): Promise<FrigateFacesMap> {
    return this.requestJson<FrigateFacesMap>('api/faces');
  }

  classifyTrainFile(person: string, trainingFile: string): Promise<unknown> {
    return this.requestJson(`api/faces/train/${encodeURIComponent(person)}/classify`, {
      method: 'POST',
      body: JSON.stringify({ training_file: trainingFile }),
    });
  }

  deleteFaces(folder: string, ids: string[]): Promise<unknown> {
    return this.requestJson(`api/faces/${encodeURIComponent(folder)}/delete`, {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  }

  reclassifyFace(fromPerson: string, id: string, newName: string): Promise<unknown> {
    return this.requestJson(`api/faces/${encodeURIComponent(fromPerson)}/reclassify`, {
      method: 'POST',
      body: JSON.stringify({ id, new_name: newName }),
    });
  }

  getCachedUrl(path: string): string | null {
    return this.imgCache.get(path) ?? null;
  }

  getCachedQuality(path: string): FaceQuality | null {
    return this.qualityCache.get(path) ?? null;
  }

  async fetchMedia(path: string): Promise<{ url: string; quality: FaceQuality | null } | null> {
    if (!path) return null;
    const cachedUrl = this.imgCache.get(path);
    if (cachedUrl) {
      return { url: cachedUrl, quality: this.qualityCache.get(path) ?? null };
    }
    try {
      const resp = await this.hass.fetchWithAuth(`${this.proxyBase}/${path.replace(/^\/+/, '')}`);
      if (!resp.ok) return null;
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      this.imgCache.set(path, url);
      let quality: FaceQuality | null = null;
      if (path.startsWith('clips/faces/')) {
        quality = await analyzeFaceQuality(blob).catch(() => null);
        if (quality) this.qualityCache.set(path, quality);
      }
      return { url, quality };
    } catch {
      return null;
    }
  }
}
