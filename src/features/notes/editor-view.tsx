import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { Placeholder } from "@tiptap/extensions";
import { format, formatDistanceToNow } from "date-fns";
import { ChevronLeft, Loader2, MoreHorizontal, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SessionDialog } from "@/components/session-dialog";
import { StarRing } from "@/components/star-ring";
import { useNow } from "@/hooks/use-now";
import { dayKey, formatClock, sessionProgress } from "@/lib/domain";
import { useYorna } from "@/lib/store";
import { NOTE_COLUMNS, type NoteMeta, type NoteStatus } from "@/lib/types";
import { EditorToolbar } from "./editor-toolbar";
import { ImageRef } from "./image-ref";
import { ImageRefDialog } from "./image-ref-dialog";

export function EditorView({ note }: { note: NoteMeta }) {
  const { closeNote, updateNoteMeta, deleteNote, loadNoteBody, startSession, markPrompted } = useYorna.getState();
  const hasSession = useYorna((s) => Boolean(s.activeSession));
  const prompted = useYorna((s) => s.promptedNoteIds.includes(note.id));
  const defaultMinutes = useYorna((s) => s.settings.defaultSessionMinutes);
  const [body, setBody] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setBody(null);
    setLoadError(null);
    loadNoteBody(note.id)
      .then((html) => !cancelled && setBody(html))
      .catch((err) => !cancelled && setLoadError(String(err)));
    return () => {
      cancelled = true;
    };
  }, [note.id, loadNoteBody]);

  useEffect(() => {
    if (!hasSession && !prompted) {
      markPrompted(note.id);
      setSessionOpen(true);
    }
    // Only prompt when a script is opened, not when a session ends mid-edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
      <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between gap-3 bg-background/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <nav className="flex min-w-0 items-center gap-1 text-sm" aria-label="Breadcrumb">
          <Button variant="ghost" size="sm" onClick={closeNote} className="-ml-2 text-muted-foreground">
            <ChevronLeft className="size-4" /> Notes
          </Button>
          <span className="text-muted-foreground/50">/</span>
          <span className="truncate px-2 text-muted-foreground">{note.title || "Untitled script"}</span>
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <Select value={note.status} onValueChange={(v) => updateNoteMeta(note.id, { status: v as NoteStatus })}>
            <SelectTrigger size="sm" className="w-36" aria-label="Status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NOTE_COLUMNS.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Script actions">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem variant="destructive" onSelect={() => setConfirmDelete(true)}>
                <Trash2 className="size-4" /> Delete script
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
        <article className="min-w-0">
          <TitleInput note={note} />
          <p className="mt-2 mb-5 text-sm text-muted-foreground">
            Date created: {format(new Date(note.createdAt), "MMM d, yyyy")}
            <span className="mx-2 text-muted-foreground/40">·</span>
            Edited {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
            {note.wordCount > 0 && (
              <>
                <span className="mx-2 text-muted-foreground/40">·</span>
                {note.wordCount} words · ~{Math.max(1, Math.round(note.wordCount / 150))} min read aloud
              </>
            )}
          </p>
          {loadError ? (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
              Couldn't read this script from the vault: {loadError}
            </div>
          ) : body === null ? (
            <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading script…
            </div>
          ) : (
            <ScriptEditor key={note.id} noteId={note.id} initialHtml={body} />
          )}
        </article>

        <aside className="order-first lg:order-none">
          <div className="lg:sticky lg:top-20">
            <SessionCard noteId={note.id} onStart={() => setSessionOpen(true)} />
          </div>
        </aside>
      </div>

      <SessionDialog
        open={sessionOpen}
        onOpenChange={setSessionOpen}
        defaultMinutes={defaultMinutes}
        noteTitle={note.title}
        onStart={(m) => {
          startSession(m, note.id);
          setSessionOpen(false);
        }}
      />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{note.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              The script file is removed from your vault. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void deleteNote(note.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TitleInput({ note }: { note: NoteMeta }) {
  const updateNoteMeta = useYorna((s) => s.updateNoteMeta);
  const [value, setValue] = useState(note.title);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => setValue(note.title), [note.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      onChange={(e) => {
        const v = e.target.value.replace(/\n/g, " ");
        setValue(v);
        updateNoteMeta(note.id, { title: v.trim() || "Untitled script" });
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          document.querySelector<HTMLElement>(".yorna-prose")?.focus();
        }
      }}
      placeholder="Title"
      aria-label="Script title"
      className="w-full resize-none overflow-hidden bg-transparent text-3xl leading-tight font-semibold tracking-tight outline-none placeholder:text-muted-foreground/50 sm:text-4xl"
    />
  );
}

function ScriptEditor({ noteId, initialHtml }: { noteId: string; initialHtml: string }) {
  const saveNoteBody = useYorna((s) => s.saveNoteBody);
  const [imageOpen, setImageOpen] = useState(false);
  const [saving, setSaving] = useState<"saved" | "pending" | "error">("saved");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const latest = useRef<string | null>(null);

  const save = useCallback(async () => {
    if (latest.current === null) return;
    const html = latest.current;
    latest.current = null;
    try {
      await saveNoteBody(noteId, html);
      setSaving("saved");
    } catch (err) {
      console.error(err);
      setSaving("error");
      toast.error("Couldn't save script", { description: String(err) });
    }
  }, [noteId, saveNoteBody]);

  useEffect(
    () => () => {
      clearTimeout(timer.current);
      void save();
    },
    [save],
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        // Appending a trailing paragraph on first click would count as an edit and bump "Last edited".
        trailingNode: false,
        link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener noreferrer" } },
      }),
      Highlight,
      TaskList,
      TaskItem.configure({ nested: true }),
      ImageRef,
      Placeholder.configure({ placeholder: "Insert text… Start with the hook." }),
    ],
    content: initialHtml,
    editorProps: {
      attributes: { class: "yorna-prose", "aria-label": "Script body", spellcheck: "true" },
      handlePaste: (_view, event) => {
        const files = Array.from(event.clipboardData?.files ?? []);
        if (files.some((f) => f.type.startsWith("image/"))) {
          toast("Images aren't pasted into scripts", {
            description: "Use the image button to reference a file path or URL instead.",
          });
          return true;
        }
        return false;
      },
      handleDrop: (_view, event) => {
        const files = Array.from((event as DragEvent).dataTransfer?.files ?? []);
        if (files.length) {
          toast("Images aren't dropped into scripts", {
            description: "Use the image button to reference a file path or URL instead.",
          });
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: e }) => {
      latest.current = e.getHTML();
      setSaving("pending");
      clearTimeout(timer.current);
      timer.current = setTimeout(() => void save(), 600);
    },
  });

  if (!editor) return null;

  return (
    <div>
      <div className="sticky top-[60px] z-[5] mb-4 flex items-center gap-3">
        <EditorToolbar editor={editor} onImage={() => setImageOpen(true)} />
        <span className="ml-auto hidden text-xs text-muted-foreground sm:block" aria-live="polite">
          {saving === "pending" ? "Saving…" : saving === "error" ? "Not saved" : "Saved to vault"}
        </span>
      </div>
      <EditorContent editor={editor} />
      <ImageRefDialog
        open={imageOpen}
        onOpenChange={setImageOpen}
        onInsert={(attrs) => {
          editor.chain().focus().insertImageRef(attrs).run();
          setImageOpen(false);
        }}
      />
    </div>
  );
}

function SessionCard({ noteId, onStart }: { noteId: string; onStart(): void }) {
  const session = useYorna((s) => s.activeSession);
  const sessions = useYorna((s) => s.sessions);
  const notes = useYorna((s) => s.notes);
  const { pauseSession, resumeSession } = useYorna.getState();
  const now = useNow(1000, Boolean(session?.runningSince));
  const today = dayKey(new Date(now));
  const workedToday = sessions.some((s) => s.date === today);
  const minutesToday = sessions.filter((s) => s.date === today).reduce((sum, s) => sum + s.plannedMinutes, 0);

  if (session) {
    const { remaining, ratio } = sessionProgress(session, now);
    const elsewhere =
      session.noteId && session.noteId !== noteId ? notes.find((n) => n.id === session.noteId) : undefined;
    return (
      <div className="flex items-center gap-4 rounded-2xl border bg-surface p-4 lg:flex-col lg:items-start">
        <StarRing progress={ratio} size={64} stroke={4} />
        <div className="min-w-0 flex-1">
          <p className="text-2xl font-semibold tabular-nums">{Math.floor(ratio * 100)}%</p>
          <p className="text-sm text-muted-foreground">
            {formatClock(remaining)} left{session.runningSince ? "" : " · paused"}
            {elsewhere && <> · on “{elsewhere.title}”</>}
          </p>
          <p className="mt-1 text-xs text-muted-foreground/80">
            {workedToday
              ? "Today already counts."
              : `${Math.ceil(remaining / 60_000)} more minutes until today counts.`}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={session.runningSince ? pauseSession : resumeSession}>
          {session.runningSince ? "Pause" : "Resume"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 rounded-2xl border bg-surface p-4 lg:flex-col lg:items-start">
      <StarRing progress={workedToday ? 1 : 0} complete={workedToday} size={64} stroke={4} />
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-semibold tabular-nums">{workedToday ? "100%" : "0%"}</p>
        <p className="text-sm text-muted-foreground">
          {workedToday ? `Today counts · ${minutesToday} min finished` : "Today isn't counted yet"}
        </p>
      </div>
      <Button size="sm" onClick={onStart} className="bg-star text-star-foreground hover:bg-star/90 lg:w-full">
        <Play className="size-4" /> {workedToday ? "Another session" : "Start session"}
      </Button>
    </div>
  );
}
