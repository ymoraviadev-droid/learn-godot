import { useParams, Navigate } from "react-router-dom";
import { ChapterSidebar } from "@/components/layout/ChapterSidebar";
import { MobileChapterDrawer } from "@/components/layout/MobileChapterDrawer";
import { ChapterContent } from "@/components/reader/ChapterContent";
import { BookOpen } from "lucide-react";
import { getAllChapters, getChapterBySlug } from "@/lib/content";

export function ReaderPage() {
  const { slug } = useParams();
  const chapters = getAllChapters();

  if (!slug && chapters.length > 0) {
    return <Navigate to={`/chapter/${chapters[0].slug}`} replace />;
  }

  const currentChapter = slug ? getChapterBySlug(slug) : undefined;

  return (
    <div className="flex flex-1 overflow-hidden">
      <ChapterSidebar chapters={chapters} basePath="/chapter" />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile chapter navigation */}
        <div className="md:hidden flex items-center gap-2 px-4 py-2 border-b">
          <MobileChapterDrawer chapters={chapters} basePath="/chapter" />
          {currentChapter && (
            <h1 className="text-sm font-medium truncate">{currentChapter.title}</h1>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {currentChapter ? (
            <ChapterContent chapter={currentChapter} />
          ) : (
            <div className="flex items-center justify-center h-full min-h-[60vh]">
              <div className="text-center space-y-4 p-8">
                <BookOpen className="h-16 w-16 text-muted-foreground/30 mx-auto" />
                <h2 className="text-2xl font-bold">למד Godot עם C#</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {chapters.length === 0
                    ? "עדיין אין תוכן. עבור למצב עריכה כדי ליצור את הפרק הראשון."
                    : "בחר פרק מהתפריט כדי להתחיל לקרוא."}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
