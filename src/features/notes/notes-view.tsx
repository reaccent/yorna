import { selectNote, useYorna } from "@/lib/store";
import { Board } from "./board";
import { EditorView } from "./editor-view";

export function NotesView() {
  const openNoteId = useYorna((s) => s.openNoteId);
  const note = useYorna(selectNote(openNoteId));
  return note ? <EditorView note={note} /> : <Board />;
}
