import { create } from "zustand";
import { dayKey, htmlToExcerpt, newId } from "./domain";
import { forgetCustomSound } from "./sound";
import type { ActiveSession, NoteMeta, NoteStatus, Reminder, SessionRecord, Settings, VaultIndex, View } from "./types";
import { getVault, INDEX_FILE, notePath } from "./vault";

const DEFAULT_SETTINGS: Settings = {
  defaultSessionMinutes: 30,
  soundVolume: 0.8,
};

const WELCOME_HTML = `<h2>Hook</h2><p>Open with the one sentence that makes someone stay. Yorna asks how long you want to work every time you open a script — finish the session and today counts on your calendar.</p><h2>Beats</h2><ul data-type="taskList"><li data-type="taskItem" data-checked="true"><p>Pick the video idea</p></li><li data-type="taskItem" data-checked="false"><p>Outline three beats</p></li><li data-type="taskItem" data-checked="false"><p>Write the call to action</p></li></ul><h2>B-roll &amp; references</h2><p>Reference images by path or URL with the image button — Yorna links them, it never copies thumbnails into your notes.</p><blockquote><p>Drag this card between To do, In progress and Done on the Notes board.</p></blockquote>`;

type LoadStatus = "loading" | "ready" | "error";

interface YornaState {
  status: LoadStatus;
  error?: string;
  vaultKind: "filesystem" | "browser";
  vaultLocation: string;

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
    set({ saveState: "saving" });
    try {
      await getVault().writeText(INDEX_FILE, JSON.stringify(snapshot(get()), null, 2));
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
    vaultKind: "browser",
    vaultLocation: "",
    notes: [],
    reminders: [],
    sessions: [],
    settings: DEFAULT_SETTINGS,
    createdAt: new Date().toISOString(),
    view: "calendar",
    openNoteId: null,
    promptedNoteIds: [],
    saveState: "idle",

    init() {
      if (!initPromise || get().status === "error") {
        set({ status: "loading", error: undefined });
        initPromise = load();
      }
      return initPromise;
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
      await getVault().writeText(notePath(id), html);
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
