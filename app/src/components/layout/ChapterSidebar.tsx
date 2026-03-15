import { Link, useParams } from "react-router-dom";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
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
            return (
              <div
                key={chapter.id}
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

                <Link
                  to={`${basePath}/${chapter.slug}`}
                  dir="rtl"
                  className="flex-1 py-2 px-2 truncate text-right"
                >
                  <span className="text-xs text-muted-foreground ml-2">
                    {chapter.order}.
                  </span>
                  {chapter.title}
                </Link>

                {onDeleteChapter && (
                  <GripVertical className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-40 ml-0.5 cursor-grab" />
                )}
              </div>
            );
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
}
