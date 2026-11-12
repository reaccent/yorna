import { create } from "zustand";
import { dayKey, htmlToExcerpt, newId } from "./domain";
import { makeProfile, PRIMARY_PROFILE_ID, readRegistry, registryChangedOnDisk, writeRegistry } from "./profiles";
import { forgetCustomSound } from "./sound";
import { mergeRemoteIndex } from "./sync";
import type {
  ActiveSession,
  NoteMeta,
  NoteStatus,
  Profile,
  Reminder,
  SessionRecord,
  Settings,
  VaultIndex,
  View,
} from "./types";
import { getRootVault, getVault, INDEX_FILE, notePath, setProfileDir } from "./vault";
import { setVaultFolder, vaultConflicts, vaultFolder, type VaultFolder } from "./vault/folder";

const DEFAULT_SETTINGS: Settings = {
  defaultSessionMinutes: 30,
  soundVolume: 0.8,
};

const WELCOME_HTML = `<h2>Hook</h2><p>Open with the one sentence that makes someone stay. Yorna asks how long you want to work every time you open a script — finish the session and today counts on your calendar.</p><h2>Beats</h2><ul data-type="taskList"><li data-type="taskItem" data-checked="true"><p>Pick the video idea</p></li><li data-type="taskItem" data-checked="false"><p>Outline three beats</p></li><li data-type="taskItem" data-checked="false"><p>Write the call to action</p></li></ul><h2>B-roll &amp; references</h2><p>Reference images by path or URL with the image button — Yorna links them, it never copies thumbnails into your notes.</p><blockquote><p>Drag this card between To do, In progress and Done on the Notes board.</p></blockquote>`;

type LoadStatus = "loading" | "choose-profile" | "ready" | "error";

interface YornaState {
  status: LoadStatus;
  error?: string;
  vaultKind: "filesystem" | "browser";
  vaultLocation: string;

  profiles: Profile[];
  activeProfileId: string | null;
  /** Desktop only: the vault folder and whether it is the default location. */
  vaultFolder: VaultFolder | null;
  /** Conflict copies a sync app left in the vault folder. */
  conflicts: string[];

  notes: NoteMeta[];
  reminders: Reminder[];
  sessions: SessionRecord[];
  settings: Settings;
  activeSession?: ActiveSession;
  createdAt: string;

  view: View;
  openNoteId: string | null;
  /** Notes that already showed the session prompt during this app run. */
  promptedNoteIds: string[];
  saveState: "idle" | "saving" | "error";

  init(): Promise<void>;
  /** Saves the current profile (if any) and loads another one. */
  openProfile(id: string): Promise<void>;
  /** Saves the current profile and returns to the profile picker. */
  chooseProfile(): Promise<void>;
  createProfile(name: string): Promise<Profile>;
  renameProfile(id: string, name: string): Promise<void>;
  /** Deletes a non-active, non-primary profile and its folder. */
  deleteProfile(id: string): Promise<void>;
  /** Saves everything, points the app at another vault folder and reopens it. */
  changeVaultFolder(path: string, mode: "open" | "copy"): Promise<void>;
  /**
   * Picks up `yorna.json` / `profiles.json` changes written by another computer
   * through a synced folder. Returns true when local state was replaced.
   */
  checkExternalChanges(): Promise<boolean>;
  refreshConflicts(): Promise<void>;

  setView(view: View): void;
  openNote(id: string): void;
  closeNote(): void;
  markPrompted(id: string): void;

  createNote(input?: { title?: string; status?: NoteStatus }): string;
  updateNoteMeta(id: string, patch: Partial<Pick<NoteMeta, "title" | "status">>): void;
  loadNoteBody(id: string): Promise<string>;
  saveNoteBody(id: string, html: string): Promise<void>;
  deleteNote(id: string): Promise<void>;
  /** Persist a column's new order (and status) after a drag. */
  setColumns(columns: Record<NoteStatus, string[]>): void;

  addReminder(input: Omit<Reminder, "id" | "createdAt" | "done">): void;
  updateReminder(id: string, patch: Partial<Omit<Reminder, "id">>): void;
  deleteReminder(id: string): void;

