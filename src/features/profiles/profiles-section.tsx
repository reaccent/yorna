import { useState } from "react";
import { ArrowLeftRight, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Row, Section } from "@/features/settings/section";
import { PRIMARY_PROFILE_ID } from "@/lib/profiles";
import { useYorna } from "@/lib/store";
import type { Profile } from "@/lib/types";
import { ProfileAvatar } from "./profile-avatar";

const errorText = (err: unknown) => (err instanceof Error ? err.message : String(err));

export function ProfilesSection() {
  const profiles = useYorna((s) => s.profiles);
  const activeId = useYorna((s) => s.activeProfileId);
  const { chooseProfile, createProfile, openProfile } = useYorna.getState();
  const [name, setName] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Profile | null>(null);

  const add = async () => {
    try {
      const profile = await createProfile(name);
      setName("");
      toast.success(`Profile “${profile.name}” created`, {
        action: { label: "Switch", onClick: () => void openProfile(profile.id) },
      });
    } catch (err) {
      toast.error(errorText(err));
    }
  };

  return (
    <Section
      title="Profiles"
      description="Each profile keeps its own scripts, reminders, sessions and settings in its own vault folder."
      action={
        profiles.length > 1 && (
          <Button variant="secondary" size="sm" onClick={() => void chooseProfile()}>
            <ArrowLeftRight className="size-4" /> Switch accounts
          </Button>
        )
      }
    >
      {profiles.map((p) => (
        <ProfileRow
          key={p.id}
          profile={p}
          active={p.id === activeId}
          onSwitch={() => void openProfile(p.id)}
          onDelete={() => setPendingDelete(p)}
        />
      ))}
      <form
        className="flex items-center gap-2 px-5 py-3"
        onSubmit={(e) => {
          e.preventDefault();
          void add();
        }}
      >
        <Input
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter new name…"
          aria-label="New profile name"
          className="h-9 flex-1"
        />
        <Button type="submit" variant="secondary" size="sm" className="h-9" disabled={!name.trim()}>
          <Plus className="size-4" /> Create profile
        </Button>
      </form>

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete profile “{pendingDelete?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Its scripts, reminders, sessions and goal sound are removed from the vault folder{" "}
              <span className="font-mono text-xs">{pendingDelete?.dir}</span>. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                const target = pendingDelete;
                setPendingDelete(null);
                if (target) {
                  useYorna
                    .getState()
                    .deleteProfile(target.id)
                    .then(() => toast.success(`Deleted “${target.name}”`))
                    .catch((err) => toast.error(errorText(err)));
                }
              }}
            >
              Delete profile
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Section>
  );
}

function ProfileRow({
  profile,
  active,
  onSwitch,
  onDelete,
}: {
  profile: Profile;
  active: boolean;
  onSwitch(): void;
  onDelete(): void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile.name);

  const save = async () => {
    setEditing(false);
    if (draft.trim() && draft.trim() !== profile.name) {
      await useYorna
        .getState()
        .renameProfile(profile.id, draft)
        .catch((err) => toast.error(errorText(err)));
    }
  };

  return (
    <Row
      label={
        <span className="flex items-center gap-3">
          <ProfileAvatar profile={profile} />
          {editing ? (
            <form
              className="flex items-center gap-1"
              onSubmit={(e) => {
                e.preventDefault();
                void save();
              }}
            >
              <Input
                autoFocus
                value={draft}
                maxLength={40}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
                aria-label="Profile name"
                className="h-8 w-48"
              />
              <Button type="submit" size="icon" variant="ghost" className="size-8" aria-label="Save name">
                <Check className="size-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-8"
                aria-label="Cancel rename"
                onClick={() => setEditing(false)}
              >
                <X className="size-4" />
              </Button>
            </form>
          ) : (
            <span className="flex items-center gap-2">
              {profile.name}
              {active && (
                <span className="rounded-full bg-star/15 px-2 py-0.5 text-[11px] font-medium text-star">Current</span>
              )}
            </span>
          )}
        </span>
      }
    >
      {!editing && (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground"
            aria-label={`Rename ${profile.name}`}
            onClick={() => {
              setDraft(profile.name);
              setEditing(true);
            }}
          >
            <Pencil className="size-3.5" />
          </Button>
          {!active && profile.id !== PRIMARY_PROFILE_ID && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-destructive"
              aria-label={`Delete ${profile.name}`}
              onClick={onDelete}
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
          {!active && (
            <Button variant="secondary" size="sm" onClick={onSwitch}>
              Switch
            </Button>
          )}
        </div>
      )}
    </Row>
  );
}
