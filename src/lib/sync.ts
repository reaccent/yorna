import type { VaultIndex } from "./types";

type Mergeable = Pick<VaultIndex, "notes" | "reminders" | "sessions">;

/**
 * Folds changes another computer wrote to `yorna.json` (through a synced folder)
 * into local state that is about to be saved over it.
 *
 * - Finished sessions are append-only, so both sides are kept: a worked day is never lost.
 * - Notes and reminders that exist locally keep their local version.
 * - Remote items created after `since` (the last time this device read or wrote the
 *   file) are new on the other computer and are added. Older remote-only items were
 *   deleted here, so they stay deleted.
 */
export function mergeRemoteIndex<T extends Mergeable>(local: T, remote: Mergeable, since: string): T {
  const addNew = <I extends { id: string; createdAt: string }>(mine: I[], theirs: I[] = []) => {
    const ids = new Set(mine.map((i) => i.id));
    return [...mine, ...theirs.filter((i) => !ids.has(i.id) && i.createdAt > since)];
  };
  const sessionIds = new Set(local.sessions.map((s) => s.id));
  return {
    ...local,
    notes: addNew(local.notes, remote.notes),
    reminders: addNew(local.reminders, remote.reminders),
    sessions: [...local.sessions, ...(remote.sessions ?? []).filter((s) => !sessionIds.has(s.id))],
  };
}