  startSession(minutes: number, noteId?: string): void;
  pauseSession(): void;
  resumeSession(): void;
  cancelSession(): void;
  /** Records the finished session; returns false if nothing was running. */
  completeSession(): boolean;

  updateSettings(patch: Partial<Settings>): void;
  setCustomSound(file: File): Promise<void>;
  clearCustomSound(): Promise<void>;
}

let saveTimer: ReturnType<typeof setTimeout> | undefined;
let initPromise: Promise<void> | null = null;
/** Script body writes still in flight; a profile switch waits for them before changing folders. */
const pendingBodySaves = new Set<Promise<unknown>>();
/** The active profile's `yorna.json` as this device last read or wrote it. */
let synced: { text: string | null; at: string } = { text: null, at: new Date().toISOString() };
const markSynced = (text: string | null) => {
  synced = { text, at: new Date().toISOString() };
};

type ProfileData = Pick<
  YornaState,
  | "notes"
  | "reminders"
  | "sessions"
  | "settings"
  | "activeSession"
  | "createdAt"
  | "view"
  | "openNoteId"
  | "promptedNoteIds"
  | "saveState"
>;

const emptyProfileData = (): ProfileData => ({
  notes: [],
  reminders: [],
  sessions: [],
  settings: DEFAULT_SETTINGS,
  activeSession: undefined,
  createdAt: new Date().toISOString(),
  view: "calendar",
  openNoteId: null,
  promptedNoteIds: [],
  saveState: "idle",
});

function snapshot(s: YornaState): VaultIndex {
  return {
    schema: 1,
    createdAt: s.createdAt,
    notes: s.notes,
    reminders: s.reminders,
    sessions: s.sessions,
    settings: s.settings,
    activeSession: s.activeSession,
  };
}

