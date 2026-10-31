export type NoteStatus = "todo" | "in_progress" | "done";

export const NOTE_COLUMNS: { id: NoteStatus; label: string; hint: string }[] = [
  { id: "todo", label: "To do", hint: "Ideas and scripts to start" },
  { id: "in_progress", label: "In progress", hint: "Drafting and rewriting" },
  { id: "done", label: "Done", hint: "Ready to record" },
];

export interface NoteMeta {
  id: string;
  title: string;
  status: NoteStatus;
  /** Sort position inside its column (ascending). */
  order: number;
  createdAt: string;
  updatedAt: string;
  excerpt: string;
  wordCount: number;
}

export const REMINDER_COLORS = [
  { id: "amber", label: "Amber", hex: "#f2b544" },
  { id: "coral", label: "Coral", hex: "#ef7a5f" },
  { id: "rose", label: "Rose", hex: "#e66b9a" },
  { id: "violet", label: "Violet", hex: "#9b87f5" },
  { id: "sky", label: "Sky", hex: "#5aaee8" },
  { id: "mint", label: "Mint", hex: "#5cc8a1" },
] as const;

export type ReminderColor = (typeof REMINDER_COLORS)[number]["id"];

export interface Reminder {
  id: string;
  /** Local calendar day, `yyyy-MM-dd`. */
  date: string;
  /** Optional local time `HH:mm`; timed reminders chime when due. */
  time?: string;
  title: string;
  color: ReminderColor;
  done: boolean;
  createdAt: string;
  firedAt?: string;
}

export interface SessionRecord {
  id: string;
  noteId?: string;
  /** Local day the session finished on, `yyyy-MM-dd`. */
  date: string;
  plannedMinutes: number;
  startedAt: string;
  finishedAt: string;
}

export interface ActiveSession {
  noteId?: string;
  plannedMinutes: number;
  startedAt: number;
  /** Milliseconds accumulated before the current run segment. */
  accumulatedMs: number;
  /** Epoch ms when the current run segment started; null while paused. */
  runningSince: number | null;
}

export interface CustomSound {
  fileName: string;
  /** Path inside the vault, e.g. `sounds/finish.mp3`. */
  vaultPath: string;
  mime: string;
}

export interface Settings {
  defaultSessionMinutes: number;
  soundVolume: number;
  customSound?: CustomSound;
  lastEditedNoteId?: string;
}

export interface VaultIndex {
  schema: 1;
  createdAt: string;
  notes: NoteMeta[];
  reminders: Reminder[];
  sessions: SessionRecord[];
  settings: Settings;
  activeSession?: ActiveSession;
}

export type View = "calendar" | "notes" | "settings";
