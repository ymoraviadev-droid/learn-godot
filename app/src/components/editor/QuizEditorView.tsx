import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { Plus, Trash2, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import type { QuizQuestion } from "./QuizNode";

export function QuizEditorView({ node, updateAttributes }: NodeViewProps) {
  const questions: QuizQuestion[] = node.attrs.questions || [];

  const updateQuestion = (index: number, updated: Partial<QuizQuestion>) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updated };
    updateAttributes({ questions: newQuestions });
  };

  const updateAnswer = (qIndex: number, aIndex: number, value: string) => {
    const newQuestions = [...questions];
    const answers = [...newQuestions[qIndex].answers] as [string, string, string, string];
    answers[aIndex] = value;
    newQuestions[qIndex] = { ...newQuestions[qIndex], answers };
    updateAttributes({ questions: newQuestions });
  };

  const addQuestion = () => {
    updateAttributes({
      questions: [
        ...questions,
        { question: "", answers: ["", "", "", ""], correct: 0 },
      ],
    });
  };

  const removeQuestion = (index: number) => {
    updateAttributes({
      questions: questions.filter((_, i) => i !== index),
    });
  };

  const ANSWER_LABELS = ["א", "ב", "ג", "ד"];

  return (
    <NodeViewWrapper>
      <div className="border-2 border-dashed border-primary/30 rounded-lg p-4 my-4 space-y-6 bg-primary/5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-primary">שאלון — {questions.length} שאלות</span>
          <button
            onClick={addQuestion}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            הוסף שאלה
          </button>
        </div>

        {questions.map((q, qIndex) => (
          <div key={qIndex} className="space-y-3 border border-border rounded-md p-3 bg-card">
            <div className="flex items-start gap-2">
              <span className="text-xs font-bold text-muted-foreground mt-2 shrink-0">
                {qIndex + 1}.
              </span>
              <input
                type="text"
                value={q.question}
                onChange={(e) => updateQuestion(qIndex, { question: e.target.value })}
                placeholder="כתוב את השאלה כאן..."
                className="flex-1 bg-transparent border-b border-border px-1 py-1 text-sm focus:outline-none focus:border-primary"
                dir="rtl"
              />
              <button
                onClick={() => removeQuestion(qIndex)}
                className="p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pr-5">
              {q.answers.map((answer, aIndex) => (
                <div
                  key={aIndex}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-2 py-1.5 transition-colors",
                    q.correct === aIndex
                      ? "border-green-500/50 bg-green-500/10"
                      : "border-border"
                  )}
                >
                  <button
                    onClick={() => updateQuestion(qIndex, { correct: aIndex })}
                    className={cn(
                      "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                      q.correct === aIndex
                        ? "border-green-500 bg-green-500 text-white"
                        : "border-muted-foreground/40 hover:border-primary"
                    )}
                  >
                    {q.correct === aIndex && <Check className="h-3 w-3" />}
                  </button>
                  <span className="text-xs font-medium text-muted-foreground shrink-0">
                    {ANSWER_LABELS[aIndex]}.
                  </span>
                  <input
                    type="text"
                    value={answer}
                    onChange={(e) => updateAnswer(qIndex, aIndex, e.target.value)}
                    placeholder={`תשובה ${ANSWER_LABELS[aIndex]}`}
                    className="flex-1 bg-transparent text-sm focus:outline-none min-w-0"
                    dir="rtl"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </NodeViewWrapper>
  );
}
