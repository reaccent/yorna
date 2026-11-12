import { Check, Repeat, Trash2 } from "lucide-react";
import { useYorna } from "@/lib/store";
import { REMINDER_COLORS, type Reminder } from "@/lib/types";
import { cn } from "@/lib/utils";
import { repeatLabel } from "./repeat";

export const colorHex = (id: string) => REMINDER_COLORS.find((c) => c.id === id)?.hex ?? REMINDER_COLORS[0].hex;

/** One reminder occurrence; for repeating reminders `reminder.date` is the occurrence's day. */
export function ReminderItem({ reminder, compact }: { reminder: Reminder; compact?: boolean }) {
  const { toggleReminderDone, deleteReminder, setEditingReminder } = useYorna.getState();
  const hex = colorHex(reminder.color);
  return (
    <div
      className={cn(
        "group flex items-center gap-2.5 rounded-lg",
        compact ? "px-1.5 py-1" : "px-2 py-1.5 hover:bg-accent/60",
      )}
    >
      <button
        onClick={() => toggleReminderDone(reminder.id, reminder.date)}
        className="flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
        style={{ borderColor: hex, background: reminder.done ? hex : "transparent" }}
        aria-label={reminder.done ? "Mark as not done" : "Mark as done"}
      >
        {reminder.done && <Check className="size-2.5 text-background" strokeWidth={4} />}
      </button>
      <button
        onClick={() => setEditingReminder(reminder.id)}
        className={cn(
          "min-w-0 flex-1 truncate rounded text-left text-sm hover:underline hover:decoration-muted-foreground/50 hover:underline-offset-2",
          reminder.done && "text-muted-foreground line-through",
        )}
        aria-label={`Edit reminder ${reminder.title}`}
      >
        {reminder.title}
      </button>
      {reminder.repeat && (
        <span title={repeatLabel(reminder.repeat, reminder.date)} className="shrink-0 text-muted-foreground">
          <Repeat className="size-3" aria-label={repeatLabel(reminder.repeat, reminder.date)} />
        </span>
      )}
      {reminder.time && (
        <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">{reminder.time}</span>
      )}
      <button
        onClick={() => deleteReminder(reminder.id)}
        className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100"
        aria-label={`Delete reminder ${reminder.title}${reminder.repeat ? " (all repeats)" : ""}`}
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}
