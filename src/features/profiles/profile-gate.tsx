import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { YornaMark } from "@/components/yorna-mark";
import { useYorna } from "@/lib/store";
import { ProfileAvatar } from "./profile-avatar";

/** "Who's writing?" — shown on launch only when the vault has more than one profile. */
export function ProfileGate() {
  const profiles = useYorna((s) => s.profiles);
  const { openProfile, createProfile } = useYorna.getState();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const sorted = [...profiles].sort((a, b) => (b.lastOpenedAt ?? "").localeCompare(a.lastOpenedAt ?? ""));

  const create = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      const profile = await createProfile(name);
      setName("");
      await openProfile(profile.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-tauri-drag-region className="flex h-full items-center justify-center overflow-y-auto p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <YornaMark className="size-10" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Who's writing?</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Each profile has its own scripts, calendar and sessions.
            </p>
          </div>
        </div>

        <ul className="space-y-2" aria-label="Profiles">
          {sorted.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => void openProfile(p.id)}
                className="group flex w-full items-center gap-3 rounded-xl border bg-surface px-3 py-3 text-left transition-colors hover:bg-accent"
              >
                <ProfileAvatar profile={p} className="size-10 text-base" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{p.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {p.lastOpenedAt
                      ? `Opened ${formatDistanceToNow(new Date(p.lastOpenedAt), { addSuffix: true })}`
                      : "Not opened yet"}
                  </span>
                </span>
                <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </button>
            </li>
          ))}
        </ul>

        <form
          className="mt-6"
          onSubmit={(e) => {
            e.preventDefault();
            void create();
          }}
        >
          <label htmlFor="new-profile" className="mb-2 block text-sm text-muted-foreground">
            Create a new profile
          </label>
          <div className="relative">
            <Input
              id="new-profile"
              value={name}
              maxLength={40}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter new name…"
              className="h-11 rounded-xl bg-surface pr-12"
            />
            <button
              type="submit"
              disabled={!name.trim() || busy}
              aria-label="Create profile"
              className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg bg-star text-star-foreground transition-opacity disabled:opacity-30"
            >
              <Plus className="size-4" strokeWidth={2.5} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
