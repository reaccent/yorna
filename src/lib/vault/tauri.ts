import { invoke } from "@tauri-apps/api/core";
import { sep } from "@tauri-apps/api/path";
import { exists, mkdir, readFile, readTextFile, remove, rename, writeFile, writeTextFile } from "@tauri-apps/plugin-fs";
import type { VaultFS } from "./index";

export interface VaultFolder {
  path: string;
  defaultPath: string;
  isDefault: boolean;
}

let rootPath: Promise<string> | null = null;

/** The vault folder chosen in Settings (default `<AppData>/vault`), resolved by the Rust shell. */
export function tauriVaultFolder(): Promise<VaultFolder> {
  return invoke<VaultFolder>("vault_info");
}

/** Call after the Rust side switches folders so the next operation re-resolves the root. */
export function forgetTauriVaultRoot() {
  rootPath = null;
}

async function root() {
  if (!rootPath) rootPath = tauriVaultFolder().then((f) => f.path);
  return rootPath;
}

async function full(path: string) {
  const s = sep();
  return `${(await root()).replace(/[\\/]+$/, "")}${s}${path.split("/").join(s)}`;
}

async function ensureParent(file: string) {
  const dir = file.slice(0, file.lastIndexOf(sep()));
  if (!(await exists(dir))) await mkdir(dir, { recursive: true });
}

/** Writes go to a temp file first so a crash never leaves a half-written vault file. */
async function atomicWrite(path: string, write: (tmp: string) => Promise<void>) {
  const target = await full(path);
  await ensureParent(target);
  const tmp = `${target}.tmp`;
  await write(tmp);
  await rename(tmp, target);
}

export function createTauriVault(): VaultFS {
  return {
    kind: "filesystem",
    location: root,
    async readText(path) {
      const file = await full(path);
      if (!(await exists(file))) return null;
      return readTextFile(file);
    },
    async writeText(path, data) {
      await atomicWrite(path, (tmp) => writeTextFile(tmp, data));
    },
    async readBytes(path) {
      const file = await full(path);
      if (!(await exists(file))) return null;
      return readFile(file);
    },
    async writeBytes(path, data) {
      await atomicWrite(path, (tmp) => writeFile(tmp, data));
    },
    async remove(path) {
      const file = await full(path);
      if (await exists(file)) await remove(file);
    },
    async removeDir(path) {
      const dir = await full(path);
      if (await exists(dir)) await remove(dir, { recursive: true });
    },
  };
}
