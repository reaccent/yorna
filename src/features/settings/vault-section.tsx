import { useEffect, useState } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { Cloud, FolderInput, FolderOpen, HardDrive, RotateCcw, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useYorna } from "@/lib/store";
import { resolveVaultTarget, type FolderInfo } from "@/lib/vault/folder";
import { Row, Section } from "./section";

export const SYNC_GUIDE_URL = "https://github.com/reaccent/yorna/blob/main/docs/sync.md";

const errorText = (err: unknown) => (err instanceof Error ? err.message : String(err));

async function reveal(path: string) {
  const { revealItemInDir } = await import("@tauri-apps/plugin-opener");
  await revealItemInDir(path).catch((err) => toast.error(errorText(err)));
}

export async function openExternal(url: string) {
  if (isTauri()) {
    const { openUrl } = await import("@tauri-apps/plugin-opener");
    await openUrl(url).catch((err) => toast.error(errorText(err)));
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

/** Matches the sync app a folder path most likely belongs to, for friendlier copy. */
function syncProvider(path: string) {
  const p = path.toLowerCase();
  if (p.includes("googledrive") || p.includes("google drive") || p.includes("my drive")) return "Google Drive";
  if (p.includes("dropbox")) return "Dropbox";
  if (p.includes("mobile documents") || p.includes("icloud")) return "iCloud Drive";
  if (p.includes("onedrive")) return "OneDrive";
  return null;
}

export function VaultSection() {
  const folder = useYorna((s) => s.vaultFolder);
  const vaultKind = useYorna((s) => s.vaultKind);
  const profileLocation = useYorna((s) => s.vaultLocation);
  const conflicts = useYorna((s) => s.conflicts);
  const notesCount = useYorna((s) => s.notes.length);
  const sessionsCount = useYorna((s) => s.sessions.length);
  const [target, setTarget] = useState<FolderInfo | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void useYorna.getState().refreshConflicts();
  }, []);

  const desktop = vaultKind === "filesystem" && folder;
  const provider = folder ? syncProvider(folder.path) : null;
  const showProfileFolder = desktop && profileLocation && profileLocation !== folder.path;

  const pick = async () => {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const picked = await open({ directory: true, multiple: false, title: "Choose a folder for your Yorna vault" });
    if (typeof picked !== "string") return;
    try {
      const resolved = await resolveVaultTarget(picked);
      if (folder && resolved.path === folder.path) {
        toast("That's already your vault folder.");
        return;
      }
      setTarget(resolved);
    } catch (err) {
      toast.error(errorText(err));
    }
  };

  const apply = async (path: string, mode: "open" | "copy") => {
    setBusy(true);
    try {
      await useYorna.getState().changeVaultFolder(path, mode);
      setTarget(null);
      toast.success(mode === "copy" ? "Vault moved" : "Vault folder changed", {
        description:
          mode === "copy" ? "Your previous folder was left untouched as a backup." : "Yorna now reads and writes here.",
      });
    } catch (err) {
      toast.error("Couldn't change the vault folder", { description: errorText(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section
      title="Vault"
      description="Yorna is local-first: everything is plain files in one folder you own. Put that folder in Google Drive, Dropbox, iCloud Drive or OneDrive to sync it."
    >
      <Row
        label={
          <span className="flex items-center gap-2">
            <HardDrive className="size-4 text-muted-foreground" />
            {desktop ? "Vault folder" : "Browser vault (dev mode)"}
            {desktop && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-normal text-muted-foreground">
                {folder.isDefault ? "Default location" : (provider ?? "Custom folder")}
              </span>
            )}
          </span>
        }
        hint={<span className="font-mono text-xs break-all">{desktop ? folder.path : profileLocation}</span>}
      >
        {desktop ? (
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => void reveal(folder.path)}>
              <FolderOpen className="size-4" /> Show
            </Button>
            {!folder.isDefault && (
              <Button
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={() =>
                  void resolveVaultTarget(folder.defaultPath)
                    .then((t) => setTarget({ ...t, path: folder.defaultPath }))
                    .catch((err) => toast.error(errorText(err)))
                }
              >
                <RotateCcw className="size-4" /> Use default
              </Button>
            )}
            <Button variant="secondary" size="sm" disabled={busy} onClick={() => void pick()}>
              <FolderInput className="size-4" /> Change folder…
            </Button>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">Folder choice is in the desktop app</span>
        )}
      </Row>

      {showProfileFolder && (
        <Row
          label="This profile's folder"
          hint={<span className="font-mono text-xs break-all">{profileLocation}</span>}
        >
          <Button variant="ghost" size="sm" onClick={() => void reveal(profileLocation)}>
            <FolderOpen className="size-4" /> Show
          </Button>
        </Row>
      )}

      <Row label="Contents">
        <span className="text-sm text-muted-foreground">
          {notesCount} script{notesCount === 1 ? "" : "s"} · {sessionsCount} finished session
          {sessionsCount === 1 ? "" : "s"}
        </span>
      </Row>

      <Row
        label={
          <span className="flex items-center gap-2">
            <Cloud className="size-4 text-muted-foreground" /> Cloud sync
          </span>
        }
        hint={
          desktop && !folder.isDefault
            ? `Yorna watches this folder and picks up changes ${provider ?? "your sync app"} brings in from your other computers.`
            : "Choose a folder inside Google Drive, Dropbox, iCloud Drive or OneDrive. Their desktop apps do the syncing; Yorna never needs your password."
        }
      >
        <div className="flex items-center gap-2">
          {desktop && !folder.isDefault && (
            <span className="flex items-center gap-1.5 rounded-full bg-[#5cc8a1]/15 px-2.5 py-1 text-xs text-[#5cc8a1]">
              <span className="size-1.5 rounded-full bg-current" /> Watching for changes
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={() => void openExternal(SYNC_GUIDE_URL)}>
            How it works
          </Button>
        </div>
      </Row>

      {conflicts.length > 0 && desktop && (
        <Row
          label={
            <span className="flex items-center gap-2 text-missed">
              <TriangleAlert className="size-4" /> {conflicts.length} sync conflict cop
              {conflicts.length === 1 ? "y" : "ies"}
            </span>
          }
          hint={
            <>
              Two computers changed the same file and your sync app kept both. Yorna uses the original; compare and
              delete the copies when you're done.
              <ul className="mt-1.5 space-y-0.5 font-mono text-xs">
                {conflicts.slice(0, 5).map((c) => (
                  <li key={c} className="break-all">
                    {c}
                  </li>
                ))}
                {conflicts.length > 5 && <li>…and {conflicts.length - 5} more</li>}
              </ul>
            </>
          }
        >
          <Button variant="secondary" size="sm" onClick={() => void reveal(folder.path)}>
            <FolderOpen className="size-4" /> Open folder
          </Button>
        </Row>
      )}

      <ChangeFolderDialog
        target={target}
        busy={busy}
        onClose={() => setTarget(null)}
        onApply={(mode) => target && void apply(target.path, mode)}
      />
    </Section>
  );
}

function ChangeFolderDialog({
  target,
  busy,
  onClose,
  onApply,
}: {
  target: FolderInfo | null;
  busy: boolean;
  onClose(): void;
  onApply(mode: "open" | "copy"): void;
}) {
  const existing = target?.isVault;
  return (
    <Dialog open={Boolean(target)} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{existing ? "Open the vault in this folder?" : "Use this folder for your vault?"}</DialogTitle>
          <DialogDescription>
            {existing
              ? "This folder already has a Yorna vault — for example one synced from another computer. Yorna will switch to it; your current folder stays as it is."
              : "Move copies your scripts, reminders, sessions, profiles and goal sounds here and leaves the current folder untouched as a backup. Start empty opens a new vault instead."}
          </DialogDescription>
        </DialogHeader>
        <p className="rounded-lg bg-muted/60 px-3 py-2 font-mono text-xs break-all">{target?.path}</p>
        <DialogFooter className="gap-2">
          <Button variant="ghost" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          {existing ? (
            <Button disabled={busy} onClick={() => onApply("open")}>
              Open vault
            </Button>
          ) : (
            <>
              <Button variant="secondary" disabled={busy} onClick={() => onApply("open")}>
                Start empty
              </Button>
              <Button disabled={busy} onClick={() => onApply("copy")}>
                {busy ? "Moving…" : "Move my vault here"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
