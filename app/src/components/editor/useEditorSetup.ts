import { useEditor, ReactNodeViewRenderer } from "@tiptap/react";
import type { JSONContent } from "@tiptap/react";
import { useRef } from "react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import CodeBlock from "@tiptap/extension-code-block";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Typography from "@tiptap/extension-typography";
import { CodeBlockView } from "./CodeBlockView";
import { ImageView } from "./ImageView";
import { TextDirection } from "./TextDirection";
import { shikiPlugin, setShikiEditorView } from "./ShikiPlugin";
import { generateHeadingId } from "@/lib/headings";
import Heading from "@tiptap/extension-heading";
import { Quiz } from "./QuizNode";
import { QuizEditorView } from "./QuizEditorView";
import { QuizReaderView } from "../reader/QuizReaderView";
import { NodeTree } from "./NodeTreeNode";
import { NodeTreeView } from "./NodeTreeView";

interface UseEditorSetupOptions {
  content?: JSONContent;
  editable?: boolean;
  placeholder?: string;
  onUpdate?: (content: JSONContent) => void;
}

export function useEditorSetup({
  content,
  editable = true,
  placeholder = "התחל לכתוב כאן...",
  onUpdate,
}: UseEditorSetupOptions) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  return useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: false,
        link: false,
        underline: false,
      }),
      Heading.configure({ levels: [1, 2, 3, 4, 5, 6] }).extend({
        renderHTML({ node, HTMLAttributes }) {
          const level = node.attrs.level;
          const text = node.textContent;
          const needsId = level === 2 || (level === 1 && (text === "סיכום" || text?.startsWith("שאלון")));
          const id = needsId && text ? generateHeadingId(text) : undefined;
          return [`h${level}`, { ...HTMLAttributes, ...(id ? { id } : {}) }, 0];
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
        defaultAlignment: "right",
      }),
      TextStyle,
      Color,
      FontFamily,
      Highlight.configure({ multicolor: true }),
      Underline,
      Subscript,
      Superscript,
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true, renderWrapper: true }),
      TableRow,
      TableCell,
      TableHeader,
      Image.configure({ allowBase64: true }).extend(
        editable
          ? {
              addNodeView() {
                return ReactNodeViewRenderer(ImageView);
              },
            }
          : {}
      ),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      CodeBlock.extend({
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlockView);
        },
        addProseMirrorPlugins() {
          return [shikiPlugin()];
        },
      }),
      Placeholder.configure({ placeholder }),
      CharacterCount,
      Typography,
      TextDirection,
      Quiz.extend({
        addNodeView() {
          return ReactNodeViewRenderer(editable ? QuizEditorView : QuizReaderView);
        },
      }),
      NodeTree.extend({
        addNodeView() {
          return ReactNodeViewRenderer(NodeTreeView);
        },
      }),
    ],
    content,
    editable,
    immediatelyRender: false,
    onCreate: ({ editor }) => {
      setShikiEditorView(editor.view);
    },
    editorProps: {
      attributes: {
        class: "tiptap-editor min-h-[300px] px-1 py-2 focus:outline-none",
        dir: "rtl",
      },
    },
    onUpdate: ({ editor }) => {
      onUpdateRef.current?.(editor.getJSON());
    },
  });
}
