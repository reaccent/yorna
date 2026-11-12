import { colorHex } from "@/features/calendar/reminder-item";
import { profileInitial } from "@/lib/profiles";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProfileAvatar({
  profile,
  className,
}: {
  profile: Pick<Profile, "name" | "color">;
  className?: string;
}) {
  const hex = colorHex(profile.color);
  return (
    <span
      aria-hidden
      className={cn("flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold", className)}
      style={{ background: `${hex}26`, color: hex, boxShadow: `inset 0 0 0 1.5px ${hex}66` }}
    >
      {profileInitial(profile.name)}
    </span>
  );
}
