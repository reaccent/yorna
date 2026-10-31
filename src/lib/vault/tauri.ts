import { appDataDir, join } from "@tauri-apps/api/path";
import {
  BaseDirectory,
  exists,
  mkdir,
  readFile,
  readTextFile,
  remove,
  rename,
  writeFile,
  writeTextFile,
} from "@tauri-apps/plugin-fs";
import type { VaultFS } from "./index";

const ROOT = "vault";
const baseDir = BaseDirectory.AppData;

const full = (path: string) => `${ROOT}/${path}`;

async function ensureParent(path: string) {
  const parts = full(path).split("/");
  parts.pop();
  const dir = parts.join("/");
  if (!(await exists(dir, { baseDir }))) {
    await mkdir(dir, { baseDir, recursive: true });
  }
}

/** Writes go to a temp file first so a crash never leaves a half-written vault file. */
async function atomicWrite(path: string, write: (tmp: string) => Promise<void>) {
  await ensureParent(path);
  const tmp = `${full(path)}.tmp`;
  await write(tmp);
  await rename(tmp, full(path), { oldPathBaseDir: baseDir, newPathBaseDir: baseDir });
}

export function createTauriVault(): VaultFS {
  return {
    kind: "filesystem",
    async location() {
      return join(await appDataDir(), ROOT);
    },
    async readText(path) {
      if (!(await exists(full(path), { baseDir }))) return null;
      return readTextFile(full(path), { baseDir });
    },
    async writeText(path, data) {
      await atomicWrite(path, (tmp) => writeTextFile(tmp, data, { baseDir }));
    },
    async readBytes(path) {
      if (!(await exists(full(path), { baseDir }))) return null;
      return readFile(full(path), { baseDir });
    },
    async writeBytes(path, data) {
      await atomicWrite(path, (tmp) => writeFile(tmp, data, { baseDir }));
    },
    async remove(path) {
      if (await exists(full(path), { baseDir })) await remove(full(path), { baseDir });
    },
  };
}
