import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { type ColoredToken, tokenizeCode } from "@/lib/shiki";

const shikiPluginKey = new PluginKey("shiki");

/**
 * ProseMirror plugin that applies Shiki syntax highlighting
 * as inline decorations on code_block nodes.
 */
export function shikiPlugin(): Plugin {
  return new Plugin({
    key: shikiPluginKey,

    state: {
      init(_, state) {
        // Kick off async highlighting for initial content
        scheduleHighlight(state.doc);
        return DecorationSet.empty;
      },

      apply(tr, decorationSet, _oldState, newState) {
        if (tr.docChanged) {
          scheduleHighlight(newState.doc);
        }
        // Check if async result was dispatched via metadata
        const shikiResult = tr.getMeta(shikiPluginKey);
        if (shikiResult) {
          return shikiResult as DecorationSet;
        }
        // Remap decorations on doc changes
        if (tr.docChanged) {
          return decorationSet.map(tr.mapping, tr.doc);
        }
        return decorationSet;
      },
    },

    props: {
      decorations(state) {
        return this.getState(state);
      },
    },
  });
}

let pendingTimeout: ReturnType<typeof setTimeout> | null = null;
let pendingDoc: any = null;

function scheduleHighlight(doc: any) {
  pendingDoc = doc;
  if (pendingTimeout) return;
  // Small debounce to avoid running on every keystroke
  pendingTimeout = setTimeout(() => {
    pendingTimeout = null;
    runHighlight(pendingDoc);
  }, 80);
}

async function runHighlight(doc: any) {
  const decorations: Decoration[] = [];
  const promises: Promise<void>[] = [];

  doc.descendants((node: any, pos: number) => {
    if (node.type.name !== "codeBlock") return;
    const language = node.attrs.language;
    if (!language || language === "text") return;

    const code = node.textContent;
    if (!code.trim()) return;

    const blockPos = pos;

    promises.push(
      tokenizeCode(code, language).then((tokens) => {
        for (const token of tokens) {
          // +1 for the opening of the code_block node itself
          const from = blockPos + 1 + token.offset;
          const to = from + token.length;
          decorations.push(
            Decoration.inline(from, to, {
              style: `color: ${token.color}`,
            })
          );
        }
      })
    );
  });

  await Promise.all(promises);

  // Dispatch decoration update — we need access to the editor view
  // Use a global reference set by the plugin
  if (editorView) {
    const { state } = editorView;
    const decorationSet = DecorationSet.create(state.doc, decorations);
    const tr = state.tr.setMeta(shikiPluginKey, decorationSet);
    editorView.dispatch(tr);
  }
}

let editorView: any = null;

/** Call this to set the editor view reference for the plugin */
export function setShikiEditorView(view: any) {
  editorView = view;
}
