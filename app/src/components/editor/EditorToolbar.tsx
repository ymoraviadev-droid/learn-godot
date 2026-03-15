import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  AlignRight,
  AlignCenter,
  AlignLeft,
  Highlighter,
  Palette,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Minus,
  ImagePlus,
  Link as LinkIcon,
  Table as TableIcon,
  CodeSquare,
  Undo2,
  Redo2,
  Subscript,
  Superscript,
  TableCellsMerge,
  TableCellsSplit,
  RowsIcon,
  Columns3,
  Trash2,
  RemoveFormatting,
} from "lucide-react";
import { ToolbarButton } from "./ToolbarButton";
import { ToolbarDivider } from "./ToolbarDivider";
import { ColorPickerButton } from "./ColorPickerButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface EditorToolbarProps {
  editor: Editor;
}

const FONT_FAMILIES = [
  { value: "Heebo", label: "Heebo" },
  { value: "Arial", label: "Arial" },
  { value: "Times New Roman", label: "Times New Roman" },
  { value: "Georgia", label: "Georgia" },
  { value: "Courier New", label: "Courier New" },
];

const CODE_LANGUAGES = [
  { value: "csharp", label: "C#" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "xml", label: "XML / TSCN" },
  { value: "json", label: "JSON" },
  { value: "bash", label: "Shell" },
  { value: "python", label: "Python" },
  { value: "css", label: "CSS" },
  { value: "html", label: "HTML" },
];

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const addImage = () => {
    const url = window.prompt("כתובת התמונה:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const setLink = () => {
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = window.prompt("כתובת הקישור:");
    if (url) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const currentFontFamily = editor.getAttributes("textStyle").fontFamily || "Heebo";
  const currentColor = editor.getAttributes("textStyle").color || "";
  const currentHighlight = editor.getAttributes("highlight").color || "";

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Row 1: Text formatting */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5">
        {/* History */}
        <ToolbarButton
          icon={<Undo2 className="h-4 w-4" />}
          label="בטל"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        />
        <ToolbarButton
          icon={<Redo2 className="h-4 w-4" />}
          label="בצע שוב"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        />

        <ToolbarDivider />

        {/* Font family */}
        <Select
          value={currentFontFamily}
          onValueChange={(value) =>
            editor.chain().focus().setFontFamily(value).run()
          }
        >
          <SelectTrigger className="w-28 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_FAMILIES.map((font) => (
              <SelectItem key={font.value} value={font.value}>
                <span style={{ fontFamily: font.value }}>{font.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <ToolbarDivider />

        {/* Headings */}
        <ToolbarButton
          icon={<Heading1 className="h-4 w-4" />}
          label="כותרת 1"
          isActive={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        />
        <ToolbarButton
          icon={<Heading2 className="h-4 w-4" />}
          label="כותרת 2"
          isActive={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        />
        <ToolbarButton
          icon={<Heading3 className="h-4 w-4" />}
          label="כותרת 3"
          isActive={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        />

        <ToolbarDivider />

        {/* Basic formatting */}
        <ToolbarButton
          icon={<Bold className="h-4 w-4" />}
          label="מודגש"
          isActive={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          icon={<Italic className="h-4 w-4" />}
          label="נטוי"
          isActive={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <ToolbarButton
          icon={<UnderlineIcon className="h-4 w-4" />}
          label="קו תחתון"
          isActive={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        />
        <ToolbarButton
          icon={<Strikethrough className="h-4 w-4" />}
          label="קו חוצה"
          isActive={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        />
        <ToolbarButton
          icon={<Code className="h-4 w-4" />}
          label="קוד מוטבע"
          isActive={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
        />

        <ToolbarDivider />

        {/* Sub/superscript */}
        <ToolbarButton
          icon={<Subscript className="h-4 w-4" />}
          label="כתב תחתי"
          isActive={editor.isActive("subscript")}
          onClick={() => editor.chain().focus().toggleSubscript().run()}
        />
        <ToolbarButton
          icon={<Superscript className="h-4 w-4" />}
          label="כתב עילי"
          isActive={editor.isActive("superscript")}
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
        />

        <ToolbarDivider />

        {/* Colors */}
        <ColorPickerButton
          icon={<Palette className="h-4 w-4" />}
          label="צבע טקסט"
          currentColor={currentColor || "#000000"}
          onChange={(color) => editor.chain().focus().setColor(color).run()}
        />
        <ColorPickerButton
          icon={<Highlighter className="h-4 w-4" />}
          label="הדגשת רקע"
          currentColor={currentHighlight || "#ffff00"}
          onChange={(color) =>
            editor.chain().focus().toggleHighlight({ color }).run()
          }
        />

        <ToolbarButton
          icon={<RemoveFormatting className="h-4 w-4" />}
          label="נקה עיצוב"
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        />
      </div>

      <Separator />

      {/* Row 2: Structure & Insert */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5">
        {/* Alignment */}
        <ToolbarButton
          icon={<AlignRight className="h-4 w-4" />}
          label="ימין"
          isActive={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        />
        <ToolbarButton
          icon={<AlignCenter className="h-4 w-4" />}
          label="מרכז"
          isActive={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        />
        <ToolbarButton
          icon={<AlignLeft className="h-4 w-4" />}
          label="שמאל"
          isActive={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        />

        <ToolbarDivider />

        {/* Lists */}
        <ToolbarButton
          icon={<List className="h-4 w-4" />}
          label="רשימה"
          isActive={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <ToolbarButton
          icon={<ListOrdered className="h-4 w-4" />}
          label="רשימה ממוספרת"
          isActive={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
        <ToolbarButton
          icon={<ListTodo className="h-4 w-4" />}
          label="רשימת משימות"
          isActive={editor.isActive("taskList")}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        />

        <ToolbarDivider />

        {/* Block elements */}
        <ToolbarButton
          icon={<Quote className="h-4 w-4" />}
          label="ציטוט"
          isActive={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        />
        <ToolbarButton
          icon={<Minus className="h-4 w-4" />}
          label="קו מפריד"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        />

        <ToolbarDivider />

        {/* Insert */}
        <ToolbarButton
          icon={<ImagePlus className="h-4 w-4" />}
          label="הוסף תמונה"
          onClick={addImage}
        />
        <ToolbarButton
          icon={<LinkIcon className="h-4 w-4" />}
          label="קישור"
          isActive={editor.isActive("link")}
          onClick={setLink}
        />
        <ToolbarButton
          icon={<TableIcon className="h-4 w-4" />}
          label="הוסף טבלה"
          onClick={insertTable}
        />

        {/* Code block with language picker */}
        <Select
          value=""
          onValueChange={() =>
            editor.chain().focus().toggleCodeBlock().run()
          }
        >
          <SelectTrigger className="w-24 h-8 text-xs gap-1">
            <CodeSquare className="h-3.5 w-3.5 shrink-0" />
            <SelectValue placeholder="קוד" />
          </SelectTrigger>
          <SelectContent>
            {CODE_LANGUAGES.map((lang) => (
              <SelectItem key={lang.value} value={lang.value}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Table operations (shown only when in a table) */}
        {editor.isActive("table") && (
          <>
            <ToolbarDivider />
            <ToolbarButton
              icon={<RowsIcon className="h-4 w-4" />}
              label="הוסף שורה"
              onClick={() => editor.chain().focus().addRowAfter().run()}
            />
            <ToolbarButton
              icon={<Columns3 className="h-4 w-4" />}
              label="הוסף עמודה"
              onClick={() => editor.chain().focus().addColumnAfter().run()}
            />
            <ToolbarButton
              icon={<TableCellsMerge className="h-4 w-4" />}
              label="מזג תאים"
              onClick={() => editor.chain().focus().mergeCells().run()}
            />
            <ToolbarButton
              icon={<TableCellsSplit className="h-4 w-4" />}
              label="פצל תאים"
              onClick={() => editor.chain().focus().splitCell().run()}
            />
            <ToolbarButton
              icon={<Trash2 className="h-4 w-4" />}
              label="מחק טבלה"
              onClick={() => editor.chain().focus().deleteTable().run()}
            />
          </>
        )}
      </div>
    </div>
  );
}
