import { Node, mergeAttributes } from "@tiptap/core";

export interface TreeItem {
  name: string;
  type?: string;
  comment?: string;
  children?: TreeItem[];
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    nodeTree: {
      insertNodeTree: () => ReturnType;
    };
  }
}

export const NodeTree = Node.create({
  name: "nodeTree",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      items: {
        default: [],
        parseHTML: (element) => {
          const raw = element.getAttribute("data-items");
          return raw ? JSON.parse(raw) : [];
        },
        renderHTML: (attributes) => ({
          "data-items": JSON.stringify(attributes.items),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="node-tree"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "node-tree" }),
    ];
  },

  addCommands() {
    return {
      insertNodeTree:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              items: [{ name: "Node", children: [] }],
            },
          });
        },
    };
  },
});
