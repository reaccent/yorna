import { invoke, isTauri } from "@tauri-apps/api/core";
import { forgetTauriVaultRoot, tauriVaultFolder, type VaultFolder } from "./tauri";

export type { VaultFolder };

export interface FolderInfo {
  path: string;
  exists: boolean;
  isVault: boolean;
  isEmpty: boolean;
}

/** `null` in the browser build, where the vault lives in IndexedDB. */
export async function vaultFolder(): Promise<VaultFolder | null> {
  return isTauri() ? tauriVaultFolder() : null;
}

export function inspectFolder(path: string) {
  return invoke<FolderInfo>("vault_inspect", { path });
}

/**
 * Where a picked folder's vault would go: the folder itself when it is a vault or
 * empty, otherwise a `Yorna` subfolder so files never mix into e.g. "My Drive".
 */
export async function resolveVaultTarget(picked: string): Promise<FolderInfo> {
  const info = await inspectFolder(picked);
  if (info.isVault || info.isEmpty) return info;
  const s = picked.includes("\\") ? "\\" : "/";
  return inspectFolder(`${picked.replace(/[\\/]+$/, "")}${s}Yorna`);
}

export async function setVaultFolder(path: string, mode: "open" | "copy") {
  const folder = await invoke<VaultFolder>("vault_set", { path, mode });
  forgetTauriVaultRoot();
  return folder;
}

/** Conflict copies a sync app left in the vault, relative to its root. */
export async function vaultConflicts(): Promise<string[]> {
  return isTauri() ? invoke<string[]>("vault_conflicts") : [];
}
