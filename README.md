# Yorna

Yorna is a local-first desktop notes app for YouTube scripts. Scripts live on a Kanban board (To do → In progress → Done), every card opens a rich-text document, and focus sessions plus a reminder calendar keep the channel moving.

Built with **Tauri 2 + React + TypeScript**, Tailwind CSS v4 and shadcn/ui. Windows and macOS are the priority targets; Linux works but is less polished.

## What's in this slice

- **Calendar** — real month grid (Monday-first) with colored reminder dots; hovering a day expands that day's reminders. A **New reminder** bar sets date, color, optional time and title. Timed reminders play the finish sound in the app when they're due (no OS notifications). The side panel shows **% of the month left to work**, i.e. unworked days that are still ahead, alongside worked and not-worked counts.
- **Notes** — Kanban board with drag-and-drop between columns, per-column quick add, search, move/delete actions and empty states. Cards open a script editor with headings, bold/italic/underline/strike, highlight, code, links, bulleted, numbered and check lists, quotes and dividers.
- **Image references, not image pastes** — the image button links a file path (with a native file picker on desktop) or a URL. Only the reference is stored. Pasting or dropping image files into a script is blocked.
- **Sessions** — opening a script asks how long you'll work: 30 minutes by default, with 15, 60 or Custom. The star ring fills as you go, and the top-right star shows minutes left (click it for progress, pause/resume, end early). **A day counts as worked only when a session finishes.** Finishing plays the goal sound.
- **Settings** — default session length, upload/preview/reset a **custom goal-finish sound** (stored in the vault), volume, vault location, and the current app version.
- **Single user** — the profile picker is skipped for the MVP.

## Local-first vault

Everything is stored as plain files that you own:

```
<AppData>/app.yorna.desktop/vault/
├── yorna.json          # board order, reminders, finished sessions, settings
├── notes/<id>.html     # one file per script (TipTap HTML)
└── sounds/finish.*     # custom goal sound, if uploaded
```

| OS      | Vault location                                          |
| ------- | ------------------------------------------------------- |
| macOS   | `~/Library/Application Support/app.yorna.desktop/vault` |
| Windows | `%APPDATA%\app.yorna.desktop\vault`                     |
| Linux   | `~/.local/share/app.yorna.desktop/vault`                |

In the desktop app, **Settings → Vault → Show folder** opens it. Writes go to a temp file first and are serialized per file.

When Yorna runs in a plain browser (`npm run web`), the same layout is mirrored in IndexedDB (`yorna-vault`), so the UI is fully usable without the native shell. Local image paths only preview in the desktop app.

## Run it

Prerequisites: Node 20+ and, for the desktop app, Rust stable (1.85+) plus the [Tauri prerequisites](https://tauri.app/start/prerequisites/) for your OS (WebView2 on Windows, Xcode Command Line Tools on macOS, `libwebkit2gtk-4.1-dev` and related packages on Linux).

```bash
npm install

# Desktop app (Tauri window + Vite on :1420)
npm run desktop

# Browser-only UI on http://127.0.0.1:43127 (IndexedDB vault)
npm run web

# Production desktop bundle (.dmg / .msi / .AppImage …)
npm run desktop:build
```

Other scripts: `npm run typecheck`, `npm run build` (web assets only), `npm run format`.

## Project layout

```
src/
├── App.tsx                    # shell: top bar, session star, bottom nav (Calendar | Notes | Settings)
├── components/                # session star + dialog, star ring, background alerts, shadcn/ui
├── features/calendar/         # month grid, reminder bar, upcoming list
├── features/notes/            # Kanban board, cards, TipTap editor, image references
├── features/settings/         # settings screen
└── lib/
    ├── store.ts               # zustand store, vault load/save
    ├── domain.ts              # month stats, session math, helpers
    ├── sound.ts               # default chime (Web Audio) + custom sound playback
    └── vault/                 # VaultFS: Tauri filesystem or IndexedDB backend
src-tauri/                     # Rust shell: fs, dialog, opener plugins; asset protocol for image refs
```

## Not in this slice yet

- Google Drive (or other) sync. The vault is plain files, so a synced-folder approach or real Drive sync can come later.
- Multiple profiles and the profile picker.
- Linux polish, code signing and auto-update.
- Recurring reminders and reminder editing beyond done/delete.
