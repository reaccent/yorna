import { Check, Copy } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";

type Variant = "ink" | "outline" | "amber" | "cream" | "outline-cream";

const VARIANTS: Record<Variant, string> = {
  ink: "bg-ink text-cream hover:bg-ink-3",
  amber: "bg-amber text-ink hover:bg-amber-deep",
  cream: "bg-cream text-ink hover:bg-paper-2",
  outline: "border-2 border-ink text-ink hover:bg-ink hover:text-cream",
  "outline-cream": "border-2 border-cream/40 text-cream hover:border-cream hover:bg-cream hover:text-ink",
};

interface ButtonLinkProps {
  to: string;
  children: ReactNode;
  variant?: Variant;
  className?: string;
}

export function ButtonLink({ to, children, variant = "ink", className = "" }: ButtonLinkProps) {
  const cls = `inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-semibold transition-colors ${VARIANTS[variant]} ${className}`;
  if (/^https?:/.test(to)) {
    return (
      <a href={to} target="_blank" rel="noreferrer" className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link to={to} className={cls}>
      {children}
    </Link>
  );
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`text-[13px] font-semibold tracking-[0.14em] uppercase ${className}`}>{children}</p>;
}

export interface Shot {
  src: string;
  alt: string;
  /** Pixel size of the 2x capture; window captures are 2560×1760. */
  width?: number;
  height?: number;
  /** A cropped dialog or panel: shown at its natural size, centered, without window controls. */
  crop?: boolean;
}

interface ScreenshotProps extends Shot {
  className?: string;
  eager?: boolean;
}

/** Product capture in a flat window frame: solid title bar, 2px ink rule, no shadow. */
export function Screenshot({ src, alt, width = 2560, height = 1760, crop, className = "", eager }: ScreenshotProps) {
  return (
    <figure
      className={`border-ink bg-ink overflow-hidden rounded-2xl border-2 ${crop ? "flex items-center justify-center p-6 sm:p-10" : ""} ${className}`}
    >
      {!crop && (
        <div className="flex h-8 items-center gap-1.5 px-3.5" aria-hidden="true">
          <span className="bg-coral size-2.5 rounded-full" />
          <span className="bg-amber size-2.5 rounded-full" />
          <span className="bg-mint size-2.5 rounded-full" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        className={crop ? "block h-auto w-full rounded-xl" : "block h-auto w-full"}
        style={crop ? { maxWidth: width / 2 } : undefined}
      />
    </figure>
  );
}

export function CodeBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="on-ink bg-ink text-cream overflow-hidden rounded-xl">
      <div className="border-ink-line flex items-center justify-between border-b px-4 py-2">
        <span className="text-cream-soft font-mono text-xs">{label ?? "terminal"}</span>
        <button
          type="button"
          onClick={copy}
          className="text-cream-soft hover:bg-ink-3 hover:text-cream inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors"
          aria-label={copied ? "Copied" : "Copy to clipboard"}
        >
          {copied ? <Check className="text-mint size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-4 font-mono text-[13.5px] leading-6">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function IconTile({ icon, color }: { icon: ReactNode; color: string }) {
  return (
    <span className={`text-ink inline-flex size-11 shrink-0 items-center justify-center rounded-xl ${color}`}>
      {icon}
    </span>
  );
}

export function CheckList({ items, tone = "paper" }: { items: ReactNode[]; tone?: "paper" | "ink" }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-[15px] leading-6">
          <span
            className={`mt-1 inline-flex size-4 shrink-0 items-center justify-center rounded-full ${
              tone === "ink" ? "bg-amber text-ink" : "bg-ink text-amber"
            }`}
          >
            <Check className="size-3" strokeWidth={3} />
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
