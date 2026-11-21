export interface HomeAssistant {
  fetchWithAuth(path: string, init?: RequestInit): Promise<Response>;
  callWS<T = unknown>(msg: Record<string, unknown>): Promise<T>;
}

export interface FaceSwipesConfig {
  entry_id?: string;
  sort?: SortOrder;
}

export type SortOrder = 'newest' | 'lowest' | 'unknown_first';
export type ViewMode = 'swipe' | 'curate' | 'groups';

export interface FrigateFacesMap {
  train?: string[];
  [person: string]: string[] | undefined;
}

export interface TrainCandidate {
  filename: string;
  predicted: string;
  score: number | null;
  eventId: string | null;
  ts: number;
}

export interface FaceQuality {
  score: number;
  width: number;
  height: number;
  tag: string;
  desc: Float32Array;
}

export interface ToastMessage {
  text: string;
  thumbUrl: string | null;
}

export interface SessionStats {
  confirmed: number;
  reassigned: number;
  pruned: number;
  trashed: number;
  skipped: number;
}
