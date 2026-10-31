import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useYorna } from "@/lib/store";
import { REMINDER_COLORS, type ReminderColor } from "@/lib/types";
import { cn } from "@/lib/utils";
import { colorHex } from "./reminder-item";

interface ReminderBarProps {
  open: boolean;
  onOpenChange(open: boolean): void;
  date: string;
  onDateChange(date: string): void;
}

/** "New reminder" create bar: Date | color | time | title. */
export function ReminderBar({ open, onOpenChange, date, onDateChange }: ReminderBarProps) {
  const addReminder = useYorna((s) => s.addReminder);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [color, setColor] = useState<ReminderColor>("amber");
  const [colorOpen, setColorOpen] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) titleRef.current?.focus();
  }, [open, date]);

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => onOpenChange(true)} className="h-10">
        <Plus className="size-4" /> New reminder
      </Button>
    );
  }

  const submit = () => {
    if (!title.trim() || !date) return;
    addReminder({ date, title, color, time: time || undefined });
    setTitle("");
    titleRef.current?.focus();
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onOpenChange(false);
      }}
      className="flex w-full flex-wrap items-center gap-2 rounded-xl border bg-card p-2 shadow-lg shadow-black/20 sm:flex-nowrap"
      aria-label="New reminder"
    >
      <label className="flex h-9 items-center gap-2 rounded-lg bg-muted/60 pl-3 text-sm text-muted-foreground">
        Date
        <input
          type="date"
          required
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="h-9 bg-transparent pr-2 text-foreground [color-scheme:dark] outline-none"
        />
      </label>

      <Popover open={colorOpen} onOpenChange={setColorOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/60 hover:bg-accent"
            aria-label={`Reminder color: ${color}`}
          >
            <span className="size-4 rounded-full" style={{ background: colorHex(color) }} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="flex gap-1.5">
            {REMINDER_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setColor(c.id);
                  setColorOpen(false);
                }}
                className={cn(
                  "flex size-8 items-center justify-center rounded-lg hover:bg-accent",
                  color === c.id && "bg-accent ring-1 ring-ring",
                )}
                aria-label={c.label}
                title={c.label}
              >
                <span className="size-4 rounded-full" style={{ background: c.hex }} />
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <input
        type="time"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        aria-label="Time (optional — chimes when due)"
        title="Optional time — Yorna chimes when it's due"
        className="h-9 rounded-lg bg-muted/60 px-2 text-sm text-foreground [color-scheme:dark] outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      />

      <Input
        ref={titleRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="New reminder…"
        className="h-9 min-w-40 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
        aria-label="Reminder title"
      />
      <div className="flex gap-1">
        <Button type="submit" size="sm" className="h-9" disabled={!title.trim() || !date}>
          Add
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-9"
          onClick={() => onOpenChange(false)}
          aria-label="Close"
        >
          <X className="size-4" />
        </Button>
      </div>
    </form>
  );
}
