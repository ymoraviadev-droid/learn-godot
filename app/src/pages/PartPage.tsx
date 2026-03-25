import { useParams, Navigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ChapterSidebar } from "@/components/layout/ChapterSidebar";
import { MobileChapterDrawer } from "@/components/layout/MobileChapterDrawer";
import { getAllChapters } from "@/lib/content";
import { PARTS, getPartBySlug, getPartNumber, groupChaptersByPart } from "@/lib/parts";
import { cn } from "@/lib/cn";

export function PartPage() {
  const { partSlug } = useParams();
  const chapters = getAllChapters();
  const part = partSlug ? getPartBySlug(partSlug) : undefined;

  if (!part) {
    return <Navigate to="/" replace />;
  }

  const partNumber = getPartNumber(part.slug);
  const partIndex = partNumber - 1;
  const PartIcon = part.icon;

  // Get actual chapter objects for this part
  const grouped = groupChaptersByPart(chapters);
  const partChapters = grouped[partIndex]?.chapters ?? [];

  // Prev/next parts
  const prevPart = partIndex > 0 ? PARTS[partIndex - 1] : undefined;
  const nextPart = partIndex < PARTS.length - 1 ? PARTS[partIndex + 1] : undefined;

  return (
    <div className="flex flex-1 overflow-hidden">
      <ChapterSidebar chapters={chapters} basePath="/chapter" />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile navigation */}
        <div className="md:hidden flex items-center gap-2 px-4 py-2 border-b">
          <MobileChapterDrawer chapters={chapters} basePath="/chapter" />
          <h1 className="text-sm font-medium truncate">
            חלק {partNumber}: {part.title}
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="max-w-3xl mx-auto px-6 py-12 md:py-16">
            {/* Part header */}
            <div className="text-center space-y-4 mb-12">
              <div className="flex items-center justify-center gap-3">
                <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary text-sm font-bold text-muted-foreground">
                  {partNumber}
                </span>
                <PartIcon className={cn("h-8 w-8", part.color)} />
              </div>

              <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">
                {part.title}
              </h1>

              <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                {part.description}
              </p>
            </div>

            {/* Chapter list */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold mb-4">
                פרקים בחלק הזה
              </h2>

              {partChapters.length > 0 ? (
                <div className="space-y-2">
                  {partChapters.map((chapter) => (
                    <Link
                      key={chapter.slug}
                      to={`/chapter/${chapter.slug}`}
                      className="block p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:bg-card/80 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-7 h-7 rounded-md bg-secondary text-xs font-bold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          {chapter.order}
                        </span>
                        <span className="font-medium group-hover:text-primary transition-colors">
                          {chapter.title}
                        </span>
                        <ArrowLeft className="h-4 w-4 mr-auto text-muted-foreground/0 group-hover:text-primary transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  הפרקים בחלק הזה עדיין בכתיבה.
                </p>
              )}
            </div>

            {/* Part navigation */}
            <div className="flex items-center justify-between mt-16 pt-8 border-t border-border/50">
              {prevPart ? (
                <Link
                  to={`/part/${prevPart.slug}`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span className="block text-xs text-muted-foreground/60 mb-0.5">
                    חלק קודם
                  </span>
                  {prevPart.title}
                </Link>
              ) : (
                <div />
              )}

              {nextPart ? (
                <Link
                  to={`/part/${nextPart.slug}`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
                >
                  <span className="block text-xs text-muted-foreground/60 mb-0.5">
                    חלק הבא
                  </span>
                  {nextPart.title}
                </Link>
              ) : (
                <div />
              )}
            </div>

            {/* Start reading CTA */}
            {partChapters.length > 0 && (
              <div className="text-center mt-12">
                <Link
                  to={`/chapter/${partChapters[0].slug}`}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
                >
                  <span>התחל לקרוא</span>
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
