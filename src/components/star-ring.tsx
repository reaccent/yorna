import { useId } from "react";
import { cn } from "@/lib/utils";

const STAR_PATH =
  "M12 2.6l2.93 5.94 6.56.95-4.75 4.63 1.12 6.53L12 17.57l-5.86 3.08 1.12-6.53L2.51 9.49l6.56-.95L12 2.6z";

interface StarRingProps {
  /** 0–1 */
  progress: number;
  size?: number;
  stroke?: number;
  /** Fully filled star with no ring track, e.g. a completed day. */
  complete?: boolean;
  className?: string;
  muted?: boolean;
}

/** Progress ring around a star whose fill rises with the same progress. */
export function StarRing({ progress, size = 40, stroke = 3, complete, className, muted }: StarRingProps) {
  const id = useId().replace(/:/g, "");
  const p = complete ? 1 : Math.max(0, Math.min(1, progress));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const starSize = size * 0.52;
  const offset = (size - starSize) / 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn("shrink-0", className)}
      role="img"
      aria-label={`${Math.round(p * 100)}% of session complete`}
    >
      <defs>
        <linearGradient id={`fill-${id}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset={p} stopColor="var(--star)" />
          <stop offset={p} stopColor="var(--star)" stopOpacity={0} />
        </linearGradient>
      </defs>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeOpacity={muted ? 0.12 : 0.18}
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--star)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - p)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 600ms ease" }}
      />
      <g transform={`translate(${offset} ${offset}) scale(${starSize / 24})`}>
        <path
          d={STAR_PATH}
          fill={`url(#fill-${id})`}
          stroke={p > 0 ? "var(--star)" : "currentColor"}
          strokeOpacity={p > 0 ? 1 : 0.55}
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
