import { useMemo, useState } from "react";
import { addMonths, format, formatDistanceToNow, isSameMonth, isToday, isTomorrow, startOfMonth } from "date-fns";
import { ArrowRight, BellRing, ChevronLeft, ChevronRight, FilePlus2, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { compareReminders, dayKey, monthStats, parseDayKey, remindersByDay, workedDaySet } from "@/lib/domain";
import { useYorna } from "@/lib/store";
import { cn } from "@/lib/utils";
import { MonthGrid } from "./month-grid";
import { ReminderBar } from "./reminder-bar";
import { ReminderItem } from "./reminder-item";

export function CalendarView() {
  const reminders = useYorna((s) => s.reminders);
  const sessions = useYorna((s) => s.sessions);
  const createdAt = useYorna((s) => s.createdAt);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [barOpen, setBarOpen] = useState(false);
  const [barDate, setBarDate] = useState(() => dayKey(new Date()));

  const byDay = useMemo(() => remindersByDay(reminders), [reminders]);
  const worked = useMemo(() => workedDaySet(sessions), [sessions]);
  const since = useMemo(() => new Date(createdAt), [createdAt]);
  const stats = monthStats(month, worked, since);

  const selectDay = (key: string) => {
    setBarDate(key);
    setBarOpen(true);
    const d = parseDayKey(key);
    if (!isSameMonth(d, month)) setMonth(startOfMonth(d));
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-4 sm:p-6">
      <QuickCreate />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-2xl border bg-surface p-4 sm:p-5" aria-label="Month">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              <h1 className="mr-2 text-xl font-semibold tracking-tight sm:text-2xl">{format(month, "MMMM yyyy")}</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMonth((m) => addMonths(m, -1))}
                aria-label="Previous month"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMonth((m) => addMonths(m, 1))}
                aria-label="Next month"
              >
                <ChevronRight className="size-4" />
              </Button>
              {!stats.isCurrentMonth && (
                <Button variant="ghost" size="sm" onClick={() => setMonth(startOfMonth(new Date()))}>
                  Today
                </Button>
              )}
            </div>
            <ReminderBar open={barOpen} onOpenChange={setBarOpen} date={barDate} onDateChange={setBarDate} />
          </div>

          <MonthGrid
            month={month}
            byDay={byDay}
            worked={worked}
            since={since}
            selected={barOpen ? barDate : undefined}
            onSelectDay={selectDay}
          />

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <Legend className="border-star/50 bg-star/30" label="Worked — finished a session" />
            <Legend className="bg-card" label="Open — still yours to work" />
            <Legend className="border-dashed border-missed/50" label="Not worked" />
          </div>
        </section>

        <aside className="flex flex-col gap-5">
          <MonthLeft stats={stats} month={month} />
          <Upcoming />
        </aside>
      </div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("size-3 rounded border", className)} />
      {label}
    </span>
  );
}

function MonthLeft({ stats, month }: { stats: ReturnType<typeof monthStats>; month: Date }) {
  const seg = (n: number) => `${(n / stats.totalDays) * 100}%`;
  return (
    <section className="rounded-2xl border bg-surface p-5" aria-label="Month progress">
      <p className="text-sm text-muted-foreground">{format(month, "MMMM")} left to work</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-5xl font-semibold tracking-tight tabular-nums">{stats.percentLeft}%</span>
        <span className="text-sm text-muted-foreground">left</span>
      </div>
      <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
        <div className="bg-star" style={{ width: seg(stats.worked) }} />
        <div className="bg-missed/70" style={{ width: seg(stats.missed) }} />
        <div className="bg-foreground/25" style={{ width: seg(stats.openDays) }} />
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        <Stat label="Open" value={stats.openDays} emphasis />
        <Stat label="Worked" value={stats.worked} className="text-star" />
        <Stat label="Not worked" value={stats.missed} className="text-missed" />
      </dl>
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        {stats.isPastMonth
          ? `Month closed with ${stats.worked} worked day${stats.worked === 1 ? "" : "s"}.`
          : stats.openDays === 0
            ? "Every remaining day is worked. Nice."
            : `${stats.openDays} unworked day${stats.openDays === 1 ? "" : "s"} still ahead. A day counts once you finish a session.`}
      </p>
    </section>
  );
}

function Stat({
  label,
  value,
  className,
  emphasis,
}: {
  label: string;
  value: number;
  className?: string;
  emphasis?: boolean;
}) {
  return (
    <div className={cn("rounded-lg py-2", emphasis ? "bg-card" : "bg-muted/40")}>
      <dd className={cn("text-lg font-semibold tabular-nums", className)}>{value}</dd>
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
    </div>
  );
}

function Upcoming() {
  const reminders = useYorna((s) => s.reminders);
  const today = dayKey(new Date());
  const upcoming = reminders
    .filter((r) => r.date >= today && !r.done)
    .sort(compareReminders)
    .slice(0, 12);
  const groups = new Map<string, typeof upcoming>();
  for (const r of upcoming) groups.set(r.date, [...(groups.get(r.date) ?? []), r]);

  const label = (key: string) => {
    const d = parseDayKey(key);
    if (isToday(d)) return "Today";
    if (isTomorrow(d)) return "Tomorrow";
    return format(d, "EEE, MMM d");
  };

  return (
    <section className="flex-1 rounded-2xl border bg-surface p-5" aria-label="Upcoming reminders">
      <h2 className="mb-3 text-sm font-medium">Upcoming</h2>
      {upcoming.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <BellRing className="size-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No upcoming reminders.</p>
          <p className="text-xs text-muted-foreground/80">Click a day or “New reminder” to plan uploads and shoots.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {[...groups].map(([key, list]) => (
            <div key={key}>
              <p className="mb-1 px-2 text-xs font-medium text-muted-foreground uppercase">{label(key)}</p>
              {list.map((r) => (
                <ReminderItem key={r.id} reminder={r} />
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function QuickCreate() {
  const [title, setTitle] = useState("");
  const notes = useYorna((s) => s.notes);
  const lastId = useYorna((s) => s.settings.lastEditedNoteId);
  const { createNote, openNote } = useYorna.getState();
  const last = notes.find((n) => n.id === lastId) ?? [...notes].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))[0];

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <form
        className="relative flex-1"
        onSubmit={(e) => {
          e.preventDefault();
          openNote(createNote({ title }));
          setTitle("");
        }}
      >
        <FilePlus2 className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Create a new note…"
          className="h-11 rounded-xl bg-surface pr-24 pl-10 text-[15px]"
          aria-label="New note title"
        />
        <kbd className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground sm:block">
          Enter
        </kbd>
      </form>
      {last && (
        <button
          onClick={() => openNote(last.id)}
          className="group flex h-11 min-w-0 items-center gap-2.5 rounded-xl border bg-surface px-4 text-left text-sm transition-colors hover:bg-accent sm:max-w-sm"
        >
          <History className="size-4 shrink-0 text-muted-foreground" />
          <span className="shrink-0 text-muted-foreground">Last edited</span>
          <span className="min-w-0 truncate font-medium">{last.title}</span>
          <span className="hidden shrink-0 text-xs text-muted-foreground md:inline">
            {formatDistanceToNow(new Date(last.updatedAt), { addSuffix: true })}
          </span>
          <ArrowRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </button>
      )}
    </div>
  );
}
