import type { FaceQuality, TrainCandidate } from './types';

export function parseTrainFilename(filename: string): TrainCandidate {
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

export function formatPct(score: number | null | undefined): string {
  if (typeof score !== 'number' || Number.isNaN(score)) return '—';
  return `${Math.round(score > 1 ? score : score * 100)}%`;
}

export function scoreTier(score: number | null | undefined): 'high' | 'mid' | 'low' | 'none' {
  if (typeof score !== 'number' || Number.isNaN(score)) return 'none';
  const s = score > 1 ? score / 100 : score;
  if (s >= 0.85) return 'high';
  if (s >= 0.65) return 'mid';
  return 'low';
}

export function qualityTier(q: number | null | undefined): 'high' | 'mid' | 'low' | 'none' {
  if (typeof q !== 'number' || Number.isNaN(q)) return 'none';
  if (q >= 75) return 'high';
  if (q >= 50) return 'mid';
  return 'low';
}

export async function analyzeFaceQuality(blob: Blob): Promise<FaceQuality> {
  const bmp = await createImageBitmap(blob);
  const origW = bmp.width;
  const origH = bmp.height;
  const minDim = Math.min(origW, origH);

  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
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

  const resScore = Math.min(35, Math.max(0, ((minDim - 32) / 96) * 35));
  const sharpScore = Math.min(40, Math.max(0, (meanLap / 26) * 40));
  const lumPenalty = meanLum < 45 ? (45 - meanLum) / 45 : meanLum > 220 ? (meanLum - 220) / 35 : 0;
  const contrastScore = Math.min(25, Math.max(0, (stdLum / 52) * 25)) * (1 - Math.min(0.8, lumPenalty));

  const total = Math.round(Math.min(100, Math.max(0, resScore + sharpScore + contrastScore)));
  const flags: string[] = [];
  if (minDim < 60) flags.push(`${minDim}px`);
  if (meanLap < 9) flags.push('Blurry');
  if (meanLum < 45) flags.push('Dark');
  if (!flags.length) flags.push(`${minDim}px`);

  // 16x16 normalized RGB perceptual descriptor for diversity comparison
  const dSize = 16;
  const dCanvas = document.createElement('canvas');
  dCanvas.width = dSize;
  dCanvas.height = dSize;
  const dCtx = dCanvas.getContext('2d')!;
  dCtx.drawImage(canvas, 0, 0, dSize, dSize);
  const dData = dCtx.getImageData(0, 0, dSize, dSize).data;
  const desc = new Float32Array(dSize * dSize * 3);
  let dMean = 0;
  for (let i = 0; i < dSize * dSize; i++) {
    desc[i * 3] = dData[i * 4];
    desc[i * 3 + 1] = dData[i * 4 + 1];
    desc[i * 3 + 2] = dData[i * 4 + 2];
    dMean += desc[i * 3] + desc[i * 3 + 1] + desc[i * 3 + 2];
  }
  dMean /= desc.length;
  let normSq = 0;
  for (let i = 0; i < desc.length; i++) {
    desc[i] -= dMean;
    normSq += desc[i] * desc[i];
  }
  const norm = Math.sqrt(normSq) || 1;
  for (let i = 0; i < desc.length; i++) desc[i] /= norm;

  return { score: total, width: origW, height: origH, tag: flags.join(' · '), desc };
}

export function cosineSim(a?: Float32Array | null, b?: Float32Array | null): number {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

export function selectDiverseBestN(
  items: Array<{ filename: string; quality: FaceQuality | null }>,
  targetN: number
): { keepSet: Set<string>; reasons: Map<string, string> } {
  const n = Math.max(1, Math.min(items.length, targetN));
  const pool = [...items].sort((a, b) => (b.quality?.score ?? 50) - (a.quality?.score ?? 50));
  const kept: Array<{ filename: string; quality: FaceQuality | null }> = [];
  const reasons = new Map<string, string>();

  if (pool.length) {
    const first = pool.shift()!;
    kept.push(first);
    reasons.set(first.filename, 'Top Quality');
  }

  while (kept.length < n && pool.length) {
    let bestIdx = 0;
    let bestCombined = -Infinity;
    let bestSim = 0;

    for (let i = 0; i < pool.length; i++) {
      const cand = pool[i];
      const q = (cand.quality?.score ?? 50) / 100;
      let maxSim = 0;
      for (const k of kept) {
        const sim = cosineSim(cand.quality?.desc, k.quality?.desc);
        if (sim > maxSim) maxSim = sim;
      }
      const dupPenalty = Math.max(0, maxSim - 0.55) * 1.45;
      const combined = q * (1 - Math.min(0.85, dupPenalty));
      if (combined > bestCombined) {
        bestCombined = combined;
        bestIdx = i;
        bestSim = maxSim;
      }
    }

    const chosen = pool.splice(bestIdx, 1)[0];
    kept.push(chosen);
    reasons.set(chosen.filename, bestSim < 0.78 ? 'Diverse' : 'Good');
  }

  for (const rest of pool) {
    let maxSim = 0;
    for (const k of kept) {
      const sim = cosineSim(rest.quality?.desc, k.quality?.desc);
      if (sim > maxSim) maxSim = sim;
    }
    const q = rest.quality?.score ?? 50;
    reasons.set(rest.filename, maxSim >= 0.85 ? 'Near-Dup' : q < 55 ? 'Weak' : 'Extra');
  }

  return { keepSet: new Set(kept.map((k) => k.filename)), reasons };
}
