import { forwardRef, type HTMLAttributes } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatDistanceToNow } from "date-fns";
import { ArrowRightLeft, MoreHorizontal, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NOTE_COLUMNS, type NoteMeta, type NoteStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  note: NoteMeta;
  dragging?: boolean;
  overlay?: boolean;
  onMove?(status: NoteStatus): void;
  onDelete?(): void;
}

export const NoteCardBody = forwardRef<HTMLDivElement, CardBodyProps>(function NoteCardBody(
  { note, dragging, overlay, onMove, onDelete, className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "group relative cursor-grab rounded-xl border bg-card p-3.5 text-left shadow-sm transition-[border-color,background-color,opacity] outline-none select-none hover:border-ring/60 focus-visible:ring-2 focus-visible:ring-ring/60 active:cursor-grabbing",
        dragging && "opacity-30",
        overlay && "rotate-[1.5deg] border-ring shadow-2xl shadow-black/40",
        className,
      )}
      {...props}
    >
      <div className="flex items-start gap-2">
        <h3 className="min-w-0 flex-1 text-[15px] leading-snug font-medium break-words">{note.title}</h3>
        {(onMove || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className="-mt-1 -mr-1.5 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-accent hover:text-foreground focus-visible:opacity-100 data-[state=open]:opacity-100"
                aria-label={`Actions for ${note.title}`}
              >
                <MoreHorizontal className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
                <ArrowRightLeft className="size-3.5" /> Move to
              </DropdownMenuLabel>
              {NOTE_COLUMNS.filter((c) => c.id !== note.status).map((c) => (
                <DropdownMenuItem key={c.id} onSelect={() => onMove?.(c.id)}>
                  {c.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => onDelete?.()}>
                <Trash2 className="size-4" /> Delete script
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {note.excerpt ? (
        <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{note.excerpt}</p>
      ) : (
        <p className="mt-1.5 text-[13px] text-muted-foreground/60 italic">Empty script</p>
      )}
      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Edited {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}</span>
        {note.wordCount > 0 && <span className="tabular-nums">{note.wordCount} words</span>}
      </div>
    </div>
  );
});

interface SortableCardProps {
  note: NoteMeta;
  disabled?: boolean;
  onOpen(): void;
  onMove(status: NoteStatus): void;
  onDelete(): void;
}

export function SortableNoteCard({ note, disabled, onOpen, onMove, onDelete }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: note.id,
    disabled,
  });
  return (
    <NoteCardBody
      ref={setNodeRef}
      note={note}
      dragging={isDragging}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={onOpen}
      onMove={onMove}
      onDelete={onDelete}
      {...attributes}
      {...listeners}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen();
        else listeners?.onKeyDown?.(e);
      }}
      aria-roledescription="Draggable script card"
    />
  );
}
