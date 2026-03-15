import { useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { Plus, Trash2, GripVertical, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import { extractHeadings } from "@/lib/headings";
import type { Chapter } from "@/types/chapter";

interface ChapterSidebarProps {
  chapters: Chapter[];
  basePath: string;
  onCreateChapter?: () => void;
  onDeleteChapter?: (id: string) => void;
}

export function ChapterSidebar({
  chapters,
  basePath,
  onCreateChapter,
  onDeleteChapter,
}: ChapterSidebarProps) {
  const { slug } = useParams();
  const location = useLocation();
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(() => {
    return slug ? new Set([slug]) : new Set();
  });

  const toggleExpanded = (chapterSlug: string) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapterSlug)) next.delete(chapterSlug);
      else next.add(chapterSlug);
      return next;
    });
  };

  return (
    <aside className="w-64 shrink-0 border-l bg-sidebar-background hidden md:flex flex-col">
      <div className="flex items-center justify-between p-3 border-b">
        <h2 className="text-sm font-semibold text-sidebar-foreground">פרקים</h2>
        {onCreateChapter && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-xs" onClick={onCreateChapter}>
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>פרק חדש</TooltipContent>
          </Tooltip>
        )}
      </div>

      <ScrollArea className="flex-1">
        <nav className="p-2 space-y-0.5">
          {chapters.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8 px-4">
              אין פרקים עדיין.
              {onCreateChapter && " לחץ על + כדי ליצור פרק חדש."}
            </p>
          )}

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
                  dir="ltr"
                  className={cn(
                    "group flex items-center gap-1 rounded-md text-sm transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  {onDeleteChapter && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            onDeleteChapter(chapter.id);
                          }}
                          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-opacity cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>מחק פרק</TooltipContent>
                    </Tooltip>
                  )}

                  <div dir="rtl" className="flex-1 flex items-center gap-1 py-2 px-2">
                    <Link
                      to={`${basePath}/${chapter.slug}`}
                      className="flex-1 truncate text-right"
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
                        className="p-0.5 rounded hover:bg-sidebar-accent/50 transition-colors shrink-0"
                      >
                        <ChevronDown
                          className={cn(
                            "h-3.5 w-3.5 transition-transform",
                            isExpanded && "rotate-180"
                          )}
                        />
                      </button>
                    )}
                  </div>

                  {onDeleteChapter && (
                    <GripVertical className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-40 ml-0.5 cursor-grab" />
                  )}
                </div>

                {isExpanded && (
                  <div className="mr-6 pr-3 border-r border-sidebar-accent/50 space-y-0.5 py-0.5">
                    {allHeadings.map((heading) => {
                      const headingHash = `#${heading.id}`;
                      const isHeadingActive =
                        isActive && location.hash === headingHash;
                      const isSpecial = heading.text === "סיכום" || heading.text.startsWith("שאלון");

                      return (
                        <div key={heading.id}>
                          {isSpecial && (
                            <div className="border-t border-sidebar-accent/30 my-1 mx-2" />
                          )}
                          <Link
                            to={`${basePath}/${chapter.slug}${headingHash}`}
                            dir="rtl"
                            className={cn(
                              "block text-xs py-1 px-3 rounded-sm truncate transition-colors",
                              isSpecial && "font-medium",
                              isHeadingActive
                                ? "text-sidebar-accent-foreground bg-sidebar-accent/60"
                                : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/30"
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
        </nav>
      </ScrollArea>
    </aside>
  );
}
