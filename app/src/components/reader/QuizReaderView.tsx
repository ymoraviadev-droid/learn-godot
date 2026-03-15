import { useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { cn } from "@/lib/cn";
import type { QuizQuestion } from "@/components/editor/QuizNode";

export function QuizReaderView({ node }: NodeViewProps) {
  const questions: QuizQuestion[] = node.attrs.questions || [];
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [revealed, setRevealed] = useState(false);

  const allAnswered = Object.keys(selected).length === questions.length;
  const score = revealed
    ? questions.filter((q, i) => selected[i] === q.correct).length
    : 0;

  const handleSelect = (qIndex: number, aIndex: number) => {
    if (revealed) return;
    setSelected((prev) => ({ ...prev, [qIndex]: aIndex }));
  };

  const handleReveal = () => {
    setRevealed(true);
  };

  const handleReset = () => {
    setSelected({});
    setRevealed(false);
  };

  const ANSWER_LABELS = ["א", "ב", "ג", "ד"];

  return (
    <NodeViewWrapper>
      <div className="my-8 space-y-6">
        {questions.map((q, qIndex) => (
          <div key={qIndex} className="space-y-3">
            <p className="font-medium text-base">
              <span className="text-muted-foreground ml-2">{qIndex + 1}.</span>
              {q.question}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {q.answers.map((answer, aIndex) => {
                const isSelected = selected[qIndex] === aIndex;
                const isCorrect = q.correct === aIndex;
                const showCorrect = revealed && isCorrect;
                const showWrong = revealed && isSelected && !isCorrect;

                return (
                  <button
                    key={aIndex}
                    onClick={() => handleSelect(qIndex, aIndex)}
                    disabled={revealed}
                    dir="rtl"
                    className={cn(
                      "flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-sm text-right transition-all",
                      !revealed && !isSelected && "border-border hover:border-primary/50 hover:bg-primary/5",
                      !revealed && isSelected && "border-primary bg-primary/10",
                      showCorrect && "border-green-500 bg-green-500/10",
                      showWrong && "border-red-500 bg-red-500/10",
                      revealed && !isCorrect && !isSelected && "border-border opacity-50"
                    )}
                  >
                    <span
                      className={cn(
                        "h-7 w-7 rounded-full border-2 flex items-center justify-center shrink-0 text-xs font-bold transition-colors",
                        !revealed && !isSelected && "border-muted-foreground/30",
                        !revealed && isSelected && "border-primary bg-primary text-primary-foreground",
                        showCorrect && "border-green-500 bg-green-500 text-white",
                        showWrong && "border-red-500 bg-red-500 text-white",
                        revealed && !isCorrect && !isSelected && "border-muted-foreground/20"
                      )}
                    >
                      {ANSWER_LABELS[aIndex]}
                    </span>
                    <span className="flex-1">{answer}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div className="flex items-center justify-center gap-4 pt-4">
          {!revealed ? (
            <button
              onClick={handleReveal}
              disabled={!allAnswered}
              className={cn(
                "px-8 py-3 rounded-lg font-medium text-sm transition-all",
                allAnswered
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              בדוק תשובות
            </button>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div
                className={cn(
                  "text-lg font-bold px-6 py-3 rounded-lg",
                  score === questions.length
                    ? "bg-green-500/10 text-green-500"
                    : score >= questions.length / 2
                    ? "bg-yellow-500/10 text-yellow-500"
                    : "bg-red-500/10 text-red-500"
                )}
              >
                {score} / {questions.length} תשובות נכונות
              </div>
              <button
                onClick={handleReset}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
              >
                נסה שוב
              </button>
            </div>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );
}
