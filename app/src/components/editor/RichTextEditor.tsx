import { EditorContent } from "@tiptap/react";
import type { JSONContent } from "@tiptap/react";
import { useEditorSetup } from "./useEditorSetup";
import { EditorToolbar } from "./EditorToolbar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RichTextEditorProps {
  content?: JSONContent;
  onUpdate?: (content: JSONContent) => void;
}

export function RichTextEditor({ content, onUpdate }: RichTextEditorProps) {
  const editor = useEditorSetup({
    content,
    editable: true,
    onUpdate,
  });

  if (!editor) return null;

  const wordCount = editor.storage.characterCount.words();
  const charCount = editor.storage.characterCount.characters();

  return (
    <div className="flex flex-col h-full border rounded-lg bg-card overflow-hidden">
      <EditorToolbar editor={editor} />

      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-6">
          <EditorContent editor={editor} />
        </div>
      </ScrollArea>

      <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground">
        <span>{wordCount} מילים · {charCount} תווים</span>
        <span className="text-xs">Ctrl+S לשמירה</span>
      </div>
    </div>
  );
}
