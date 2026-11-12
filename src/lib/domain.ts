import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDaysInMonth,
  isAfter,
  isBefore,
  startOfDay,
  startOfMonth,
} from "date-fns";
import type { ActiveSession, Reminder, SessionRecord } from "./types";

export const dayKey = (d: Date) => format(d, "yyyy-MM-dd");

export function parseDayKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** A day counts as worked only when at least one session was finished on it. */
export function workedDaySet(sessions: SessionRecord[]): Set<string> {
  return new Set(sessions.map((s) => s.date));
}

export interface MonthStats {
  totalDays: number;
  worked: number;
  missed: number;
  /** Days from today to month end (inclusive) that have not been worked yet. */
  openDays: number;
  /** Share of the month still open for work, 0–100. */
  percentLeft: number;
  isCurrentMonth: boolean;
  isPastMonth: boolean;
}

/**
 * "How much of the month is left": the share of the month's days that are
 * still unworked and not yet in the past. Finishing a session today shrinks it,
 * as does each day that passes; missed days are surfaced separately and only
 * counted from `since` (vault creation) so a new vault doesn't start in the red.
 */
export function monthStats(month: Date, worked: Set<string>, since: Date, now = new Date()): MonthStats {
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const today = startOfDay(now);
  const tracked = startOfDay(since);
  let workedCount = 0;
  let missed = 0;
  let open = 0;
  for (const d of days) {
    const isWorked = worked.has(dayKey(d));
    if (isWorked) workedCount++;
    else if (isBefore(d, today)) {
      if (!isBefore(d, tracked)) missed++;
    } else open++;
  }
  const isPastMonth = isBefore(endOfMonth(month), today);
  const isCurrentMonth = !isPastMonth && !isAfter(startOfMonth(month), today);
  return {
    totalDays: days.length,
    worked: workedCount,
    missed,
    openDays: open,
    percentLeft: Math.round((open / days.length) * 100),
    isCurrentMonth,
    isPastMonth,
  };
}

export function occursOn(r: Reminder, key: string): boolean {
  if (!r.repeat) return r.date === key;
  if (key < r.date) return false;
  if (r.repeat === "daily") return true;
  const start = parseDayKey(r.date);
  const day = parseDayKey(key);
  if (r.repeat === "weekly") return start.getDay() === day.getDay();
  return day.getDate() === Math.min(start.getDate(), getDaysInMonth(day));
}

export function isDoneOn(r: Reminder, key: string): boolean {
  return r.repeat ? (r.doneDates ?? []).includes(key) : r.done;
}

/**
 * Every occurrence between two days (inclusive). A repeating reminder appears
 * once per matching day, as a copy whose `date` is that day and whose `done`
 * reflects that day; its `id` stays the series id.
 */
export function occurrencesBetween(reminders: Reminder[], startKey: string, endKey: string): Reminder[] {
  const out: Reminder[] = [];
  for (const r of reminders) {
    if (!r.repeat) {
      if (r.date >= startKey && r.date <= endKey) out.push(r);
      continue;
    }
    if (r.date > endKey) continue;
    let d = parseDayKey(r.date > startKey ? r.date : startKey);
    for (let key = dayKey(d); key <= endKey; d = addDays(d, 1), key = dayKey(d)) {
      if (occursOn(r, key)) out.push({ ...r, date: key, done: isDoneOn(r, key) });
    }
  }
  return out;
}

export function remindersByDay(reminders: Reminder[], startKey: string, endKey: string): Map<string, Reminder[]> {
  const map = new Map<string, Reminder[]>();
  for (const r of occurrencesBetween(reminders, startKey, endKey)) {
    const list = map.get(r.date) ?? [];
    list.push(r);
    map.set(r.date, list);
  }
  for (const list of map.values()) list.sort(compareReminders);
  return map;
}

export function compareReminders(a: Reminder, b: Reminder) {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  if (a.time && b.time) return a.time < b.time ? -1 : a.time > b.time ? 1 : 0;
  if (a.time) return -1;
  if (b.time) return 1;
  return a.createdAt < b.createdAt ? -1 : 1;
}

export function sessionElapsedMs(s: ActiveSession, now = Date.now()) {
  return s.accumulatedMs + (s.runningSince ? now - s.runningSince : 0);
}

export function sessionProgress(s: ActiveSession, now = Date.now()) {
  const total = s.plannedMinutes * 60_000;
  const elapsed = Math.min(sessionElapsedMs(s, now), total);
  return { total, elapsed, remaining: total - elapsed, ratio: total ? elapsed / total : 0 };
}

export function formatClock(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(h ? 2 : 1, "0");
  const ss = String(s).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function htmlToExcerpt(html: string): { excerpt: string; wordCount: number } {
  const spaced = html.replace(/<\/(p|h[1-6]|li|blockquote|pre|div|figure)>/gi, "$& ");
  const doc = new DOMParser().parseFromString(spaced, "text/html");
  doc.querySelectorAll("figure, img").forEach((el) => el.remove());
  const text = (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
  const wordCount = text ? text.split(" ").length : 0;
  return { excerpt: text.slice(0, 180), wordCount };
}
