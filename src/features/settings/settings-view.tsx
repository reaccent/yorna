import { useEffect, useRef, useState } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { GitBranch, Music, Play, RotateCcw, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProfilesSection } from "@/features/profiles/profiles-section";
import { playFinishSound } from "@/lib/sound";
import { useYorna } from "@/lib/store";
import { Row, Section } from "./section";
import { VaultSection } from "./vault-section";

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

      <ProfilesSection />

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

      <VaultSection />

      <Section title="About">
        <Row label="Current app version">
          <span className="font-mono text-sm text-muted-foreground">v{version || "…"}</span>
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
