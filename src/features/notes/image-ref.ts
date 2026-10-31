import { mergeAttributes, Node } from "@tiptap/core";
import { convertFileSrc, isTauri } from "@tauri-apps/api/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    imageRef: {
      insertImageRef: (attrs: { src: string; alt?: string }) => ReturnType;
    };
  }
}

const REMOTE = /^(https?:|blob:|asset:|http:\/\/asset\.localhost)/i;

export function isLocalPath(src: string) {
  return !REMOTE.test(src) && !src.startsWith("data:");
}

/** Turns a stored reference (URL or absolute local path) into something the webview can load. */
export function resolveImageSrc(src: string): string {
  if (!isLocalPath(src)) return src;
  const path = src.replace(/^file:\/\//i, "");
  return isTauri() ? convertFileSrc(decodeURI(path)) : src;
}

/**
 * Image *reference*: the note stores only the path or URL, never image bytes,
 * so vault files stay small and thumbnails live wherever the creator keeps them.
 */
export const ImageRef = Node.create({
  name: "imageRef",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src: { default: "" },
      alt: { default: "" },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure[data-image-ref]",
        getAttrs: (el) => ({
          src: (el as HTMLElement).getAttribute("data-src") ?? "",
          alt: (el as HTMLElement).querySelector("img")?.getAttribute("alt") ?? "",
        }),
      },
      {
        tag: "img[src]",
        getAttrs: (el) => {
          const src = (el as HTMLElement).getAttribute("src") ?? "";
          return src.startsWith("data:") ? false : { src, alt: (el as HTMLElement).getAttribute("alt") ?? "" };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { src, alt } = HTMLAttributes as { src: string; alt: string };
    return [
      "figure",
      mergeAttributes({ "data-image-ref": "", "data-src": src, class: "yorna-image" }),
      ["img", { src, alt }],
      ["figcaption", {}, alt ? `${alt} — ${src}` : src],
    ];
  },

  addNodeView() {
    return ({ node }) => {
      const figure = document.createElement("figure");
      figure.className = "yorna-image";
      const img = document.createElement("img");
      img.alt = node.attrs.alt;
      img.loading = "lazy";
      img.draggable = false;
      const caption = document.createElement("figcaption");
      const label = node.attrs.alt ? `${node.attrs.alt} — ${node.attrs.src}` : node.attrs.src;
      caption.textContent = label;
      img.onerror = () => {
        figure.classList.add("is-broken");
        caption.textContent =
          isLocalPath(node.attrs.src) && !isTauri()
            ? `${label}  ·  local file — previews in the desktop app`
            : `${label}  ·  not found`;
      };
      img.src = resolveImageSrc(node.attrs.src);
      figure.append(img, caption);
      return { dom: figure };
    };
  },

  addCommands() {
    return {
      insertImageRef:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    };
  },
});
