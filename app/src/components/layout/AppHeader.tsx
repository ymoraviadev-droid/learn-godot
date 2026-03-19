import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { BookOpen, PenLine, Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { ImageGalleryDialog } from "@/components/gallery/ImageGalleryDialog";

const isDevMode = import.meta.env.VITE_DEV_MODE === "true";

export function AppHeader() {
  const location = useLocation();
  const isEditorMode = location.pathname.startsWith("/edit");
  const [galleryOpen, setGalleryOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-secondary/80 backdrop-blur">
      <div className="flex h-12 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
          >
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-bold text-lg hidden sm:inline">למד Godot עם C#</span>
          </Link>
        </div>

        <nav className="flex items-center gap-1">
          {isDevMode && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5"
                onClick={() => setGalleryOpen(true)}
              >
                <Images className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">גלריה</span>
              </Button>

              <Button
                variant={isEditorMode ? "secondary" : "ghost"}
                size="sm"
                asChild
              >
                <Link to="/edit" className={cn("gap-1.5", isEditorMode && "pointer-events-none")}>
                  <PenLine className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">עריכה</span>
                </Link>
              </Button>
            </>
          )}

          <Button
            variant={!isEditorMode ? "secondary" : "ghost"}
            size="sm"
            asChild
          >
            <Link to="/" className={cn("gap-1.5", !isEditorMode && "pointer-events-none")}>
              <BookOpen className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">קריאה</span>
            </Link>
          </Button>
        </nav>
      </div>

      {isDevMode && (
        <ImageGalleryDialog
          open={galleryOpen}
          onOpenChange={setGalleryOpen}
          mode="manage"
        />
      )}
    </header>
  );
}
