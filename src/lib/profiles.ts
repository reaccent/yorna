import { newId } from "./domain";
import { REMINDER_COLORS, type Profile, type ProfileRegistry } from "./types";
import { getRootVault, PROFILES_FILE } from "./vault";

/**
 * The first profile owns the vault root, so vaults created before profiles
 * existed keep working untouched; extra profiles live in `profiles/<dir>/`.
 */
export const PRIMARY_PROFILE_ID = "primary";

function primaryProfile(createdAt: string): Profile {
  return { id: PRIMARY_PROFILE_ID, name: "You", dir: "", color: "amber", createdAt };
}

/** `profiles.json` as this device last read or wrote it. */
let lastSeen: string | null = null;

export async function readRegistry(): Promise<ProfileRegistry> {
  const raw = await getRootVault().readText(PROFILES_FILE);
  lastSeen = raw;
  if (raw) {
    const data = JSON.parse(raw) as ProfileRegistry;
    if (Array.isArray(data.profiles) && data.profiles.length) return data;
  }
  return { schema: 1, profiles: [primaryProfile(new Date().toISOString())] };
}

export async function writeRegistry(registry: ProfileRegistry) {
  const text = JSON.stringify(registry, null, 2);
  await getRootVault().writeText(PROFILES_FILE, text);
  lastSeen = text;
}

export async function registryChangedOnDisk() {
  return (await getRootVault().readText(PROFILES_FILE)) !== lastSeen;
}

function slug(name: string) {
  const s = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  return s || "profile";
}

export function makeProfile(name: string, existing: Profile[]): Profile {
  const id = newId();
  const used = new Set(existing.map((p) => p.color));
  const color = REMINDER_COLORS.find((c) => !used.has(c.id))?.id ?? REMINDER_COLORS[existing.length % 6].id;
  return {
    id,
    name: name.trim(),
    dir: `profiles/${slug(name)}-${id.replace(/-/g, "").slice(0, 6)}`,
    color,
    createdAt: new Date().toISOString(),
  };
}

export const profileInitial = (name: string) => (name.trim()[0] ?? "?").toUpperCase();
