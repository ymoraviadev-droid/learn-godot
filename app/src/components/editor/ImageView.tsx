import { useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { Trash2, Replace } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ImageGalleryDialog } from "@/components/gallery/ImageGalleryDialog";

export function ImageView({ node, editor, getPos }: NodeViewProps) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const src = node.attrs.src as string;
  const alt = (node.attrs.alt as string) || "";

  const handleRemove = () => {
    const pos = getPos();
    if (typeof pos === "number") {
      editor.chain().focus().deleteRange({ from: pos, to: pos + node.nodeSize }).run();
    }
  };

  const handleReplace = (url: string) => {
    const pos = getPos();
    if (typeof pos === "number") {
      editor.chain().focus().deleteRange({ from: pos, to: pos + node.nodeSize }).setImage({ src: url }).run();
    }
    setGalleryOpen(false);
  };

  return (
    <NodeViewWrapper className="relative group my-2" data-drag-handle>
      <img src={src} alt={alt} className="max-w-full rounded" />

      <div className="absolute top-2 left-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleRemove}
              className="p-1.5 rounded-md bg-background/90 border shadow-sm hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>הסר תמונה</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setGalleryOpen(true)}
              className="p-1.5 rounded-md bg-background/90 border shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
            >
              <Replace className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>החלף תמונה</TooltipContent>
        </Tooltip>
      </div>

      <ImageGalleryDialog
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
        mode="pick"
        onSelect={handleReplace}
      />
    </NodeViewWrapper>
  );
}
