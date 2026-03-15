import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { JSONContent } from "@tiptap/react";
import { Save, Download, Upload } from "lucide-react";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { ChapterSidebar } from "@/components/layout/ChapterSidebar";
import { MobileChapterDrawer } from "@/components/layout/MobileChapterDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  getAllChapters,
  getChapterBySlug,
  saveChapter,
  createChapter,
  deleteChapter,
  exportAllContent,
  importContent,
} from "@/lib/content";
import type { Chapter } from "@/types/chapter";

export function EditorPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [chapters, setChapters] = useState<Chapter[]>(getAllChapters);
  const [currentChapter, setCurrentChapter] = useState<Chapter | undefined>();
  const [pendingContent, setPendingContent] = useState<JSONContent | null>(null);
  const [showNewChapterDialog, setShowNewChapterDialog] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "unsaved" | "saving">("saved");

  useEffect(() => {
    if (slug) {
      const chapter = getChapterBySlug(slug);
      setCurrentChapter(chapter);
      setPendingContent(null);
      setSaveStatus("saved");
    } else {
      setCurrentChapter(undefined);
    }
  }, [slug]);

  const refreshChapters = useCallback(() => {
    setChapters(getAllChapters());
  }, []);

  const handleContentUpdate = useCallback((content: JSONContent) => {
    setPendingContent(content);
    setSaveStatus("unsaved");
  }, []);

  const handleSave = useCallback(async () => {
    if (!currentChapter || !pendingContent) return;
    setSaveStatus("saving");
    const updated = saveChapter({ ...currentChapter, content: pendingContent });
    setCurrentChapter(updated);
    setPendingContent(null);
    refreshChapters();

    // Also save to disk (content/chapters/)
    try {
      const json = exportAllContent();
      await fetch("/api/save-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: json,
      });
    } catch {
      // localStorage is already saved, disk write is best-effort
    }

    setSaveStatus("saved");
  }, [currentChapter, pendingContent, refreshChapters]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  const handleCreateChapter = () => {
    setNewChapterTitle("");
    setShowNewChapterDialog(true);
  };

  const confirmCreateChapter = () => {
    if (!newChapterTitle.trim()) return;
    const chapter = createChapter(newChapterTitle.trim());
    refreshChapters();
    setShowNewChapterDialog(false);
    navigate(`/edit/${chapter.slug}`);
  };

  const handleDeleteChapter = (id: string) => {
    if (!confirm("למחוק את הפרק?")) return;
    deleteChapter(id);
    refreshChapters();
    if (currentChapter?.id === id) {
      navigate("/edit");
    }
  };

  const handleExport = () => {
    const json = exportAllContent();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "godot-tutorial-content.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          importContent(reader.result as string);
          refreshChapters();
          navigate("/edit");
        } catch {
          alert("קובץ לא תקין");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const SAVE_STATUS_LABELS = {
    saved: "נשמר",
    unsaved: "שינויים לא שמורים",
    saving: "שומר...",
  } as const;

  return (
    <div className="flex flex-1 overflow-hidden">
      <ChapterSidebar
        chapters={chapters}
        basePath="/edit"
        onCreateChapter={handleCreateChapter}
        onDeleteChapter={handleDeleteChapter}
      />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Editor header bar */}
        <div className="flex items-center justify-between gap-2 px-4 py-2 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <MobileChapterDrawer
              chapters={chapters}
              basePath="/edit"
              onCreateChapter={handleCreateChapter}
            />

            {currentChapter && (
              <h1 className="text-sm font-medium truncate">
                {currentChapter.title}
              </h1>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {currentChapter && (
              <>
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  {SAVE_STATUS_LABELS[saveStatus]}
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={handleSave}
                      disabled={saveStatus !== "unsaved"}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>שמור (Ctrl+S)</TooltipContent>
                </Tooltip>
              </>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" onClick={handleExport}>
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>ייצא תוכן</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" onClick={handleImport}>
                  <Upload className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>ייבא תוכן</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Editor or empty state */}
        <div className="flex-1 overflow-hidden p-4">
          {currentChapter ? (
            <RichTextEditor
              key={currentChapter.id}
              content={currentChapter.content}
              onUpdate={handleContentUpdate}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <p className="text-lg text-muted-foreground">
                  {chapters.length === 0
                    ? "ברוכים הבאים! צור את הפרק הראשון שלך."
                    : "בחר פרק מהתפריט כדי להתחיל לערוך."}
                </p>
                {chapters.length === 0 && (
                  <Button onClick={handleCreateChapter} className="gap-2">
                    צור פרק ראשון
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* New chapter dialog */}
      <Dialog open={showNewChapterDialog} onOpenChange={setShowNewChapterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>פרק חדש</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="שם הפרק"
            value={newChapterTitle}
            onChange={(e) => setNewChapterTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirmCreateChapter()}
            autoFocus
          />
          <DialogFooter>
            <Button onClick={confirmCreateChapter} disabled={!newChapterTitle.trim()}>
              צור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
