# Frigate Face Swipes (HACS Integration)

A Home Assistant custom integration & Lovelace card/panel for **Tinder-style** and **Google Photos-style** face matching and training with **Frigate** (0.16+).

## Features

- **Tinder-Style Swipe Deck:**
  - **Swipe Right (`→`)** to confirm and train the predicted person (`POST /api/faces/train/:name/classify`).
  - **Swipe Left (`←`)** to trash blurry, dark, or bad face crops (`POST /api/faces/train/delete`) so they don't degrade recognition scores.
  - **Swipe Up (`↑`)** to reassign to another person or create a new person.
  - **Swipe Down (`↓`)** to skip, **`Z`** to undo skips.
  - **Google Photos-Style Reference Strip:** Shows existing registered photos of the predicted person right on the card for instant side-by-side comparison, plus a **Full Snapshot** toggle.
- **Smart Groups:** View pending faces grouped by predicted person / unknown visitors and batch-confirm or batch-trash selected tiles.
- **Face Library:** Browse all registered people, move misclassified crops between people, or prune low-quality training photos.
- **Zero CORS / Reverse-Proxy Headaches:** Home Assistant's Python backend proxies `/api/faces` and `/clips/faces` securely using HA authentication.
- **Auto-Registered UI:** Adds a **Face Swipes** sidebar panel and registers `custom:frigate-face-swipes-card` automatically.

## Installation via HACS

1. In Home Assistant, open **HACS → ⋮ → Custom repositories**.
2. Add `https://github.com/reedlabotz/frigate-face-swipes` with category **Integration**.
3. Install **Frigate Face Swipes** and restart Home Assistant.
4. Go to **Settings → Devices & Services → Add Integration → Frigate Face Swipes**.
5. Enter your Frigate URL (auto-suggested if the Frigate integration is already installed) and optional credentials.
6. Open **Face Swipes** from your Home Assistant sidebar, or add `type: custom:frigate-face-swipes-card` to any dashboard.
