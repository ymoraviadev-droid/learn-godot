import type { Chapter, BookMeta } from "@/types/chapter";

const CHAPTERS_STORAGE_KEY = "godot-tutorial-chapters";
const META_STORAGE_KEY = "godot-tutorial-meta";

const DEFAULT_META: BookMeta = {
  title: "למד Godot עם C#",
  description: "מדריך בעברית לפיתוח משחקים עם Godot ו-C#",
  author: "",
  language: "he",
  chapterOrder: [],
};

function readChaptersFromStorage(): Chapter[] {
  const raw = localStorage.getItem(CHAPTERS_STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function writeChaptersToStorage(chapters: Chapter[]) {
  localStorage.setItem(CHAPTERS_STORAGE_KEY, JSON.stringify(chapters));
}

function readMetaFromStorage(): BookMeta {
  const raw = localStorage.getItem(META_STORAGE_KEY);
  return raw ? { ...DEFAULT_META, ...JSON.parse(raw) } : { ...DEFAULT_META };
}

function writeMetaToStorage(meta: BookMeta) {
  localStorage.setItem(META_STORAGE_KEY, JSON.stringify(meta));
}

export function getAllChapters(): Chapter[] {
  return readChaptersFromStorage().sort((a, b) => a.order - b.order);
}

export function getChapterBySlug(slug: string): Chapter | undefined {
  return readChaptersFromStorage().find((chapter) => chapter.slug === slug);
}

export function saveChapter(chapter: Chapter): Chapter {
  const chapters = readChaptersFromStorage();
  const existingIndex = chapters.findIndex((c) => c.id === chapter.id);

  const updatedChapter = {
    ...chapter,
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    chapters[existingIndex] = updatedChapter;
  } else {
    updatedChapter.createdAt = new Date().toISOString();
    chapters.push(updatedChapter);
  }

  writeChaptersToStorage(chapters);
  syncMetaChapterOrder(chapters);
  return updatedChapter;
}

export function createChapter(title: string): Chapter {
  const chapters = readChaptersFromStorage();
  const slug = generateSlug(title);
  const now = new Date().toISOString();

  const chapter: Chapter = {
    id: `${String(chapters.length + 1).padStart(2, "0")}-${slug}`,
    title,
    slug,
    order: chapters.length + 1,
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

  chapters.push(chapter);
  writeChaptersToStorage(chapters);
  syncMetaChapterOrder(chapters);
  return chapter;
}

export function deleteChapter(id: string) {
  const chapters = readChaptersFromStorage().filter((c) => c.id !== id);
  chapters.forEach((c, i) => (c.order = i + 1));
  writeChaptersToStorage(chapters);
  syncMetaChapterOrder(chapters);
}

export function reorderChapters(orderedIds: string[]) {
  const chapters = readChaptersFromStorage();
  const reordered = orderedIds
    .map((id, index) => {
      const chapter = chapters.find((c) => c.id === id);
      if (chapter) chapter.order = index + 1;
      return chapter;
    })
    .filter(Boolean) as Chapter[];

  writeChaptersToStorage(reordered);
  syncMetaChapterOrder(reordered);
}

export function getBookMeta(): BookMeta {
  return readMetaFromStorage();
}

export function saveBookMeta(meta: BookMeta) {
  writeMetaToStorage(meta);
}

function syncMetaChapterOrder(chapters: Chapter[]) {
  const meta = readMetaFromStorage();
  meta.chapterOrder = chapters.sort((a, b) => a.order - b.order).map((c) => c.id);
  writeMetaToStorage(meta);
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
  const meta = readMetaFromStorage();
  const chapters = getAllChapters();
  return JSON.stringify({ meta, chapters }, null, 2);
}

export function importContent(jsonString: string) {
  const data = JSON.parse(jsonString);
  if (data.meta) writeMetaToStorage(data.meta);
  if (data.chapters) writeChaptersToStorage(data.chapters);
}
