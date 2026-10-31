import { useState } from "react";
import { type Editor, useEditorState } from "@tiptap/react";
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ToolProps {
  label: string;
  shortcut?: string;
  active?: boolean;
  disabled?: boolean;
  onClick(): void;
  children: React.ReactNode;
}

function Tool({ label, shortcut, active, disabled, onClick, children }: ToolProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
          aria-pressed={active}
          className={cn(
            "flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-30",
            active && "bg-accent text-star",
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        {label}
        {shortcut && <span className="ml-2 text-muted-foreground">{shortcut}</span>}
      </TooltipContent>
    </Tooltip>
  );
}

const Divider = () => <span className="mx-1 h-5 w-px bg-border" aria-hidden />;
const mod = typeof navigator !== "undefined" && /Mac/i.test(navigator.platform) ? "⌘" : "Ctrl+";

export function EditorToolbar({ editor, onImage }: { editor: Editor; onImage(): void }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      highlight: e.isActive("highlight"),
      code: e.isActive("code"),
      h1: e.isActive("heading", { level: 1 }),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      task: e.isActive("taskList"),
      quote: e.isActive("blockquote"),
      link: e.isActive("link"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });
  const chain = () => editor.chain().focus();

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="flex flex-wrap items-center gap-0.5 rounded-xl border bg-card/95 p-1 shadow-sm backdrop-blur"
    >
      <Tool label="Heading 1" active={s.h1} onClick={() => chain().toggleHeading({ level: 1 }).run()}>
        <Heading1 className="size-4" />
      </Tool>
      <Tool label="Heading 2" active={s.h2} onClick={() => chain().toggleHeading({ level: 2 }).run()}>
        <Heading2 className="size-4" />
      </Tool>
      <Tool label="Section label" active={s.h3} onClick={() => chain().toggleHeading({ level: 3 }).run()}>
        <Heading3 className="size-4" />
      </Tool>
      <Divider />
      <Tool label="Bold" shortcut={`${mod}B`} active={s.bold} onClick={() => chain().toggleBold().run()}>
        <Bold className="size-4" />
      </Tool>
      <Tool label="Italic" shortcut={`${mod}I`} active={s.italic} onClick={() => chain().toggleItalic().run()}>
        <Italic className="size-4" />
      </Tool>
      <Tool label="Underline" shortcut={`${mod}U`} active={s.underline} onClick={() => chain().toggleUnderline().run()}>
        <Underline className="size-4" />
      </Tool>
      <Tool label="Strikethrough" active={s.strike} onClick={() => chain().toggleStrike().run()}>
        <Strikethrough className="size-4" />
      </Tool>
      <Tool label="Highlight" active={s.highlight} onClick={() => chain().toggleHighlight().run()}>
        <Highlighter className="size-4" />
      </Tool>
      <Tool label="Inline code" active={s.code} onClick={() => chain().toggleCode().run()}>
        <Code className="size-4" />
      </Tool>
      <LinkTool editor={editor} active={s.link} />
      <Divider />
      <Tool label="Bulleted list" active={s.bullet} onClick={() => chain().toggleBulletList().run()}>
        <List className="size-4" />
      </Tool>
      <Tool label="Numbered list" active={s.ordered} onClick={() => chain().toggleOrderedList().run()}>
        <ListOrdered className="size-4" />
      </Tool>
      <Tool label="Checklist" active={s.task} onClick={() => chain().toggleTaskList().run()}>
        <ListChecks className="size-4" />
      </Tool>
      <Tool label="Quote" active={s.quote} onClick={() => chain().toggleBlockquote().run()}>
        <Quote className="size-4" />
      </Tool>
      <Tool label="Divider" onClick={() => chain().setHorizontalRule().run()}>
        <Minus className="size-4" />
      </Tool>
      <Tool label="Image reference (path or URL)" onClick={onImage}>
        <ImageIcon className="size-4" />
      </Tool>
      <Divider />
      <Tool label="Undo" shortcut={`${mod}Z`} disabled={!s.canUndo} onClick={() => chain().undo().run()}>
        <Undo2 className="size-4" />
      </Tool>
      <Tool label="Redo" shortcut={`${mod}⇧Z`} disabled={!s.canRedo} onClick={() => chain().redo().run()}>
        <Redo2 className="size-4" />
      </Tool>
    </div>
  );
}

function LinkTool({ editor, active }: { editor: Editor; active: boolean }) {
  const [open, setOpen] = useState(false);
  const [href, setHref] = useState("");

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setHref(editor.getAttributes("link").href ?? "");
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          aria-label="Link"
          aria-pressed={active}
          className={cn(
            "flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
            active && "bg-accent text-star",
          )}
        >
          <Link2 className="size-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2" align="start">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const url = href.trim();
            const c = editor.chain().focus().extendMarkRange("link");
            if (url) c.setLink({ href: /^[a-z]+:/i.test(url) ? url : `https://${url}` }).run();
            else c.unsetLink().run();
            setOpen(false);
          }}
        >
          <Input
            autoFocus
            value={href}
            onChange={(e) => setHref(e.target.value)}
            placeholder="Paste a link"
            className="h-8"
          />
          <Button size="sm" type="submit" className="h-8">
            {href.trim() ? "Apply" : "Remove"}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
