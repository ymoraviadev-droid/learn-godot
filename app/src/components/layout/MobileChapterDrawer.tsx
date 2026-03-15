import { Link, useParams } from "react-router-dom";
import { Menu, Plus } from "lucide-react";
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
import type { Chapter } from "@/types/chapter";
import { useState } from "react";

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
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <Menu className="h-5 w-5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>פרקים</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <nav className="space-y-1">
              {chapters.map((chapter) => {
                const isActive = chapter.slug === slug;
                return (
                  <Link
                    key={chapter.id}
                    to={`${basePath}/${chapter.slug}`}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "block py-2.5 px-3 rounded-md text-sm transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground font-medium"
                        : "text-foreground hover:bg-accent/50"
                    )}
                  >
                    <span className="text-xs text-muted-foreground ml-2">
                      {chapter.order}.
                    </span>
                    {chapter.title}
                  </Link>
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
