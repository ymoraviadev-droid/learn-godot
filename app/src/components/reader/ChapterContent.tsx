import { EditorContent } from "@tiptap/react";
import { Link } from "react-router-dom";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { useEditorSetup } from "@/components/editor/useEditorSetup";
import type { Chapter } from "@/types/chapter";

interface ChapterContentProps {
  chapter: Chapter;
  prevChapter?: Chapter;
  nextChapter?: Chapter;
}

export function ChapterContent({ chapter, prevChapter, nextChapter }: ChapterContentProps) {
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

      {(prevChapter || nextChapter) && (
        <nav className="mt-8 flex items-stretch gap-4" dir="rtl">
          {prevChapter ? (
            <Link
              to={`/chapter/${prevChapter.slug}`}
              className="flex-1 flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors group"
            >
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">הפרק הקודם</div>
                <div className="text-sm font-medium wrap-break-word">{prevChapter.title}</div>
              </div>
            </Link>
          ) : (
            <div className="flex-1" />
          )}

          {nextChapter ? (
            <Link
              to={`/chapter/${nextChapter.slug}`}
              className="flex-1 flex items-center justify-end gap-3 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors group text-left"
            >
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">הפרק הבא</div>
                <div className="text-sm font-medium wrap-break-word">{nextChapter.title}</div>
              </div>
              <ChevronLeft className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>
          ) : (
            <div className="flex-1" />
          )}
        </nav>
      )}
    </article>
  );
}
