import { useState, useEffect, useRef } from "react";
import { Upload, Trash2, Search, X, ChevronRight, ChevronLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import {
  listImages,
  uploadImage,
  deleteImage,
  formatFileSize,
  type ImageInfo,
} from "@/lib/images";

const PAGE_SIZES = [12, 24, 48] as const;

interface ImageGalleryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "manage" | "pick";
  onSelect?: (url: string) => void;
}

export function ImageGalleryDialog({
  open,
  onOpenChange,
  mode,
  onSelect,
}: ImageGalleryDialogProps) {
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(12);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setLoading(true);
      listImages().then((imgs) => {
        setImages(imgs);
        setLoading(false);
      });
      setFilter("");
      setPage(0);
    }
  }, [open]);

  // Reset page when filter or pageSize changes
  useEffect(() => {
    setPage(0);
  }, [filter, pageSize]);

  const refresh = async () => {
    const imgs = await listImages();
    setImages(imgs);
  };

  const scrollToTop = () => {
    scrollRef.current?.querySelector("[data-radix-scroll-area-viewport]")?.scrollTo(0, 0);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await uploadImage(file);
    if (result) {
      if (mode === "pick" && onSelect) {
        onSelect(result.url);
        onOpenChange(false);
      } else {
        await refresh();
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (filename: string) => {
    if (!confirm(`למחוק את ${filename}?`)) return;
    await deleteImage(filename);
    await refresh();
  };

  const handlePick = (url: string) => {
    if (mode === "pick" && onSelect) {
      onSelect(url);
      onOpenChange(false);
    }
  };

  const filtered = filter
    ? images.filter((img) =>
        img.filename.toLowerCase().includes(filter.toLowerCase())
      )
    : images;

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paged = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const goToPage = (p: number) => {
    setPage(p);
    scrollToTop();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl h-[80vh] flex flex-col gap-0 p-0"
        aria-describedby={undefined}
      >
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 space-y-3 sm:space-y-4 shrink-0">
          <div className="flex items-center justify-between pl-8">
            <DialogTitle>גלריית תמונות</DialogTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {filtered.length} תמונות
              </span>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">העלאה</span>
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
              />
            </div>
          </div>

          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="חפש תמונה..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pr-9"
            />
            {filter && (
              <button
                onClick={() => setFilter("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-4 sm:px-6" ref={scrollRef}>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-muted-foreground">טוען...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <p className="text-muted-foreground">
                {filter ? "לא נמצאו תמונות." : "אין תמונות עדיין."}
              </p>
              {!filter && (
                <Button
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  העלה תמונה ראשונה
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
              {paged.map((img) => (
                <div
                  key={img.filename}
                  className="group relative rounded-lg border bg-muted/30 overflow-hidden"
                >
                  <button
                    type="button"
                    className="w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary rounded-lg"
                    onClick={() => {
                      if (mode === "pick") {
                        handlePick(img.url);
                      } else {
                        window.open(img.url, "_blank");
                      }
                    }}
                  >
                    <div className="aspect-square relative">
                      <img
                        src={img.url}
                        alt={img.filename}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-contain bg-black/5 p-1"
                      />
                      <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors" />
                    </div>
                  </button>

                  <div className="px-2 py-1.5 flex items-center gap-1">
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs truncate"
                        dir="ltr"
                        title={img.filename}
                      >
                        {img.filename}
                      </p>
                      <p className="text-[10px] text-muted-foreground" dir="ltr">
                        {formatFileSize(img.sizeBytes)}
                      </p>
                    </div>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(img.filename);
                          }}
                          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-opacity shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>מחק</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Pagination footer */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t shrink-0">
            <div className="flex items-center gap-1">
              {PAGE_SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => setPageSize(size)}
                  className={cn(
                    "px-2 py-1 text-xs rounded transition-colors",
                    pageSize === size
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {size}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {safePage + 1} / {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => goToPage(safePage - 1)}
                  disabled={safePage === 0}
                  className="p-1 rounded hover:bg-accent disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => goToPage(safePage + 1)}
                  disabled={safePage >= totalPages - 1}
                  className="p-1 rounded hover:bg-accent disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
