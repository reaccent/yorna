# Syncing your Yorna vault (Google Drive, Dropbox, iCloud Drive, OneDrive)

Yorna works like Obsidian: your vault is a normal folder of plain files, and syncing is done by
the sync app you already use. Yorna never asks for your Google password and has no servers.
Put the vault folder inside a synced folder and every computer that opens that folder sees the
same scripts, reminders, sessions and profiles.

## 1. Install the provider's desktop app

| Provider     | App                                                                                               | Synced folder (typical)                                                             |
| ------------ | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Google Drive | [Google Drive for desktop](https://www.google.com/drive/download/)                                | Windows: `G:\My Drive` · macOS: `~/Library/CloudStorage/GoogleDrive-<you>/My Drive` |
| Dropbox      | [Dropbox desktop app](https://www.dropbox.com/install)                                            | `~/Dropbox` · `C:\Users\<you>\Dropbox`                                              |
| iCloud Drive | Built into macOS; [iCloud for Windows](https://support.apple.com/HT204283)                        | macOS: `~/Library/Mobile Documents/com~apple~CloudDocs` (Finder → iCloud Drive)     |
| OneDrive     | Built into Windows; [OneDrive for Mac](https://www.microsoft.com/microsoft-365/onedrive/download) | `C:\Users\<you>\OneDrive` · `~/Library/CloudStorage/OneDrive-Personal`              |

**Google Drive tip:** Drive for desktop offers _Stream files_ (default) or _Mirror files_.
Both work. With streaming, right-click the Yorna folder → **Offline access → Available offline**
so Yorna can open it without a connection. The same applies to Dropbox (**Make available
offline**), iCloud (turn off **Optimize Mac Storage** or choose **Keep Downloaded**) and OneDrive
(**Always keep on this device**).

## 2. Move the vault into the synced folder (first computer)

1. Open Yorna → **Settings → Vault → Change folder…**
2. Pick your synced folder, for example **My Drive**. If the folder already has other files,
   Yorna proposes a `Yorna` subfolder (`My Drive/Yorna`) so your Drive stays tidy.
3. Choose **Move my vault here**. Yorna copies every profile, script, reminder, session and goal
   sound and switches to the new folder. The old folder is left untouched as a backup; delete it
   once you're happy.

The vault row now shows the provider (for example _Google Drive_) and **Watching for changes**.

## 3. Open the same vault on your other computer

1. Wait for the sync app to finish downloading the `Yorna` folder.
2. Open Yorna → **Settings → Vault → Change folder…** and pick that same `Yorna` folder.
3. Yorna recognises the existing vault and offers **Open vault**. Profiles come along too: with
   more than one, you'll see **Who's writing?**

## How changes move between computers

- Every change is saved to the vault within a fraction of a second; the sync app uploads it.
- Yorna checks the vault every few seconds and whenever its window gets focus. Changes brought in
  by the sync app appear automatically (_Vault updated from your sync folder_).
- If both computers changed `yorna.json` before seeing each other's version, Yorna merges on
  save: **finished sessions from both sides are always kept** (worked days are never lost),
  reminders and scripts created on the other computer are added, and anything you deleted stays
  deleted.
- If the script you have open was edited on the other computer, Yorna offers **Reload**. Typing
  instead keeps your version.
- Sync apps sometimes keep both versions of a file as a "conflicted copy" (`yorna (1).json`,
  `yorna (Ana's conflicted copy).json`, `yorna 2.json`, `*.sync-conflict-*`). Yorna lists those
  under **Settings → Vault** and keeps using the original. Compare and delete the copies when
  you're done.

**Best practice:** write on one computer at a time, and give the sync app a moment before
switching machines. Yorna is built to survive overlap, but plain files can't merge edits to the
_same script_ typed on two computers at once — the last save of that script wins.

## Going back

**Settings → Vault → Use default** switches back to the built-in location
(`%APPDATA%\app.yorna.desktop\vault`, `~/Library/Application Support/app.yorna.desktop/vault`).
Nothing is deleted from the synced folder.

## What's stored where

```
<vault>/
├── profiles.json            # profile list (once you have more than one)
├── yorna.json               # first profile: board, reminders, sessions, settings
├── notes/<id>.html          # first profile's scripts
├── sounds/finish.*          # first profile's custom goal sound
└── profiles/<name>-<id>/    # other profiles, same layout
```

The chosen folder itself is remembered outside the vault, in
`<AppConfig>/app.yorna.desktop/config.json` (`{"vaultPath": "…"}`), so each computer can keep the
vault at a different path. If that folder is missing at launch (for example an unmounted drive),
Yorna opens the default location instead of failing.

## Why not sign in to Google Drive inside Yorna?

A built-in Drive connection would need OAuth sign-in, token storage, an upload/download queue and
its own conflict handling, and it would only cover Google. A synced folder gets all of that from
apps that already do it well, works offline, covers every provider, and keeps your vault a
folder you can open, back up or move yourself. A direct Drive API option can still be added later
without changing the vault format.
