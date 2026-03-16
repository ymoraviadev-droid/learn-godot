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
  try {
    const res = await fetch("/content/chapters/godot-tutorial-content.json?t=" + Date.now());
    const data = await res.json();
    chaptersCache = data.chapters || [];
    metaCache = { ...DEFAULT_META, ...(data.meta || {}) };
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

export function exportAllContent(): string {
  return JSON.stringify({ meta: metaCache, chapters: getAllChapters() }, null, 2);
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
