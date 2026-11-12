# Yorna

Yorna is a local-first desktop notes app for YouTube scripts. Scripts live on a Kanban board (To do → In progress → Done), every card opens a rich-text document, and focus sessions plus a reminder calendar keep the channel moving.

Built with **Tauri 2 + React + TypeScript**, Tailwind CSS v4 and shadcn/ui. Windows and macOS are the priority targets; Linux works but is less polished.

## What's in this slice

- **Calendar** — real month grid (Monday-first) with colored reminder dots; hovering a day expands that day's reminders. A **New reminder** bar sets date, color, optional time and title. Timed reminders play the finish sound in the app when they're due (no OS notifications). The side panel shows **% of the month left to work**, i.e. unworked days that are still ahead, alongside worked and not-worked counts.
- **Notes** — Kanban board with drag-and-drop between columns, per-column quick add, search, move/delete actions and empty states. Cards open a script editor with headings, bold/italic/underline/strike, highlight, code, links, bulleted, numbered and check lists, quotes and dividers.
- **Image references, not image pastes** — the image button links a file path (with a native file picker on desktop) or a URL. Only the reference is stored. Pasting or dropping image files into a script is blocked.
- **Sessions** — opening a script asks how long you'll work: 30 minutes by default, with 15, 60 or Custom. The star ring fills as you go, and the top-right star shows minutes left (click it for progress, pause/resume, end early). **A day counts as worked only when a session finishes.** Finishing plays the goal sound.
- **Settings** — profiles, default session length, upload/preview/reset a **custom goal-finish sound** (stored in the vault), volume, **vault folder** (change / move / reset), sync status and conflict copies, and the current app version.
- **Sync through any cloud folder** — point the vault at a folder inside Google Drive, Dropbox, iCloud Drive or OneDrive (**Settings → Vault → Change folder…**). Yorna picks up changes the sync app brings in, merges overlapping saves without losing finished sessions, and lists conflict copies. See [docs/sync.md](docs/sync.md).
- **Profiles** — with one profile Yorna opens straight to the calendar. Create more in **Settings → Profiles** (or from the picker); once there are two or more, launch shows **Who's writing?** and the top-right avatar or **Switch accounts** returns to it. Each profile has its own scripts, reminders, sessions, settings and goal sound.

## Local-first vault

Everything is stored as plain files that you own:

```
<AppData>/app.yorna.desktop/vault/
├── profiles.json       # profile list (written once a second profile exists)
├── yorna.json          # first profile: board order, reminders, finished sessions, settings
├── notes/<id>.html     # first profile: one file per script (TipTap HTML)
├── sounds/finish.*     # first profile: custom goal sound, if uploaded
└── profiles/<name>-<id>/
    ├── yorna.json      # every other profile has the same layout in its own folder
    ├── notes/
    └── sounds/
```

The first profile keeps the vault root, so vaults from before profiles existed open unchanged. It can be renamed but not deleted; deleting another profile removes its folder.

| OS      | Vault location                                          |
| ------- | ------------------------------------------------------- |
| macOS   | `~/Library/Application Support/app.yorna.desktop/vault` |
| Windows | `%APPDATA%\app.yorna.desktop\vault`                     |
| Linux   | `~/.local/share/app.yorna.desktop/vault`                |

In the desktop app, **Settings → Vault → Show** opens it. Writes go to a temp file first and are serialized per file.

The vault can live anywhere: **Settings → Vault → Change folder…** either moves (copies) the current vault into a new folder or opens a vault that's already there, e.g. one synced from another computer. The choice is remembered outside the vault in `<AppConfig>/app.yorna.desktop/config.json`; if that folder is missing at launch, Yorna falls back to the default location. Step-by-step Google Drive / Dropbox / iCloud / OneDrive setup: [docs/sync.md](docs/sync.md).

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
├── components/                # session star + dialog, star ring, background alerts, vault watcher, shadcn/ui
├── features/calendar/         # month grid, reminder bar, upcoming list
├── features/notes/            # Kanban board, cards, TipTap editor, image references
├── features/profiles/         # profile picker, avatar, Settings → Profiles
├── features/settings/         # settings screen
└── lib/
    ├── store.ts               # zustand store, vault load/save, profile switching
    ├── profiles.ts            # profiles.json registry
    ├── sync.ts                # merge of yorna.json changes from another computer
    ├── domain.ts              # month stats, session math, helpers
    ├── sound.ts               # default chime (Web Audio) + custom sound playback
    └── vault/                 # VaultFS: Tauri filesystem or IndexedDB backend; vault folder commands
src-tauri/                     # Rust shell: vault folder config/scope/copy/conflict scan; fs, dialog, opener plugins
```

## Not in this slice yet

- A built-in Google Drive API connection (sign-in inside Yorna). Sync works through the provider's desktop app and a synced vault folder instead — see [docs/sync.md](docs/sync.md) for why.
- Linux polish, code signing and auto-update.
- Recurring reminders and reminder editing beyond done/delete.
