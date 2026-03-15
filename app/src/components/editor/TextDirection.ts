import { Extension } from "@tiptap/react";

declare module "@tiptap/react" {
  interface Commands<ReturnType> {
    textDirection: {
      setTextDirection: (direction: "rtl" | "ltr") => ReturnType;
    };
  }
}

export const TextDirection = Extension.create({
  name: "textDirection",

  addGlobalAttributes() {
    return [
      {
        types: ["heading", "paragraph", "bulletList", "orderedList", "blockquote"],
        attributes: {
          dir: {
            default: null,
            parseHTML: (element) => element.getAttribute("dir"),
            renderHTML: (attributes) => {
              if (!attributes.dir) return {};
              return { dir: attributes.dir };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setTextDirection:
        (direction) =>
        ({ commands }) => {
          return commands.updateAttributes("paragraph", { dir: direction }) ||
            commands.updateAttributes("heading", { dir: direction });
        },
    };
  },
});
