import { EditorContent } from "@tiptap/react";
import { useEditorSetup } from "@/components/editor/useEditorSetup";
import type { Chapter } from "@/types/chapter";

interface ChapterContentProps {
  chapter: Chapter;
}

export function ChapterContent({ chapter }: ChapterContentProps) {
  const editor = useEditorSetup({
    content: chapter.content,
    editable: false,
    placeholder: "",
  });

  if (!editor) return null;

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-8 py-8">
      <EditorContent editor={editor} />

      <footer className="mt-12 pt-6 border-t text-sm text-muted-foreground flex items-center justify-between">
        <span>
          {chapter.tags.length > 0 && (
            <span className="flex gap-2">
              {chapter.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-muted px-2 py-0.5 rounded-full text-xs"
                >
                  {tag}
                </span>
              ))}
            </span>
          )}
        </span>
        <time dateTime={chapter.updatedAt}>
          עודכן: {new Date(chapter.updatedAt).toLocaleDateString("he-IL")}
        </time>
      </footer>
    </article>
  );
}
