import { useEffect } from "react";
import { toast } from "sonner";
import { useYorna } from "@/lib/store";

const POLL_MS = 4000;

/**
 * Picks up vault changes made on another computer and delivered by a sync app
 * (Google Drive, Dropbox, iCloud Drive, OneDrive…). Polling is cheap: one small
 * JSON read every few seconds, plus a check whenever the window regains focus.
 */
export function VaultWatcher() {
  useEffect(() => {
    let running = false;
    const check = async () => {
      if (running) return;
      running = true;
      try {
        const before = useYorna.getState();
        const openId = before.openNoteId;
        const openStamp = before.notes.find((n) => n.id === openId)?.updatedAt;
        if (!(await before.checkExternalChanges())) return;
        const after = useYorna.getState();
        const open = openId ? after.notes.find((n) => n.id === openId) : undefined;
        if (open && open.updatedAt !== openStamp) {
          toast(`“${open.title}” changed on another computer`, {
            description: "Reload to see that version. Typing here keeps yours.",
            duration: 15000,
            action: {
              label: "Reload",
              onClick: () => {
                useYorna.getState().closeNote();
                setTimeout(() => useYorna.getState().openNote(open.id), 0);
              },
            },
          });
        } else {
          toast("Vault updated from your sync folder", { duration: 2500 });
        }
        void after.refreshConflicts();
      } catch (err) {
        console.warn("Vault change check failed", err);
      } finally {
        running = false;
      }
    };
    const onFocus = () => {
      void check();
      void useYorna.getState().refreshConflicts();
    };
    const id = setInterval(() => void check(), POLL_MS);
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return null;
}
