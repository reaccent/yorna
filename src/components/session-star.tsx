import { useState } from "react";
import { FileText, Pause, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SessionDialog } from "@/components/session-dialog";
import { StarRing } from "@/components/star-ring";
import { useNow } from "@/hooks/use-now";
import { dayKey, formatClock, sessionProgress } from "@/lib/domain";
import { useYorna } from "@/lib/store";

/** Top-right session star: ring fills as the session runs; click for minutes left. */
export function SessionStar() {
  const session = useYorna((s) => s.activeSession);
  const sessions = useYorna((s) => s.sessions);
  const notes = useYorna((s) => s.notes);
  const openNoteId = useYorna((s) => s.openNoteId);
  const defaultMinutes = useYorna((s) => s.settings.defaultSessionMinutes);
  const { pauseSession, resumeSession, cancelSession, startSession, openNote } = useYorna.getState();
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const now = useNow(1000, Boolean(session?.runningSince));

  const today = dayKey(new Date(now));
  const workedToday = sessions.some((s) => s.date === today);
  const todayCount = sessions.filter((s) => s.date === today).length;

  if (!session) {
    const openNote_ = openNoteId ? notes.find((n) => n.id === openNoteId) : undefined;
    return (
      <>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              className="flex items-center gap-2 rounded-full border border-transparent py-1 pr-3 pl-1 text-sm text-muted-foreground transition-colors hover:border-border hover:bg-accent hover:text-foreground"
              aria-label={workedToday ? "Today counts — start another session" : "Start a work session"}
            >
              <StarRing progress={workedToday ? 1 : 0} complete={workedToday} size={32} stroke={2.5} />
              <span className="hidden sm:inline">{workedToday ? "Today counts" : "No session"}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72">
            <div className="flex items-center gap-3">
              <StarRing progress={workedToday ? 1 : 0} complete={workedToday} size={48} />
              <div>
                <p className="font-medium">{workedToday ? "Today counts" : "Today isn't counted yet"}</p>
                <p className="text-sm text-muted-foreground">
                  {workedToday
                    ? `${todayCount} session${todayCount === 1 ? "" : "s"} finished today`
                    : "Finish a session to mark today worked."}
                </p>
              </div>
            </div>
            <Button
              className="mt-4 w-full bg-star text-star-foreground hover:bg-star/90"
              onClick={() => {
                setOpen(false);
                setDialogOpen(true);
              }}
            >
              <Play className="size-4" /> Start a session
            </Button>
          </PopoverContent>
        </Popover>
        <SessionDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          defaultMinutes={defaultMinutes}
          noteTitle={openNote_?.title}
          onStart={(m) => {
            startSession(m, openNote_?.id);
            setDialogOpen(false);
          }}
        />
      </>
    );
  }

  const { remaining, ratio } = sessionProgress(session, now);
  const paused = !session.runningSince;
  const note = session.noteId ? notes.find((n) => n.id === session.noteId) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-full border bg-card py-1 pr-3 pl-1 text-sm transition-colors hover:bg-accent"
          aria-label={`${formatClock(remaining)} left in session`}
        >
          <StarRing progress={ratio} size={32} stroke={2.5} />
          <span className="font-medium tabular-nums">{formatClock(remaining)}</span>
          {paused && <span className="text-xs text-muted-foreground">paused</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="flex flex-col items-center text-center">
          <StarRing progress={ratio} size={112} stroke={5} />
          <p className="mt-3 text-4xl font-light tabular-nums">{formatClock(remaining)}</p>
          <p className="text-sm text-muted-foreground">
            {Math.ceil(remaining / 60_000)} min left · {Math.floor(ratio * 100)}% of {session.plannedMinutes} min
          </p>
          {note && (
            <button
              className="mt-3 inline-flex max-w-full items-center gap-1.5 truncate rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
              onClick={() => {
                openNote(note.id);
                setOpen(false);
              }}
            >
              <FileText className="size-3.5 shrink-0" />
              <span className="truncate">{note.title}</span>
            </button>
          )}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {paused ? (
            <Button variant="secondary" onClick={resumeSession}>
              <Play className="size-4" /> Resume
            </Button>
          ) : (
            <Button variant="secondary" onClick={pauseSession}>
              <Pause className="size-4" /> Pause
            </Button>
          )}
          <Button
            variant="ghost"
            className="text-muted-foreground"
            onClick={() => {
              cancelSession();
              setOpen(false);
            }}
          >
            <Square className="size-4" /> End early
          </Button>
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Ending early won't count today. Only finished sessions do.
        </p>
      </PopoverContent>
    </Popover>
  );
}
