import { createStore, del, delMany, get, keys, set } from "idb-keyval";
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
    async removeDir(path) {
      const prefix = `${path.replace(/\/$/, "")}/`;
      const all = await keys(store);
      await delMany(
        all.filter((k) => typeof k === "string" && k.startsWith(prefix)),
        store,
      );
    },
  };
}
