import type { JSONContent } from "@tiptap/react";

export interface Chapter {
  id: string;
  title: string;
  slug: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  content: JSONContent;
}

export interface PartOverride {
  title?: string;
  description?: string;
}

export interface BookMeta {
  title: string;
  description: string;
  author: string;
  language: string;
  chapterOrder: string[];
  partsOverrides?: Record<string, PartOverride>;
}
