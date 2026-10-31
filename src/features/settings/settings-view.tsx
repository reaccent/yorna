import { useEffect, useRef, useState } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { FolderOpen, GitBranch, HardDrive, Music, Play, RotateCcw, Upload, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { playFinishSound } from "@/lib/sound";
import { useYorna } from "@/lib/store";

const MAX_SOUND_BYTES = 8 * 1024 * 1024;
export const GITHUB_URL = "";

async function appVersion() {
  if (isTauri()) {
    const { getVersion } = await import("@tauri-apps/api/app");
    return getVersion();
  }
  return __APP_VERSION__;
}

export function SettingsView() {
  const settings = useYorna((s) => s.settings);
  const vaultKind = useYorna((s) => s.vaultKind);
  const vaultLocation = useYorna((s) => s.vaultLocation);
  const notesCount = useYorna((s) => s.notes.length);
  const sessionsCount = useYorna((s) => s.sessions.length);
  const { updateSettings, setCustomSound, clearCustomSound } = useYorna.getState();
  const [version, setVersion] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    appVersion()
      .then(setVersion)
      .catch(() => setVersion(__APP_VERSION__));
  }, []);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("audio/") && !/\.(mp3|wav|ogg|m4a|aac|flac|webm)$/i.test(file.name)) {
      toast.error("That isn't an audio file", { description: "Use MP3, WAV, OGG, M4A, AAC or FLAC." });
      return;
    }
    if (file.size > MAX_SOUND_BYTES) {
      toast.error("Sound is too large", { description: "Keep the goal sound under 8 MB." });
      return;
    }
    setUploading(true);
    try {
      await setCustomSound(file);
      toast.success("Goal sound updated", { description: file.name });
      void playFinishSound({ customSound: useYorna.getState().settings.customSound, volume: settings.soundVolume });
    } catch (err) {
      toast.error("Couldn't save the sound", { description: String(err) });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const presetMinutes = [15, 30, 60];
  const isPreset = presetMinutes.includes(settings.defaultSessionMinutes);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
      <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Settings</h1>

      <Section title="Sessions" description="What the minutes popup preselects when you open a script.">
        <Row label="Default session length">
          <div className="flex items-center gap-2">
            <Select
              value={isPreset ? String(settings.defaultSessionMinutes) : "custom"}
              onValueChange={(v) => updateSettings({ defaultSessionMinutes: v === "custom" ? 45 : Number(v) })}
            >
              <SelectTrigger className="w-32" aria-label="Default session length">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {presetMinutes.map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {m} minutes
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            {!isPreset && (
              <Input
                type="number"
                min={1}
                max={600}
                value={settings.defaultSessionMinutes}
                onChange={(e) => {
                  const n = Math.round(Number(e.target.value));
                  if (n >= 1 && n <= 600) updateSettings({ defaultSessionMinutes: n });
                }}
                className="w-20 tabular-nums"
                aria-label="Custom default minutes"
              />
            )}
          </div>
        </Row>
      </Section>

      <Section
        title="Goal finish sound"
        description="Plays inside Yorna when a session finishes or a timed reminder is due. No system notifications."
      >
        <Row
          label={
            <span className="flex items-center gap-2">
              <Music className="size-4 text-muted-foreground" />
              {settings.customSound ? settings.customSound.fileName : "Default chime"}
            </span>
          }
          hint={settings.customSound ? "Custom sound saved in your vault" : "Built-in four-note chime"}
        >
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void playFinishSound({ customSound: settings.customSound, volume: settings.soundVolume })}
            >
              <Play className="size-4" /> Preview
            </Button>
            {settings.customSound && (
              <Button variant="ghost" size="sm" onClick={() => void clearCustomSound()}>
                <RotateCcw className="size-4" /> Use default
              </Button>
            )}
            <Button variant="secondary" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
              <Upload className="size-4" /> {uploading ? "Saving…" : "Upload sound"}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac"
              className="hidden"
              onChange={(e) => void onFile(e.target.files?.[0])}
            />
          </div>
        </Row>
        <Row label="Volume">
          <div className="flex w-48 items-center gap-3">
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.soundVolume}
              onChange={(e) => updateSettings({ soundVolume: Number(e.target.value) })}
              className="w-full accent-[var(--star)]"
              aria-label="Sound volume"
            />
            <span className="w-9 text-right text-sm text-muted-foreground tabular-nums">
              {Math.round(settings.soundVolume * 100)}%
            </span>
          </div>
        </Row>
      </Section>

      <Section title="Vault" description="Yorna is local-first: your scripts live on this device.">
        <Row
          label={
            <span className="flex items-center gap-2">
              <HardDrive className="size-4 text-muted-foreground" />
              {vaultKind === "filesystem" ? "Vault folder" : "Browser vault (dev mode)"}
            </span>
          }
          hint={<span className="font-mono text-xs break-all">{vaultLocation}</span>}
        >
          {vaultKind === "filesystem" && (
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                const { revealItemInDir } = await import("@tauri-apps/plugin-opener");
                await revealItemInDir(vaultLocation).catch((err) => toast.error(String(err)));
              }}
            >
              <FolderOpen className="size-4" /> Show folder
            </Button>
          )}
        </Row>
        <Row label="Contents">
          <span className="text-sm text-muted-foreground">
            {notesCount} script{notesCount === 1 ? "" : "s"} · {sessionsCount} finished session
            {sessionsCount === 1 ? "" : "s"}
          </span>
        </Row>
        <Row label="Cloud sync" hint="Optional Google Drive sync is planned after the MVP.">
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">Coming later</span>
        </Row>
      </Section>

      <Section title="About">
        <Row label="Current app version">
          <span className="font-mono text-sm text-muted-foreground">v{version || "…"}</span>
        </Row>
        <Row
          label={
            <span className="flex items-center gap-2">
              <User className="size-4 text-muted-foreground" /> Profile
            </span>
          }
          hint="Single-user for now. Switching accounts arrives with multi-profile support."
        >
          <span className="text-sm text-muted-foreground">You</span>
        </Row>
        <Row
          label={
            <span className="flex items-center gap-2">
              <GitBranch className="size-4 text-muted-foreground" /> GitHub page
            </span>
          }
        >
          {GITHUB_URL ? (
            <Button variant="ghost" size="sm" asChild>
              <a href={GITHUB_URL} target="_blank" rel="noreferrer">
                Open
              </a>
            </Button>
          ) : (
            <span className="text-sm text-muted-foreground">Not published yet</span>
          )}
        </Row>
      </Section>
    </div>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-surface">
      <header className="px-5 pt-4 pb-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </header>
      <div className="divide-y">{children}</div>
    </section>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="mt-0.5 text-sm text-muted-foreground">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
