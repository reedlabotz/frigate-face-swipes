import { css } from 'lit';

export const sharedStyles = css`
  :host {
    display: block;
    font-family: inherit;
    color: var(--primary-text-color, #f3f4f6);
    --t-bg: var(--card-background-color, #14171c);
    --t-surface: var(--secondary-background-color, #1e232b);
    --t-border: var(--divider-color, rgba(255, 255, 255, 0.1));
    --t-muted: var(--secondary-text-color, #9ca3af);
  }
  button {
    touch-action: manipulation;
    font-family: inherit;
  }
  input[type='text'],
  select {
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
  }
  .btn.primary {
    background: #2563eb;
    border-color: #2563eb;
    color: #fff;
  }
  .btn.green {
    background: #16a34a;
    border-color: #16a34a;
    color: #fff;
  }
  .btn.danger {
    background: rgba(239, 68, 68, 0.18);
    border-color: rgba(239, 68, 68, 0.45);
    color: #fca5a5;
  }
  .score-pill {
    font-size: 12px;
    font-weight: 700;
    padding: 3px 9px;
    border-radius: 999px;
    font-variant-numeric: tabular-nums;
  }
  .tier-high {
    background: rgba(34, 197, 94, 0.2);
    color: #4ade80;
  }
  .tier-mid {
    background: rgba(245, 158, 11, 0.2);
    color: #fbbf24;
  }
  .tier-low {
    background: rgba(239, 68, 68, 0.2);
    color: #f87171;
  }
  .tier-none {
    background: rgba(156, 163, 175, 0.2);
    color: var(--t-muted);
  }
  .q-badge {
    font-size: 11px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.72);
    color: #e5e7eb;
    font-variant-numeric: tabular-nums;
  }
  .q-badge.tier-high {
    background: rgba(22, 163, 74, 0.88);
    color: #fff;
  }
  .q-badge.tier-mid {
    background: rgba(217, 119, 6, 0.88);
    color: #fff;
  }
  .q-badge.tier-low {
    background: rgba(220, 38, 38, 0.88);
    color: #fff;
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
  .tile.selected {
    border-color: #3b82f6;
  }
  .tile.keep {
    border-color: #22c55e;
    background: rgba(34, 197, 94, 0.08);
  }
  .tile.prune {
    border-color: rgba(239, 68, 68, 0.45);
    opacity: 0.68;
  }
  .tile img {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    border-radius: 7px;
    display: block;
  }
  .empty {
    text-align: center;
    padding: 36px 16px;
    color: var(--t-muted);
    font-size: 14px;
  }
`;
