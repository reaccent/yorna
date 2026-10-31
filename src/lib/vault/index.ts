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
}

let vault: VaultFS | null = null;

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
  };
}

export function getVault(): VaultFS {
  if (!vault) vault = withWriteQueue(isTauri() ? createTauriVault() : createBrowserVault());
  return vault;
}

export const INDEX_FILE = "yorna.json";
export const notePath = (id: string) => `notes/${id}.html`;
