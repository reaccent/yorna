import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { Plus, Star } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { dayKey } from "@/lib/domain";
import type { Reminder } from "@/lib/types";
import { cn } from "@/lib/utils";
import { colorHex, ReminderItem } from "./reminder-item";

const WEEK_OPTS = { weekStartsOn: 1 as const };

interface MonthGridProps {
  month: Date;
  byDay: Map<string, Reminder[]>;
  worked: Set<string>;
  /** Days before this (vault creation) are never shown as missed. */
  since: Date;
  selected?: string;
  onSelectDay(key: string): void;
}

export function MonthGrid({ month, byDay, worked, since, selected, onSelectDay }: MonthGridProps) {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), WEEK_OPTS),
    end: endOfWeek(endOfMonth(month), WEEK_OPTS),
  });
  const weekdays = Array.from({ length: 7 }, (_, i) => format(addDays(startOfWeek(new Date(), WEEK_OPTS), i), "EEE"));
  const today = startOfDay(new Date());
  const tracked = startOfDay(since);

  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5 pb-2">
        {weekdays.map((d) => (
          <div key={d} className="px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d) => {
          const key = dayKey(d);
          const inMonth = isSameMonth(d, month);
          const reminders = byDay.get(key) ?? [];
          const isWorked = worked.has(key);
          const isPast = isBefore(d, today);
          const missed = inMonth && isPast && !isWorked && !isBefore(d, tracked);
          const untracked = inMonth && isPast && !isWorked && !missed;
          const open = inMonth && !isPast && !isWorked;
          const todayCell = isToday(d);

          const cell = (
            <button
              onClick={() => onSelectDay(key)}
              className={cn(
                "group relative flex aspect-square w-full flex-col rounded-xl border p-1.5 text-left transition-colors sm:aspect-auto sm:min-h-[88px] sm:p-2",
                !inMonth && "border-transparent opacity-35",
                open && "bg-card hover:bg-accent",
                missed && "border-dashed border-missed/30 bg-transparent hover:bg-accent/40",
                untracked && "border-transparent bg-transparent text-muted-foreground hover:bg-accent/40",
                isWorked && inMonth && "border-star/40 bg-star/[0.07] hover:bg-star/[0.12]",
                todayCell && "ring-2 ring-star/70",
                selected === key && "border-foreground/50",
              )}
              aria-label={`${format(d, "EEEE, MMMM d")}${isWorked ? ", worked" : missed ? ", not worked" : ""}${
                reminders.length ? `, ${reminders.length} reminder${reminders.length > 1 ? "s" : ""}` : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <span
                  className={cn(
                    "text-xs font-medium tabular-nums sm:text-sm",
                    todayCell && "text-star",
                    missed && "text-missed/80",
                  )}
                >
                  {format(d, "d")}
                </span>
                {isWorked && <Star className="size-3.5 fill-star text-star max-sm:hidden" aria-hidden />}
              </div>
              {reminders.length > 0 && (
                <div className="mt-auto flex flex-wrap items-center gap-1">
                  {reminders.slice(0, 4).map((r) => (
                    <span
                      key={r.id}
                      className={cn("size-1.5 rounded-full sm:size-2", r.done && "opacity-40")}
                      style={{ background: colorHex(r.color) }}
                    />
                  ))}
                  {reminders.length > 4 && (
                    <span className="text-[10px] leading-none text-muted-foreground">+{reminders.length - 4}</span>
                  )}
                </div>
              )}
            </button>
          );

          return (
            <HoverCard key={key} openDelay={180} closeDelay={80}>
              <HoverCardTrigger asChild>{cell}</HoverCardTrigger>
              <HoverCardContent side="top" className="w-72 p-3">
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <p className="text-sm font-medium">{format(d, "EEEE, MMM d")}</p>
                  <span
                    className={cn("text-xs", isWorked ? "text-star" : missed ? "text-missed" : "text-muted-foreground")}
                  >
                    {isWorked ? "Worked" : missed ? "Not worked" : todayCell ? "Today" : isPast ? "" : "Open"}
                  </span>
                </div>
                {reminders.length ? (
                  <div className="-mx-1.5 space-y-0.5">
                    {reminders.map((r) => (
                      <ReminderItem key={r.id} reminder={r} compact />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No reminders.</p>
                )}
                <button
                  onClick={() => onSelectDay(key)}
                  className="mt-2 flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <Plus className="size-3.5" /> Add reminder on this day
                </button>
              </HoverCardContent>
            </HoverCard>
          );
        })}
      </div>
    </div>
  );
}
