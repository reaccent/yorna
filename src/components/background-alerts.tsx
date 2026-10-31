import { useEffect } from "react";
import { toast } from "sonner";
import { dayKey, sessionProgress } from "@/lib/domain";
import { playFinishSound } from "@/lib/sound";
import { useYorna } from "@/lib/store";

function chime() {
  const { settings } = useYorna.getState();
  void playFinishSound({ customSound: settings.customSound, volume: settings.soundVolume });
}

/**
 * In-app alerts only (no OS notifications): finishes sessions on time and
 * chimes for timed reminders while Yorna is open.
 */
export function BackgroundAlerts() {
  useEffect(() => {
    const tick = () => {
      const state = useYorna.getState();
      const session = state.activeSession;
      if (session?.runningSince && sessionProgress(session).remaining <= 0) {
        const note = session.noteId ? state.notes.find((n) => n.id === session.noteId) : undefined;
        if (state.completeSession()) {
          chime();
          toast.success("Session finished — today counts", {
            description: note
              ? `${session.plannedMinutes} minutes on “${note.title}”.`
              : `${session.plannedMinutes} focused minutes.`,
            duration: 8000,
          });
        }
      }

      const now = new Date();
      const today = dayKey(now);
      const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      for (const r of state.reminders) {
        if (r.done || r.firedAt || !r.time || r.date !== today || r.time > hhmm) continue;
        state.updateReminder(r.id, { firedAt: now.toISOString() });
        chime();
        toast(r.title, { description: `Reminder · ${r.time}`, duration: 10000 });
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return null;
}
