import { useEffect, useMemo, useRef, useState } from "react";
import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, Search, X } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { useYorna } from "@/lib/store";
import { NOTE_COLUMNS, type NoteMeta, type NoteStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { NoteCardBody, SortableNoteCard } from "./note-card";

type Columns = Record<NoteStatus, string[]>;

function buildColumns(notes: NoteMeta[]): Columns {
  const cols: Columns = { todo: [], in_progress: [], done: [] };
  [...notes]
    .sort((a, b) => a.order - b.order || (a.createdAt < b.createdAt ? 1 : -1))
    .forEach((n) => cols[n.status].push(n.id));
  return cols;
}

const STATUS_DOT: Record<NoteStatus, string> = {
  todo: "bg-muted-foreground",
  in_progress: "bg-star",
  done: "bg-[#5cc8a1]",
};

export function Board() {
  const notes = useYorna((s) => s.notes);
  const { openNote, setColumns, createNote, deleteNote } = useYorna.getState();
  const [columns, setLocalColumns] = useState<Columns>(() => buildColumns(notes));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<NoteMeta | null>(null);

  useEffect(() => {
    if (!activeId) setLocalColumns(buildColumns(notes));
  }, [notes, activeId]);

  const byId = useMemo(() => new Map(notes.map((n) => [n.id, n])), [notes]);
  const q = query.trim().toLowerCase();
  const filtering = q.length > 0;
  const matches = (n: NoteMeta) =>
    !filtering || n.title.toLowerCase().includes(q) || n.excerpt.toLowerCase().includes(q);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space"] },
    }),
  );

  const findColumn = (id: string): NoteStatus | undefined => {
    if (id in columns) return id as NoteStatus;
    return (Object.keys(columns) as NoteStatus[]).find((k) => columns[k].includes(id));
  };

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    const from = findColumn(String(active.id));
    const to = findColumn(String(over.id));
    if (!from || !to || from === to) return;
    setLocalColumns((cols) => {
      const fromItems = cols[from].filter((id) => id !== active.id);
      const toItems = [...cols[to]];
      const overIndex = toItems.indexOf(String(over.id));
      toItems.splice(overIndex >= 0 ? overIndex : toItems.length, 0, String(active.id));
      return { ...cols, [from]: fromItems, [to]: toItems };
    });
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    let next = columns;
    if (over) {
      const col = findColumn(String(active.id));
      const overCol = findColumn(String(over.id));
      if (col && col === overCol) {
        const oldIndex = columns[col].indexOf(String(active.id));
        const newIndex = columns[col].indexOf(String(over.id));
        if (newIndex >= 0 && oldIndex !== newIndex) {
          next = { ...columns, [col]: arrayMove(columns[col], oldIndex, newIndex) };
        }
      }
    }
    setLocalColumns(next);
    setColumns(next);
    setActiveId(null);
  };

  const moveTo = (id: string, status: NoteStatus) => {
    const next: Columns = { todo: [], in_progress: [], done: [] };
    (Object.keys(columns) as NoteStatus[]).forEach((k) => (next[k] = columns[k].filter((x) => x !== id)));
    next[status] = [id, ...next[status]];
    setLocalColumns(next);
    setColumns(next);
  };

  const active = activeId ? byId.get(activeId) : undefined;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Scripts</h1>
          <p className="text-sm text-muted-foreground">
            {notes.length} script{notes.length === 1 ? "" : "s"} · drag cards to change status
          </p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <div className="relative flex-1 sm:w-64 sm:flex-none">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search scripts"
              className="h-10 pl-9"
              aria-label="Search scripts"
            />
            {filtering && (
              <button
                onClick={() => setQuery("")}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <Button className="h-10" onClick={() => openNote(createNote())}>
            <Plus className="size-4" /> New script
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="grid gap-4 md:grid-cols-3">
          {NOTE_COLUMNS.map((col) => {
            const ids = columns[col.id];
            const visible = ids.map((id) => byId.get(id)).filter((n): n is NoteMeta => !!n && matches(n));
            return (
              <Column
                key={col.id}
                id={col.id}
                label={col.label}
                hint={col.hint}
                count={ids.length}
                ids={visible.map((n) => n.id)}
                filtering={filtering}
                onAdd={(title) => createNote({ title, status: col.id })}
              >
                {visible.map((n) => (
                  <SortableNoteCard
                    key={n.id}
                    note={n}
                    disabled={filtering}
                    onOpen={() => openNote(n.id)}
                    onMove={(s) => moveTo(n.id, s)}
                    onDelete={() => setPendingDelete(n)}
                  />
                ))}
              </Column>
            );
          })}
        </div>
        <DragOverlay dropAnimation={{ duration: 180, easing: "ease-out" }}>
          {active ? <NoteCardBody note={active} overlay /> : null}
        </DragOverlay>
      </DndContext>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{pendingDelete?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              The script file is removed from your vault. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (pendingDelete) void deleteNote(pendingDelete.id);
                setPendingDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface ColumnProps {
  id: NoteStatus;
  label: string;
  hint: string;
  count: number;
  ids: string[];
  filtering: boolean;
  onAdd(title: string): void;
  children: React.ReactNode;
}

function Column({ id, label, hint, count, ids, filtering, onAdd, children }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  return (
    <section
      className={cn(
        "flex min-h-[260px] flex-col rounded-2xl border bg-surface p-3 transition-colors md:min-h-[calc(100vh-260px)]",
        isOver && "border-ring/70 bg-accent/30",
      )}
      aria-label={`${label} column`}
    >
      <header className="mb-3 flex items-center justify-between px-1.5 pt-1">
        <div className="flex items-center gap-2">
          <span className={cn("size-2 rounded-full", STATUS_DOT[id])} />
          <h2 className="text-sm font-semibold">{label}</h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground tabular-nums">
            {count}
          </span>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label={`Add script to ${label}`}
        >
          <Plus className="size-4" />
        </button>
      </header>

      <SortableContext id={id} items={ids} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="flex flex-1 flex-col gap-2.5">
          {adding && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!title.trim()) return;
                onAdd(title);
                setTitle("");
              }}
            >
              <Input
                ref={inputRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => !title.trim() && setAdding(false)}
                onKeyDown={(e) => e.key === "Escape" && (setTitle(""), setAdding(false))}
                placeholder="Script title, then Enter"
                className="h-11 rounded-xl bg-card"
                aria-label={`New script title in ${label}`}
              />
            </form>
          )}
          {children}
          {ids.length === 0 && !adding && (
            <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">{filtering ? "No matching scripts" : hint}</p>
              {!filtering && <p className="mt-1 text-xs text-muted-foreground/70">Drop a card here or press +</p>}
            </div>
          )}
        </div>
      </SortableContext>
    </section>
  );
}
