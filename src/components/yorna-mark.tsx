import { cn } from "@/lib/utils";

export function YornaMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-6", className)} aria-hidden>
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
