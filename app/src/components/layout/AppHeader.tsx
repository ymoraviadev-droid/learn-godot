import { Link, useLocation } from "react-router-dom";
import { BookOpen, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { cn } from "@/lib/cn";

export function AppHeader() {
  const location = useLocation();
  const isEditorMode = location.pathname.startsWith("/edit");

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
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

          <div className="w-px h-6 bg-border mx-1" />

          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
