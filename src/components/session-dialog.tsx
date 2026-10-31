import { useEffect, useState } from "react";
import { Play } from "lucide-react";
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
import { StarRing } from "@/components/star-ring";
import { cn } from "@/lib/utils";

const PRESETS = [15, 30, 60];

interface SessionDialogProps {
  open: boolean;
  onOpenChange(open: boolean): void;
  defaultMinutes: number;
  noteTitle?: string;
  onStart(minutes: number): void;
}

export function SessionDialog({ open, onOpenChange, defaultMinutes, noteTitle, onStart }: SessionDialogProps) {
  const [choice, setChoice] = useState<number | "custom">(30);
  const [custom, setCustom] = useState("45");

  useEffect(() => {
    if (!open) return;
    if (PRESETS.includes(defaultMinutes)) {
      setChoice(defaultMinutes);
    } else {
      setChoice("custom");
      setCustom(String(defaultMinutes));
    }
  }, [open, defaultMinutes]);

  const customMinutes = Number(custom);
  const customValid = Number.isFinite(customMinutes) && customMinutes >= 1 && customMinutes <= 600;
  const minutes = choice === "custom" ? customMinutes : choice;
  const canStart = choice !== "custom" || customValid;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <StarRing progress={0} size={64} stroke={3.5} className="mb-1 text-foreground" />
          <DialogTitle className="text-xl">How long will you work?</DialogTitle>
          <DialogDescription className="text-balance">
            {noteTitle ? (
              <>
                Session for <span className="text-foreground">{noteTitle}</span>. Finish it and today counts as a worked
                day.
              </>
            ) : (
              "Finish the session and today counts as a worked day."
            )}
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (canStart) onStart(minutes);
          }}
        >
          <div className="py-1 text-center text-5xl font-light tracking-tight tabular-nums">
            {canStart ? `${minutes}:00` : "--:--"}
          </div>
          <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Session length">
            {PRESETS.map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={choice === m}
                onClick={() => setChoice(m)}
                className={cn(
                  "h-10 rounded-lg border text-sm tabular-nums transition-colors",
                  choice === m
                    ? "border-star bg-star/15 text-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {m}:00
              </button>
            ))}
            <button
              type="button"
              role="radio"
              aria-checked={choice === "custom"}
              onClick={() => setChoice("custom")}
              className={cn(
                "h-10 rounded-lg border text-sm transition-colors",
                choice === "custom"
                  ? "border-star bg-star/15 text-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              Custom
            </button>
          </div>
          {choice === "custom" && (
            <div className="flex items-center gap-3">
              <Input
                autoFocus
                type="number"
                min={1}
                max={600}
                inputMode="numeric"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                aria-label="Custom minutes"
                aria-invalid={!customValid}
                className="tabular-nums"
              />
              <span className="text-sm text-muted-foreground">minutes</span>
            </div>
          )}
          <DialogFooter className="gap-2 sm:justify-between">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Not now
            </Button>
            <Button type="submit" disabled={!canStart} className="bg-star text-star-foreground hover:bg-star/90">
              <Play className="size-4" /> Start session
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
