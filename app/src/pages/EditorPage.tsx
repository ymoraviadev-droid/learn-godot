import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
  renameChapter,
  saveToDisk,
  exportAllContent,
  importContent,
} from "@/lib/content";
import type { Chapter } from "@/types/chapter";

const AUTO_SAVE_INTERVAL = 30_000;

export function EditorPage() {
  const { slug } = useParams();
  const { hash } = useLocation();
  const navigate = useNavigate();
  const [chapters, setChapters] = useState<Chapter[]>(getAllChapters);
  const [currentChapter, setCurrentChapter] = useState<Chapter | undefined>();
  const [showNewChapterDialog, setShowNewChapterDialog] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const dirtyRef = useRef(false);
  const saveStatusRef = useRef<HTMLSpanElement>(null);
  const saveBtnRef = useRef<HTMLButtonElement>(null);

  const updateSaveStatusUI = useCallback((status: "saved" | "unsaved" | "saving") => {
    const labels = { saved: "נשמר", unsaved: "שינויים לא שמורים", saving: "שומר..." };
    if (saveStatusRef.current) saveStatusRef.current.textContent = labels[status];
    if (saveBtnRef.current) saveBtnRef.current.disabled = status !== "unsaved";
  }, []);

  useEffect(() => {
    if (slug) {
      const chapter = getChapterBySlug(slug);
      setCurrentChapter(chapter);
      dirtyRef.current = false;
      updateSaveStatusUI("saved");
    } else {
      setCurrentChapter(undefined);
    }
  }, [slug, updateSaveStatusUI]);

  // Scroll to heading anchor
  useEffect(() => {
    if (!hash) return;
    const id = decodeURIComponent(hash.slice(1));
    const tryScroll = (attempts = 0) => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (attempts < 10) {
        setTimeout(() => tryScroll(attempts + 1), 100);
      }
    };
    tryScroll();
  }, [hash, slug]);

  const refreshChapters = useCallback(() => {
    setChapters(getAllChapters());
  }, []);

  const currentChapterRef = useRef(currentChapter);
  currentChapterRef.current = currentChapter;

  const handleContentUpdate = useCallback((content: JSONContent) => {
    const chapter = currentChapterRef.current;
    if (!chapter) return;
    saveChapter({ ...chapter, content });
    currentChapterRef.current = { ...chapter, content };
    if (!dirtyRef.current) {
      dirtyRef.current = true;
      updateSaveStatusUI("unsaved");
    }
  }, [updateSaveStatusUI]);

  const handleSave = useCallback(async () => {
    if (!dirtyRef.current) return;
    updateSaveStatusUI("saving");
    await saveToDisk();
    dirtyRef.current = false;
    updateSaveStatusUI("saved");
  }, [updateSaveStatusUI]);

  // Ctrl+S
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

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (dirtyRef.current) {
        handleSave();
      }
    }, AUTO_SAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [handleSave]);

  const handleCreateChapter = () => {
    setNewChapterTitle("");
    setShowNewChapterDialog(true);
  };

  const confirmCreateChapter = async () => {
    if (!newChapterTitle.trim()) return;
    const chapter = createChapter(newChapterTitle.trim());
    refreshChapters();
    setShowNewChapterDialog(false);
    await saveToDisk();
    navigate(`/edit/${chapter.slug}`);
  };

  const handleDeleteChapter = async (id: string) => {
    if (!confirm("למחוק את הפרק?")) return;
    deleteChapter(id);
    refreshChapters();
    await saveToDisk();
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
      reader.onload = async () => {
        try {
          importContent(reader.result as string);
          refreshChapters();
          await saveToDisk();
          navigate("/edit");
        } catch {
          alert("קובץ לא תקין");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };


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
              <input
                className="text-sm font-medium bg-transparent border-none outline-none focus:ring-1 focus:ring-primary rounded px-1 min-w-0 max-w-75"
                value={currentChapter.title}
                onChange={(e) => {
                  const newTitle = e.target.value;
                  const updated = renameChapter(currentChapter.id, newTitle);
                  if (updated) {
                    setCurrentChapter({ ...updated, content: currentChapter.content });
                    refreshChapters();
                    if (!dirtyRef.current) {
                      dirtyRef.current = true;
                      updateSaveStatusUI("unsaved");
                    }
                  }
                }}
                dir="rtl"
              />
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {currentChapter && (
              <>
                <span ref={saveStatusRef} className="text-xs text-muted-foreground hidden sm:inline">
                  נשמר
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      ref={(el) => {
                        (saveBtnRef as React.MutableRefObject<HTMLButtonElement | null>).current = el;
                        if (el) el.disabled = !dirtyRef.current;
                      }}
                      className="inline-flex items-center justify-center rounded-md h-7 w-7 hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none"
                      onClick={handleSave}
                    >
                      <Save className="h-4 w-4" />
                    </button>
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
        <DialogContent aria-describedby={undefined}>
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
