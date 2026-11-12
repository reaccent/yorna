import { format } from "date-fns";
import { Repeat } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { parseDayKey } from "@/lib/domain";
import type { ReminderRepeat } from "@/lib/types";
import { cn } from "@/lib/utils";

export function repeatLabel(repeat: ReminderRepeat | undefined, date: string) {
  const d = date ? parseDayKey(date) : new Date();
  switch (repeat) {
    case "daily":
      return "Every day";
    case "weekly":
      return `Every week on ${format(d, "EEEE")}`;
    case "monthly":
      return `Every month on the ${format(d, "do")}`;
    default:
      return "Does not repeat";
  }
}

const SHORT: Record<string, string> = { none: "Once", daily: "Daily", weekly: "Weekly", monthly: "Monthly" };

export function RepeatSelect({
  value,
  onChange,
  date,
  compact,
  className,
}: {
  value: ReminderRepeat | undefined;
  onChange(value: ReminderRepeat | undefined): void;
  date: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Select value={value ?? "none"} onValueChange={(v) => onChange(v === "none" ? undefined : (v as ReminderRepeat))}>
      <SelectTrigger
        aria-label="Repeat"
        className={cn(compact && "h-9 gap-1.5 border-0 bg-muted/60 px-2.5 text-sm dark:bg-muted/60", className)}
      >
        {compact ? (
          <span className={cn("flex items-center gap-1.5", !value && "text-muted-foreground")}>
            <Repeat className="size-3.5" />
            {SHORT[value ?? "none"]}
          </span>
        ) : (
          <SelectValue />
        )}
      </SelectTrigger>
      {/* The compact trigger has no SelectValue, which item-aligned positioning needs to place the list. */}
      <SelectContent position={compact ? "popper" : "item-aligned"} align="start">
        {(["none", "daily", "weekly", "monthly"] as const).map((r) => (
          <SelectItem key={r} value={r}>
            {repeatLabel(r === "none" ? undefined : r, date)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
