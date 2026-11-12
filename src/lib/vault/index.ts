import { isTauri } from "@tauri-apps/api/core";
import { createBrowserVault } from "./browser";
import { createTauriVault } from "./tauri";

/**
 * Minimal file-like storage. Paths are relative to the vault root and use `/`.
 * Desktop builds write real files (Obsidian-style); the web dev build mirrors
 * the same layout in IndexedDB.
 */
export interface VaultFS {
  kind: "filesystem" | "browser";
  /** Human-readable location of the vault root. */
  location(): Promise<string>;
  readText(path: string): Promise<string | null>;
  writeText(path: string, data: string): Promise<void>;
  readBytes(path: string): Promise<Uint8Array | null>;
  writeBytes(path: string, data: Uint8Array): Promise<void>;
  remove(path: string): Promise<void>;
  /** Recursively removes a folder and everything in it. */
  removeDir(path: string): Promise<void>;
}

let root: VaultFS | null = null;
let profile: { dir: string; vault: VaultFS } | null = null;

/** Serializes writes/removes per path so overlapping saves never race on the same file. */
function withWriteQueue(inner: VaultFS): VaultFS {
  const tails = new Map<string, Promise<unknown>>();
  const enqueue = <T>(path: string, op: () => Promise<T>): Promise<T> => {
    const run = (tails.get(path) ?? Promise.resolve()).catch(() => undefined).then(op);
    tails.set(path, run);
    void run.finally(() => {
      if (tails.get(path) === run) tails.delete(path);
    });
    return run;
  };
  return {
    ...inner,
    writeText: (path, data) => enqueue(path, () => inner.writeText(path, data)),
    writeBytes: (path, data) => enqueue(path, () => inner.writeBytes(path, data)),
    remove: (path) => enqueue(path, () => inner.remove(path)),
    removeDir: (path) => enqueue(path, () => inner.removeDir(path)),
  };
}

/** A view of `inner` rooted at `dir`, so each profile only ever sees its own folder. */
function scoped(inner: VaultFS, dir: string): VaultFS {
  if (!dir) return inner;
  const at = (path: string) => `${dir}/${path}`;
  return {
    kind: inner.kind,
    location: async () => `${await inner.location()}/${dir}`,
    readText: (p) => inner.readText(at(p)),
    writeText: (p, d) => inner.writeText(at(p), d),
    readBytes: (p) => inner.readBytes(at(p)),
    writeBytes: (p, d) => inner.writeBytes(at(p), d),
    remove: (p) => inner.remove(at(p)),
    removeDir: (p) => inner.removeDir(at(p)),
  };
}

/** The whole vault: the profile registry and every profile folder. */
export function getRootVault(): VaultFS {
  if (!root) root = withWriteQueue(isTauri() ? createTauriVault() : createBrowserVault());
  return root;
}

/** Points {@link getVault} at a profile folder (`""` is the vault root). */
export function setProfileDir(dir: string) {
  profile = { dir, vault: scoped(getRootVault(), dir) };
}

/** The active profile's files: `yorna.json`, `notes/`, `sounds/`. */
export function getVault(): VaultFS {
  if (!profile) setProfileDir("");
  return profile!.vault;
}

export const INDEX_FILE = "yorna.json";
export const PROFILES_FILE = "profiles.json";
export const notePath = (id: string) => `notes/${id}.html`;
