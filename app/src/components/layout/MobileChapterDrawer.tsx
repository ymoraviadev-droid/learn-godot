import { Link, useParams, useLocation } from "react-router-dom";
import { Menu, Plus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/cn";
import { extractHeadings } from "@/lib/headings";
import type { Chapter } from "@/types/chapter";
import { useState, useRef } from "react";

interface MobileChapterDrawerProps {
  chapters: Chapter[];
  basePath: string;
  onCreateChapter?: () => void;
}

export function MobileChapterDrawer({
  chapters,
  basePath,
  onCreateChapter,
}: MobileChapterDrawerProps) {
  const { slug } = useParams();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(() => {
    return slug ? new Set([slug]) : new Set();
  });

  // Auto-expand the active chapter and collapse others when slug changes
  const prevSlugRef = useRef(slug);
  if (slug && slug !== prevSlugRef.current) {
    prevSlugRef.current = slug;
    setExpandedChapters(new Set([slug]));
  }

  const toggleExpanded = (chapterSlug: string) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapterSlug)) next.delete(chapterSlug);
      else next.add(chapterSlug);
      return next;
    });
  };

  return (
    <div className="md:hidden">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <Menu className="h-5 w-5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>פרקים</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <nav className="space-y-1">
              {chapters.map((chapter) => {
                const isActive = chapter.slug === slug;
                const isExpanded = expandedChapters.has(chapter.slug);
                const headings = extractHeadings(chapter.content);
                const hasSummary = headings.some((h) => h.text === "סיכום");
                const hasQuiz = headings.some((h) => h.text.startsWith("שאלון"));
                const allHeadings = [
                  ...headings,
                  ...(!hasSummary ? [{ id: "סיכום", text: "סיכום", level: 2 }] : []),
                  ...(!hasQuiz ? [{ id: "שאלון-ידע", text: "שאלון ידע", level: 2 }] : []),
                ];
                const hasHeadings = allHeadings.length > 0;

                return (
                  <div key={chapter.id}>
                    <div
                      className={cn(
                        "flex items-center gap-1 rounded-md text-sm transition-colors",
                        isActive
                          ? "bg-accent text-accent-foreground font-medium"
                          : "text-foreground hover:bg-accent/50"
                      )}
                    >
                      <Link
                        to={`${basePath}/${chapter.slug}`}
                        onClick={() => { window.scrollTo(0, 0); setOpen(false); }}
                        className="flex-1 py-2.5 px-3 min-w-0 wrap-break-word leading-snug"
                      >
                        <span className="text-xs text-muted-foreground ml-2">
                          {chapter.order}.
                        </span>
                        {chapter.title}
                      </Link>

                      {hasHeadings && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            toggleExpanded(chapter.slug);
                          }}
                          className="p-1.5 rounded hover:bg-accent/50 transition-colors shrink-0"
                        >
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 transition-transform",
                              isExpanded && "rotate-180"
                            )}
                          />
                        </button>
                      )}
                    </div>

                    {isExpanded && (
                      <div className="mr-4 pr-3 border-r border-accent/50 space-y-0.5 py-0.5">
                        {allHeadings.map((heading) => {
                          const headingHash = `#${heading.id}`;
                          const isHeadingActive =
                            isActive && location.hash === headingHash;
                          const isSpecial = heading.text === "סיכום" || heading.text.startsWith("שאלון");

                          return (
                            <div key={heading.id}>
                              {isSpecial && (
                                <div className="border-t border-accent/30 my-1 mx-2" />
                              )}
                              <Link
                                to={`${basePath}/${chapter.slug}${headingHash}`}
                                onClick={() => setOpen(false)}
                                className={cn(
                                  "block text-xs py-1.5 px-3 rounded-sm transition-colors",
                                  isSpecial && "font-medium",
                                  isHeadingActive
                                    ? "text-accent-foreground bg-accent/60"
                                    : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                                )}
                              >
                                {heading.text}
                              </Link>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {chapters.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  אין פרקים עדיין.
                </p>
              )}
            </nav>
          </ScrollArea>

          {onCreateChapter && (
            <Button
              variant="outline"
              onClick={() => {
                onCreateChapter();
                setOpen(false);
              }}
              className="w-full gap-2"
            >
              <Plus className="h-4 w-4" />
              פרק חדש
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
