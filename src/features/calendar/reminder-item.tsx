import { Check, Trash2 } from "lucide-react";
import { useYorna } from "@/lib/store";
import { REMINDER_COLORS, type Reminder } from "@/lib/types";
import { cn } from "@/lib/utils";

export const colorHex = (id: string) => REMINDER_COLORS.find((c) => c.id === id)?.hex ?? REMINDER_COLORS[0].hex;

export function ReminderItem({ reminder, compact }: { reminder: Reminder; compact?: boolean }) {
  const { updateReminder, deleteReminder } = useYorna.getState();
  const hex = colorHex(reminder.color);
  return (
    <div
      className={cn(
        "group flex items-center gap-2.5 rounded-lg",
        compact ? "px-1.5 py-1" : "px-2 py-1.5 hover:bg-accent/60",
      )}
    >
      <button
        onClick={() => updateReminder(reminder.id, { done: !reminder.done })}
        className="flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
        style={{ borderColor: hex, background: reminder.done ? hex : "transparent" }}
        aria-label={reminder.done ? "Mark as not done" : "Mark as done"}
      >
        {reminder.done && <Check className="size-2.5 text-background" strokeWidth={4} />}
      </button>
      <span className={cn("min-w-0 flex-1 truncate text-sm", reminder.done && "text-muted-foreground line-through")}>
        {reminder.title}
      </span>
      {reminder.time && (
        <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">{reminder.time}</span>
      )}
      <button
        onClick={() => deleteReminder(reminder.id)}
        className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100"
        aria-label={`Delete reminder ${reminder.title}`}
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}
