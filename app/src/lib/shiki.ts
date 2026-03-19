import { createHighlighterCore, type HighlighterCore } from "shiki/core";
import { createOnigurumaEngine } from "shiki/engine/oniguruma";

let highlighterPromise: Promise<HighlighterCore> | null = null;

export function getHighlighter(): Promise<HighlighterCore> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: [import("shiki/themes/dark-plus.mjs")],
      langs: [
        import("shiki/langs/csharp.mjs"),
        import("shiki/langs/gdscript.mjs"),
        import("shiki/langs/javascript.mjs"),
        import("shiki/langs/typescript.mjs"),
        import("shiki/langs/xml.mjs"),
        import("shiki/langs/json.mjs"),
        import("shiki/langs/shellscript.mjs"),
        import("shiki/langs/python.mjs"),
        import("shiki/langs/css.mjs"),
        import("shiki/langs/html.mjs"),
      ],
      engine: createOnigurumaEngine(import("shiki/wasm")),
    });
  }
  return highlighterPromise;
}

const LANG_ALIASES: Record<string, string> = {
  bash: "shellscript",
  shell: "shellscript",
  sh: "shellscript",
  cs: "csharp",
  "c#": "csharp",
  gd: "gdscript",
  ts: "typescript",
  js: "javascript",
};

export function resolveLanguage(lang: string): string {
  return LANG_ALIASES[lang] || lang;
}

export interface ColoredToken {
  offset: number;
  length: number;
  color: string;
}

/**
 * Tokenize code with Shiki and return flat colored token list.
 */
export async function tokenizeCode(
  code: string,
  language: string
): Promise<ColoredToken[]> {
  const h = await getHighlighter();
  const lang = resolveLanguage(language);

  if (!h.getLoadedLanguages().includes(lang)) {
    return [];
  }

  const { tokens } = h.codeToTokens(code, {
    lang,
    theme: "dark-plus",
  });

  const result: ColoredToken[] = [];
  let offset = 0;

  for (const line of tokens) {
    for (const token of line) {
      if (token.color) {
        result.push({
          offset,
          length: token.content.length,
          color: token.color,
        });
      }
      offset += token.content.length;
    }
    offset += 1; // newline
  }

  return result;
}
