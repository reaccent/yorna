import { useEffect } from "react";
import { CalendarDays, Loader2, NotebookPen, Settings2, TriangleAlert } from "lucide-react";
import { BackgroundAlerts } from "@/components/background-alerts";
import { SessionStar } from "@/components/session-star";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CalendarView } from "@/features/calendar/calendar-view";
import { NotesView } from "@/features/notes/notes-view";
import { SettingsView } from "@/features/settings/settings-view";
import { useYorna } from "@/lib/store";
import type { View } from "@/lib/types";
import { cn } from "@/lib/utils";

const NAV: { id: View; label: string; icon: typeof CalendarDays }[] = [
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "notes", label: "Notes", icon: NotebookPen },
  { id: "settings", label: "Settings", icon: Settings2 },
];

const TITLES: Record<View, string> = {
  calendar: "Calendar",
  notes: "Notes",
  settings: "Settings",
};

export default function App() {
  const status = useYorna((s) => s.status);
  const error = useYorna((s) => s.error);
  const view = useYorna((s) => s.view);
  const init = useYorna((s) => s.init);

  useEffect(() => {
    void init();
  }, [init]);

  if (status === "loading") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        <p className="text-sm">Opening your vault…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <TriangleAlert className="size-8 text-destructive" />
        <div>
          <h1 className="text-lg font-semibold">Yorna couldn't open its vault</h1>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">{error}</p>
        </div>
        <Button variant="secondary" onClick={() => void init()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-full flex-col">
        <TopBar title={TITLES[view]} />
        <main className="min-h-0 flex-1 overflow-y-auto">
          {view === "calendar" && <CalendarView />}
          {view === "notes" && <NotesView />}
          {view === "settings" && <SettingsView />}
        </main>
        <BottomNav />
      </div>
      <BackgroundAlerts />
      <Toaster position="top-center" />
    </TooltipProvider>
  );
}

function TopBar({ title }: { title: string }) {
  const saveState = useYorna((s) => s.saveState);
  return (
    <header data-tauri-drag-region className="flex h-14 shrink-0 items-center justify-between border-b px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <YornaMark />
        <span className="text-[15px] font-semibold tracking-tight">Yorna</span>
        <span className="text-muted-foreground/50">/</span>
        <span className="text-sm text-muted-foreground">{title}</span>
        {saveState === "error" && (
          <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-xs text-destructive">
            Not saved — check vault access
          </span>
        )}
      </div>
      <SessionStar />
    </header>
  );
}

function YornaMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
      <rect x="1" y="1" width="22" height="22" rx="7" fill="var(--star)" />
      <path
        d="M7.5 7l4.5 6 4.5-6M12 13v4.5"
        fill="none"
        stroke="var(--star-foreground)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BottomNav() {
  const view = useYorna((s) => s.view);
  const openNoteId = useYorna((s) => s.openNoteId);
  const { setView, closeNote } = useYorna.getState();

  return (
    <nav className="shrink-0 border-t bg-surface/80 px-4 py-2 backdrop-blur" aria-label="Primary">
      <ul className="mx-auto grid max-w-md grid-cols-3 gap-1">
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = view === id;
          return (
            <li key={id}>
              <button
                onClick={() => {
                  if (id === "notes" && openNoteId) closeNote();
                  setView(id);
                }}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex w-full flex-col items-center gap-1 rounded-xl py-2 text-xs font-medium transition-colors",
                  active ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className={cn("size-5", active && "text-star")} strokeWidth={active ? 2.2 : 1.8} />
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
