import type { JSONContent } from "@tiptap/react";

export interface HeadingItem {
  id: string;
  text: string;
  level: number;
}

/** Extract h2 headings from Tiptap JSON content */
export function extractHeadings(content: JSONContent): HeadingItem[] {
  const headings: HeadingItem[] = [];
  if (!content.content) return headings;

  for (const node of content.content) {
    if (node.type === "heading" && node.attrs?.level === 2) {
      const text = getTextFromNode(node);
      if (text) {
        headings.push({
          id: generateHeadingId(text),
          text,
          level: node.attrs.level,
        });
      }
    }
  }

  return headings;
}

/** Check whether an h1 with the given text exists in the content */
export function hasH1(content: JSONContent, text: string): boolean {
  if (!content.content) return false;
  return content.content.some(
    (node) =>
      node.type === "heading" &&
      node.attrs?.level === 1 &&
      getTextFromNode(node).startsWith(text)
  );
}

function getTextFromNode(node: JSONContent): string {
  if (node.text) return node.text;
  if (!node.content) return "";
  return node.content.map(getTextFromNode).join("");
}

/** Generate a URL-safe ID from heading text */
export function generateHeadingId(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w\u0590-\u05FF\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
