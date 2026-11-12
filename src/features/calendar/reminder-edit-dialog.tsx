import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useYorna } from "@/lib/store";
import { REMINDER_COLORS, type ReminderColor, type ReminderRepeat } from "@/lib/types";
import { cn } from "@/lib/utils";
import { RepeatSelect } from "./repeat";

const fieldClass =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm [color-scheme:dark] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30";

export function ReminderEditDialog() {
  const id = useYorna((s) => s.editingReminderId);
  const reminder = useYorna((s) => s.reminders.find((r) => r.id === s.editingReminderId));
  const { setEditingReminder, editReminder, deleteReminder } = useYorna.getState();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [color, setColor] = useState<ReminderColor>("amber");
  const [repeat, setRepeat] = useState<ReminderRepeat | undefined>();

  useEffect(() => {
    if (!reminder) return;
    setTitle(reminder.title);
    setDate(reminder.date);
    setTime(reminder.time ?? "");
    setColor(reminder.color);
    setRepeat(reminder.repeat);
    // Reset the form only when a different reminder is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const close = () => setEditingReminder(null);
  const valid = title.trim().length > 0 && Boolean(date);

  return (
    <Dialog open={Boolean(reminder)} onOpenChange={(o) => !o && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit reminder</DialogTitle>
          <DialogDescription>
            {reminder?.repeat ? "Changes apply to every repeat." : "Timed reminders chime in Yorna when they're due."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!reminder || !valid) return;
            editReminder(reminder.id, { title, date, time: time || undefined, color, repeat });
            close();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="reminder-title">Title</Label>
            <Input id="reminder-title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="reminder-date">{repeat ? "Starts" : "Date"}</Label>
              <input
                id="reminder-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reminder-time">Time (optional)</Label>
              <input
                id="reminder-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={fieldClass}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Repeat</Label>
            <RepeatSelect value={repeat} onChange={setRepeat} date={date} className="w-full" />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-1.5">
              {REMINDER_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id)}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-lg hover:bg-accent",
                    color === c.id && "bg-accent ring-1 ring-ring",
                  )}
                  aria-label={c.label}
                  aria-pressed={color === c.id}
                >
                  <span className="size-4 rounded-full" style={{ background: c.hex }} />
                </button>
              ))}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => {
                if (reminder) deleteReminder(reminder.id);
                close();
              }}
            >
              <Trash2 className="size-4" /> {reminder?.repeat ? "Delete all repeats" : "Delete"}
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" disabled={!valid}>
                Save
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
