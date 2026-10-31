import { useEffect, useState } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  onOpenChange(open: boolean): void;
  onInsert(attrs: { src: string; alt: string }): void;
}

export function ImageRefDialog({ open, onOpenChange, onInsert }: Props) {
  const [src, setSrc] = useState("");
  const [alt, setAlt] = useState("");
  const desktop = isTauri();

  useEffect(() => {
    if (open) {
      setSrc("");
      setAlt("");
    }
  }, [open]);

  const browse = async () => {
    const { open: pick } = await import("@tauri-apps/plugin-dialog");
    const path = await pick({
      multiple: false,
      directory: false,
      filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "webp", "gif", "avif", "svg"] }],
    });
    if (typeof path === "string") setSrc(path);
  };

  const valid = src.trim().length > 0 && !src.trim().startsWith("data:");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Reference an image</DialogTitle>
          <DialogDescription>
            Link a thumbnail draft, storyboard or B-roll frame by file path or URL. Yorna stores the reference only —
            the image stays where it is.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) onInsert({ src: src.trim(), alt: alt.trim() });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="image-src">Path or URL</Label>
            <div className="flex gap-2">
              <Input
                id="image-src"
                autoFocus
                value={src}
                onChange={(e) => setSrc(e.target.value)}
                placeholder={desktop ? "/Users/you/Thumbnails/ep12-v2.png" : "https://… or /path/to/image.png"}
                className="font-mono text-sm"
              />
              {desktop && (
                <Button type="button" variant="secondary" onClick={() => void browse()}>
                  <FolderOpen className="size-4" /> Browse
                </Button>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="image-alt">Caption (optional)</Label>
            <Input
              id="image-alt"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Thumbnail option B"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!valid}>
              Insert reference
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