export const useYorna = create<YornaState>((set, get) => {
  async function flush() {
    saveTimer = undefined;
    set({ saveState: "saving" });
    try {
      const vault = getVault();
      const disk = await vault.readText(INDEX_FILE);
      if (disk !== null && synced.text !== null && disk !== synced.text) {
        try {
          const remote = JSON.parse(disk) as VaultIndex;
          const s = get();
          set(mergeRemoteIndex({ notes: s.notes, reminders: s.reminders, sessions: s.sessions }, remote, synced.at));
        } catch {
          // Half-downloaded by the sync app; the write below replaces it.
        }
      }
      const text = JSON.stringify(snapshot(get()), null, 2);
      await vault.writeText(INDEX_FILE, text);
      markSynced(text);
      set({ saveState: "idle" });
    } catch (err) {
      console.error("Failed to save vault index", err);
      set({ saveState: "error" });
    }
  }

  function persist() {
    if (get().status !== "ready") return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flush, 250);
  }

  function patchNote(id: string, patch: Partial<NoteMeta>) {
    set((s) => ({ notes: s.notes.map((n) => (n.id === id ? { ...n, ...patch } : n)) }));
  }

  async function load() {
    const vault = getVault();
    try {
      const [raw, location] = await Promise.all([vault.readText(INDEX_FILE), vault.location()]);
      markSynced(raw);
      if (raw) {
        const data = JSON.parse(raw) as VaultIndex;
        set({
          notes: data.notes ?? [],
          reminders: data.reminders ?? [],
          sessions: data.sessions ?? [],
          settings: { ...DEFAULT_SETTINGS, ...data.settings },
          activeSession: data.activeSession,
          createdAt: data.createdAt ?? new Date().toISOString(),
        });
      } else {
        const now = new Date().toISOString();
        const welcome: NoteMeta = {
          id: newId(),
          title: "Welcome to Yorna — sample script",
          status: "todo",
          order: 0,
          createdAt: now,
          updatedAt: now,
          ...htmlToExcerpt(WELCOME_HTML),
        };
        await vault.writeText(notePath(welcome.id), WELCOME_HTML);
        set({ notes: [welcome], createdAt: now });
      }
      set({ status: "ready", vaultKind: vault.kind, vaultLocation: location });
      if (!raw) await flush();
    } catch (err) {
      console.error(err);
      set({ status: "error", error: err instanceof Error ? err.message : String(err) });
    }
  }

  /**
   * Unmounts the UI, lets the editor's unmount save land, then writes the
   * index — all while the vault still points at the outgoing profile.
   */
  async function leaveProfile() {
    if (get().status !== "ready") return;
    const s = get().activeSession;
    if (s?.runningSince) {
      set({
        activeSession: { ...s, accumulatedMs: s.accumulatedMs + (Date.now() - s.runningSince), runningSince: null },
      });
    }
    set({ status: "loading", openNoteId: null });
    await new Promise((r) => setTimeout(r, 50));
    await Promise.allSettled([...pendingBodySaves]);
    clearTimeout(saveTimer);
    saveTimer = undefined;
    await flush();
  }

  async function refreshProfiles() {
    const registry = await readRegistry();
    set({ profiles: registry.profiles });
    return registry;
  }

  async function bootstrap() {
    try {
      set({ status: "loading", error: undefined });
      const [folder] = await Promise.all([vaultFolder(), get().refreshConflicts()]);
      set({ vaultFolder: folder });
      const registry = await refreshProfiles();
      if (registry.profiles.length <= 1) {
        await enterProfile(registry.profiles[0]);
      } else {
        set({ status: "choose-profile", activeProfileId: null });
      }
    } catch (err) {
      console.error(err);
      set({ status: "error", error: err instanceof Error ? err.message : String(err) });
    }
  }

  async function enterProfile(profile: Profile) {
    set({ ...emptyProfileData(), status: "loading", activeProfileId: profile.id });
    forgetCustomSound();
    setProfileDir(profile.dir);
    const registry = await readRegistry();
    if (registry.profiles.length > 1) {
      const now = new Date().toISOString();
      registry.lastProfileId = profile.id;
      registry.profiles = registry.profiles.map((p) => (p.id === profile.id ? { ...p, lastOpenedAt: now } : p));
      await writeRegistry(registry);
      set({ profiles: registry.profiles });
    }
    await load();
  }

  if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", () => {
      if (saveTimer) {
        clearTimeout(saveTimer);
        void flush();
      }
    });
  }

  return {
    status: "loading",
    vaultKind: getRootVault().kind,
    vaultLocation: "",
    profiles: [],
    activeProfileId: null,
    vaultFolder: null,
    conflicts: [],
    ...emptyProfileData(),

    init() {
      if (!initPromise || get().status === "error") {
        initPromise = bootstrap();
      }
      return initPromise;
    },

    async openProfile(id) {
      const profile = get().profiles.find((p) => p.id === id);
      if (!profile) throw new Error("That profile no longer exists.");
      if (get().status === "ready" && get().activeProfileId === id) return;
      await leaveProfile();
      try {
        await enterProfile(profile);
      } catch (err) {
        console.error(err);
        set({ status: "error", error: err instanceof Error ? err.message : String(err) });
      }
    },

    async chooseProfile() {
      await leaveProfile();
      set({ ...emptyProfileData(), status: "choose-profile", activeProfileId: null });
      forgetCustomSound();
      await refreshProfiles();
    },

    async createProfile(name) {
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Give the profile a name.");
      const registry = await readRegistry();
      if (registry.profiles.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
        throw new Error(`A profile named “${trimmed}” already exists.`);
      }
      const profile = makeProfile(trimmed, registry.profiles);
      const activeId = get().activeProfileId;
      const now = new Date().toISOString();
      registry.profiles = [
        ...registry.profiles.map((p) => (p.id === activeId && !p.lastOpenedAt ? { ...p, lastOpenedAt: now } : p)),
        profile,
      ];
      registry.lastProfileId ??= activeId ?? undefined;
      await writeRegistry(registry);
      set({ profiles: registry.profiles });
      return profile;
    },

    async renameProfile(id, name) {
      const trimmed = name.trim();
      if (!trimmed) return;
      const registry = await readRegistry();
      registry.profiles = registry.profiles.map((p) => (p.id === id ? { ...p, name: trimmed } : p));
      await writeRegistry(registry);
      set({ profiles: registry.profiles });
    },

    async deleteProfile(id) {
      if (id === PRIMARY_PROFILE_ID) throw new Error("The first profile owns the vault folder and can't be deleted.");
      if (id === get().activeProfileId) throw new Error("Switch to another profile before deleting this one.");
      const registry = await readRegistry();
      const profile = registry.profiles.find((p) => p.id === id);
      if (!profile) return;
      registry.profiles = registry.profiles.filter((p) => p.id !== id);
      if (registry.lastProfileId === id) registry.lastProfileId = undefined;
      await writeRegistry(registry);
      set({ profiles: registry.profiles });
      if (profile.dir) await getRootVault().removeDir(profile.dir);
    },

    async changeVaultFolder(path, mode) {
      const previousProfileId = get().activeProfileId;
      await leaveProfile();
      let failure: unknown;
      try {
        await setVaultFolder(path, mode);
      } catch (err) {
        failure = err;
      }
      set({ ...emptyProfileData(), status: "loading", profiles: [], activeProfileId: null });
      forgetCustomSound();
      setProfileDir("");
      initPromise = bootstrap();
      await initPromise;
      // A moved vault holds the same profiles, so stay in the one that was open.
      const keep = (failure || mode === "copy") && get().profiles.some((p) => p.id === previousProfileId);
      if (keep && get().status === "choose-profile" && previousProfileId) await get().openProfile(previousProfileId);
      if (failure) throw failure instanceof Error ? failure : new Error(String(failure));
    },

    async checkExternalChanges() {
      const busy = () =>
        get().status !== "ready" ||
        saveTimer !== undefined ||
        get().saveState === "saving" ||
        pendingBodySaves.size > 0;
      if (busy()) return false;
      if (await registryChangedOnDisk()) await refreshProfiles();
      const raw = await getVault().readText(INDEX_FILE);
      if (raw === null || raw === synced.text || busy()) return false;
      let data: VaultIndex;
      try {
        data = JSON.parse(raw) as VaultIndex;
      } catch {
        return false;
      }
      forgetCustomSound();
      set((s) => {
        const notes = data.notes ?? [];
        return {
          notes,
          reminders: data.reminders ?? [],
          sessions: data.sessions ?? [],
          settings: { ...DEFAULT_SETTINGS, ...data.settings },
          createdAt: data.createdAt ?? s.createdAt,
          openNoteId: s.openNoteId && notes.some((n) => n.id === s.openNoteId) ? s.openNoteId : null,
        };
      });
      markSynced(raw);
      return true;
    },

    async refreshConflicts() {
      try {
        set({ conflicts: await vaultConflicts() });
      } catch (err) {
        console.warn("Couldn't scan the vault for sync conflicts", err);
      }
    },

    setView(view) {
      set({ view });
    },
    openNote(id) {
      set((s) => ({
        view: "notes",
        openNoteId: id,
        settings: { ...s.settings, lastEditedNoteId: id },
      }));
      persist();
    },
    closeNote() {
      set({ openNoteId: null });
    },
    markPrompted(id) {
      set((s) => ({ promptedNoteIds: [...s.promptedNoteIds, id] }));
    },

    createNote(input) {
      const status = input?.status ?? "todo";
      const now = new Date().toISOString();
      const minOrder = Math.min(
        0,
        ...get()
          .notes.filter((n) => n.status === status)
          .map((n) => n.order),
      );
      const note: NoteMeta = {
        id: newId(),
        title: input?.title?.trim() || "Untitled script",
        status,
        order: minOrder - 1,
        createdAt: now,
        updatedAt: now,
        excerpt: "",
        wordCount: 0,
      };
      set((s) => ({ notes: [...s.notes, note] }));
      void getVault().writeText(notePath(note.id), "");
      persist();
      return note.id;
    },

    updateNoteMeta(id, patch) {
      patchNote(id, { ...patch, updatedAt: new Date().toISOString() });
      persist();
    },

    async loadNoteBody(id) {
      return (await getVault().readText(notePath(id))) ?? "";
    },

    async saveNoteBody(id, html) {
      // A script from another profile must never be written into this one's folder.
      if (!get().notes.some((n) => n.id === id)) return;
      const write = getVault().writeText(notePath(id), html);
      pendingBodySaves.add(write);
      try {
        await write;
      } finally {
        pendingBodySaves.delete(write);
      }
      patchNote(id, { ...htmlToExcerpt(html), updatedAt: new Date().toISOString() });
      persist();
    },

    async deleteNote(id) {
      set((s) => ({
        notes: s.notes.filter((n) => n.id !== id),
        openNoteId: s.openNoteId === id ? null : s.openNoteId,
        settings: s.settings.lastEditedNoteId === id ? { ...s.settings, lastEditedNoteId: undefined } : s.settings,
      }));
      persist();
      await getVault().remove(notePath(id));
    },

    setColumns(columns) {
      const position = new Map<string, { status: NoteStatus; order: number }>();
      (Object.keys(columns) as NoteStatus[]).forEach((status) =>
        columns[status].forEach((id, order) => position.set(id, { status, order })),
      );
      set((s) => ({
        notes: s.notes.map((n) => {
          const p = position.get(n.id);
          if (!p || (p.status === n.status && p.order === n.order)) return n;
          return { ...n, ...p };
        }),
      }));
      persist();
    },

    addReminder(input) {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const alreadyDue = input.time !== undefined && input.date === dayKey(now) && input.time <= hhmm;
      const reminder: Reminder = {
        ...input,
        title: input.title.trim(),
        id: newId(),
        done: false,
        createdAt: now.toISOString(),
        firedAt: alreadyDue ? now.toISOString() : undefined,
      };
      set((s) => ({ reminders: [...s.reminders, reminder] }));
      persist();
    },
    updateReminder(id, patch) {
      set((s) => ({ reminders: s.reminders.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
      persist();
    },
    deleteReminder(id) {
      set((s) => ({ reminders: s.reminders.filter((r) => r.id !== id) }));
      persist();
    },

    startSession(minutes, noteId) {
      const now = Date.now();
      set({
        activeSession: {
          noteId,
          plannedMinutes: Math.max(1, Math.round(minutes)),
          startedAt: now,
          accumulatedMs: 0,
          runningSince: now,
        },
      });
      persist();
    },
    pauseSession() {
      const s = get().activeSession;
      if (!s || !s.runningSince) return;
      set({
        activeSession: {
          ...s,
          accumulatedMs: s.accumulatedMs + (Date.now() - s.runningSince),
          runningSince: null,
        },
      });
      persist();
    },
    resumeSession() {
      const s = get().activeSession;
      if (!s || s.runningSince) return;
      set({ activeSession: { ...s, runningSince: Date.now() } });
      persist();
    },
    cancelSession() {
      set({ activeSession: undefined });
      persist();
    },
    completeSession() {
      const s = get().activeSession;
      if (!s) return false;
      const now = new Date();
      const record: SessionRecord = {
        id: newId(),
        noteId: s.noteId,
        date: dayKey(now),
        plannedMinutes: s.plannedMinutes,
        startedAt: new Date(s.startedAt).toISOString(),
        finishedAt: now.toISOString(),
      };
      set((st) => ({ activeSession: undefined, sessions: [...st.sessions, record] }));
      persist();
      return true;
    },

    updateSettings(patch) {
      set((s) => ({ settings: { ...s.settings, ...patch } }));
      persist();
    },
    async setCustomSound(file) {
      const ext = (file.name.split(".").pop() || "audio").toLowerCase().replace(/[^a-z0-9]/g, "");
      const vaultPath = `sounds/finish.${ext}`;
      const previous = get().settings.customSound;
      const bytes = new Uint8Array(await file.arrayBuffer());
      await getVault().writeBytes(vaultPath, bytes);
      if (previous && previous.vaultPath !== vaultPath) await getVault().remove(previous.vaultPath);
      forgetCustomSound();
      get().updateSettings({
        customSound: { fileName: file.name, vaultPath, mime: file.type || `audio/${ext}` },
      });
    },
    async clearCustomSound() {
      const previous = get().settings.customSound;
      forgetCustomSound();
      get().updateSettings({ customSound: undefined });
      if (previous) await getVault().remove(previous.vaultPath);
    },
  };
});

export const selectNote = (id: string | null) => (s: YornaState) => (id ? s.notes.find((n) => n.id === id) : undefined);
