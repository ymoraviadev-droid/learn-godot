import type { JSONContent } from "@tiptap/react";
import type { Chapter, BookMeta } from "@/types/chapter";

const DEFAULT_META: BookMeta = {
  title: "למד Godot עם C#",
  description: "מדריך בעברית לפיתוח משחקים עם Godot ו-C#",
  author: "",
  language: "he",
  chapterOrder: [],
};

// In-memory store — loaded from disk via fetch on init
let chaptersCache: Chapter[] = [];
let metaCache: BookMeta = { ...DEFAULT_META };

async function loadFromDisk() {
  // Try new per-chapter format first (meta.json + individual chapter files)
  try {
    const metaRes = await fetch("/content/chapters/meta.json?t=" + Date.now());
    if (metaRes.ok) {
      const meta = await metaRes.json();
      metaCache = { ...DEFAULT_META, ...meta };

      const chapters = await Promise.all(
        (meta.chapterOrder as string[]).map(async (id) => {
          try {
            const res = await fetch(
              `/content/chapters/${encodeURIComponent(id)}.json?t=${Date.now()}`
            );
            if (res.ok) return res.json() as Promise<Chapter>;
          } catch {}
          return null;
        })
      );
      chaptersCache = chapters.filter((c): c is Chapter => c !== null);
      return;
    }
  } catch {}

  // Fallback: legacy single-file format
  try {
    const res = await fetch("/content/chapters/godot-tutorial-content.json?t=" + Date.now());
    if (res.ok) {
      const data = await res.json();
      chaptersCache = data.chapters || [];
      metaCache = { ...DEFAULT_META, ...(data.meta || {}) };
    }
  } catch {
    // First run — no content file yet
  }
}

const initPromise = loadFromDisk();

export async function waitForInit() {
  await initPromise;
}

export function getAllChapters(): Chapter[] {
  return [...chaptersCache].sort((a, b) => a.order - b.order);
}

export function getChapterBySlug(slug: string): Chapter | undefined {
  return chaptersCache.find((chapter) => chapter.slug === slug);
}

export function renameChapter(id: string, newTitle: string): Chapter | undefined {
  const chapter = chaptersCache.find((c) => c.id === id);
  if (!chapter) return undefined;
  chapter.title = newTitle;
  chapter.updatedAt = new Date().toISOString();
  return chapter;
}

export function getPartsOverrides(): Record<string, { title?: string; description?: string }> {
  return { ...(metaCache.partsOverrides || {}) };
}

export function savePartOverride(
  partSlug: string,
  override: { title?: string; description?: string }
) {
  if (!metaCache.partsOverrides) metaCache.partsOverrides = {};
  metaCache.partsOverrides[partSlug] = {
    ...metaCache.partsOverrides[partSlug],
    ...override,
  };
}

export function saveChapter(chapter: Chapter): Chapter {
  const existingIndex = chaptersCache.findIndex((c) => c.id === chapter.id);

  const updatedChapter = {
    ...chapter,
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    chaptersCache[existingIndex] = updatedChapter;
  } else {
    updatedChapter.createdAt = new Date().toISOString();
    chaptersCache.push(updatedChapter);
  }

  syncMetaChapterOrder();
  return updatedChapter;
}

export function createChapter(title: string): Chapter {
  const slug = generateSlug(title);
  const now = new Date().toISOString();

  const chapter: Chapter = {
    id: `${String(chaptersCache.length + 1).padStart(2, "0")}-${slug}`,
    title,
    slug,
    order: chaptersCache.length + 1,
    createdAt: now,
    updatedAt: now,
    tags: [],
    content: {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: title }],
        },
        {
          type: "paragraph",
        },
      ],
    },
  };

  chaptersCache.push(chapter);
  syncMetaChapterOrder();
  return chapter;
}

export function deleteChapter(id: string) {
  chaptersCache = chaptersCache.filter((c) => c.id !== id);
  chaptersCache.forEach((c, i) => (c.order = i + 1));
  syncMetaChapterOrder();
}

export function reorderChapters(orderedIds: string[]) {
  const reordered = orderedIds
    .map((id, index) => {
      const chapter = chaptersCache.find((c) => c.id === id);
      if (chapter) chapter.order = index + 1;
      return chapter;
    })
    .filter(Boolean) as Chapter[];

  chaptersCache = reordered;
  syncMetaChapterOrder();
}

export function getBookMeta(): BookMeta {
  return { ...metaCache };
}

export function saveBookMeta(meta: BookMeta) {
  metaCache = { ...meta };
}

function syncMetaChapterOrder() {
  metaCache.chapterOrder = [...chaptersCache]
    .sort((a, b) => a.order - b.order)
    .map((c) => c.id);
}

function generateSlug(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^\w\u0590-\u05FF\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/** Normalize code block text: trim trailing newlines to exactly one */
function normalizeCodeBlocks(node: JSONContent): JSONContent {
  if (node.type === "codeBlock" && node.content) {
    return {
      ...node,
      content: node.content.map((child) => {
        if (child.type === "text" && typeof child.text === "string") {
          return { ...child, text: child.text.replace(/\n+$/, "\n") };
        }
        return child;
      }),
    };
  }
  if (node.content) {
    return { ...node, content: node.content.map(normalizeCodeBlocks) };
  }
  return node;
}

export function exportAllContent(): string {
  const chapters = getAllChapters().map((ch) => ({
    ...ch,
    content: normalizeCodeBlocks(ch.content),
  }));
  return JSON.stringify({ meta: metaCache, chapters }, null, 2);
}

export function importContent(jsonString: string) {
  const data = JSON.parse(jsonString);
  if (data.meta) metaCache = { ...DEFAULT_META, ...data.meta };
  if (data.chapters) chaptersCache = [...data.chapters];
}

/** Save all content to disk via API */
export async function saveToDisk(): Promise<boolean> {
  try {
    const json = exportAllContent();
    const res = await fetch("/api/save-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: json,
    });
    return res.ok;
  } catch {
    return false;
  }
}
