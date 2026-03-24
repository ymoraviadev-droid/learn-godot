import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { useCallback, useState } from "react";
import { Copy, Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CODE_LANGUAGES = [
  { value: "csharp", label: "C#" },
  { value: "gdscript", label: "GDScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "xml", label: "XML / TSCN" },
  { value: "json", label: "JSON" },
  { value: "bash", label: "Shell" },
  { value: "python", label: "Python" },
  { value: "css", label: "CSS" },
  { value: "html", label: "HTML" },
  { value: "text", label: "Text" },
];

export function CodeBlockView({
  node,
  updateAttributes,
  editor,
}: NodeViewProps) {
  const language = node.attrs.language || "";
  const rawText = node.textContent;
  // Count visible lines: strip all trailing newlines, then count
  const trimmed = rawText.replace(/\n+$/, "");
  const lineCount = trimmed ? trimmed.split("\n").length : 1;

  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(node.textContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [node.textContent]);

  return (
    <NodeViewWrapper className="code-block-wrapper" data-language={language}>
      <div className="code-block-header" contentEditable={false}>
        {editor.isEditable ? (
          <Select
            value={language}
            onValueChange={(value) => updateAttributes({ language: value })}
          >
            <SelectTrigger className="w-28 h-6 text-xs border-none bg-transparent p-0 shadow-none">
              <SelectValue placeholder="שפה" />
            </SelectTrigger>
            <SelectContent>
              {CODE_LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span>
            {CODE_LANGUAGES.find((l) => l.value === language)?.label ||
              language ||
              "code"}
          </span>
        )}
        <button
          type="button"
          onClick={handleCopy}
          className="code-copy-btn"
          title="העתק קוד"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
      <div className="code-block-body">
        <div className="line-numbers" contentEditable={false} aria-hidden>
          {Array.from({ length: lineCount }, (_, i) => (
            <span key={i}>{i + 1}</span>
          ))}
        </div>
        <div className="code-content" style={{ overflowX: "auto" }}>
          <pre style={{ whiteSpace: "pre", overflowWrap: "normal", wordBreak: "keep-all", width: "fit-content", minWidth: "100%" }}>
            <NodeViewContent as={"code" as any} />
          </pre>
        </div>
      </div>
    </NodeViewWrapper>
  );
}
