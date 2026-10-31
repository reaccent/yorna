import { getVault } from "./vault";
import type { CustomSound } from "./types";

let ctx: AudioContext | null = null;
let customUrl: { path: string; url: string } | null = null;

function audioContext() {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Built-in goal chime: a soft rising major arpeggio, so no audio asset ships with the app. */
export function playDefaultChime(volume: number) {
  const ac = audioContext();
  const master = ac.createGain();
  master.gain.value = Math.max(0, Math.min(1, volume)) * 0.5;
  master.connect(ac.destination);
  const notes = [659.25, 830.61, 987.77, 1318.51];
  notes.forEach((freq, i) => {
    const t = ac.currentTime + i * 0.14;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.9, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
    osc.connect(gain).connect(master);
    osc.start(t);
    osc.stop(t + 1.2);
  });
}

async function customSoundUrl(sound: CustomSound): Promise<string | null> {
  if (customUrl?.path === sound.vaultPath) return customUrl.url;
  const bytes = await getVault().readBytes(sound.vaultPath);
  if (!bytes) return null;
  if (customUrl) URL.revokeObjectURL(customUrl.url);
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: sound.mime }));
  customUrl = { path: sound.vaultPath, url };
  return url;
}

export function forgetCustomSound() {
  if (customUrl) URL.revokeObjectURL(customUrl.url);
  customUrl = null;
}

export async function playFinishSound(opts: { customSound?: CustomSound; volume: number }) {
  if (opts.customSound) {
    try {
      const url = await customSoundUrl(opts.customSound);
      if (url) {
        const audio = new Audio(url);
        audio.volume = Math.max(0, Math.min(1, opts.volume));
        await audio.play();
        return;
      }
    } catch (err) {
      console.warn("Custom finish sound failed, using default chime", err);
    }
  }
  playDefaultChime(opts.volume);
}
