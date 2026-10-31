import { createStore, del, get, set } from "idb-keyval";
import type { VaultFS } from "./index";

export function createBrowserVault(): VaultFS {
  const store = createStore("yorna-vault", "files");

  return {
    kind: "browser",
    async location() {
      return "Browser storage (IndexedDB · yorna-vault)";
    },
    async readText(path) {
      const value = await get(path, store);
      return typeof value === "string" ? value : null;
    },
    async writeText(path, data) {
      await set(path, data, store);
    },
    async readBytes(path) {
      const value = await get(path, store);
      return value instanceof Uint8Array ? value : null;
    },
    async writeBytes(path, data) {
      await set(path, data, store);
    },
    async remove(path) {
      await del(path, store);
    },
  };
}
