import { Node, mergeAttributes } from "@tiptap/core";

export interface QuizQuestion {
  question: string;
  answers: [string, string, string, string];
  correct: number; // 0-3
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    quiz: {
      insertQuiz: () => ReturnType;
    };
  }
}

export const Quiz = Node.create({
  name: "quiz",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      questions: {
        default: [],
        parseHTML: (element) => {
          const raw = element.getAttribute("data-questions");
          return raw ? JSON.parse(raw) : [];
        },
        renderHTML: (attributes) => ({
          "data-questions": JSON.stringify(attributes.questions),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="quiz"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "quiz" })];
  },

  addCommands() {
    return {
      insertQuiz:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              questions: [
                {
                  question: "",
                  answers: ["", "", "", ""],
                  correct: 0,
                },
              ],
            },
          });
        },
    };
  },
});
