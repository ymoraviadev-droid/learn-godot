# Frontend

## Stack Details

- **Vite** — fast dev server, optimized builds
- **React 18+** with TypeScript (strict mode)
- **Tailwind CSS** — utility-first, RTL support via `rtl:` variant
- **Shadcn/ui** — accessible, composable components (dialog, sidebar, dropdown, etc.)
- **React Router** — client-side routing between editor and reader

## Tiptap Editor

### Why Tiptap

- ProseMirror under the hood — battle-tested, extensible
- First-class React bindings
- RTL support
- Rich extension ecosystem

### Extensions (planned)

| Extension              | Purpose                              |
|------------------------|--------------------------------------|
| StarterKit             | Basic formatting (bold, italic, etc) |
| Heading                | h1–h6                               |
| TextAlign              | Right/center/left alignment          |
| TextStyle + Color      | Font color, background color         |
| FontFamily             | Font selection                       |
| Highlight              | Text highlighting                    |
| Underline              | Underline text                       |
| Subscript / Superscript| Sub/superscript                      |
| BulletList / OrderedList| Lists                               |
| TaskList               | Checkboxes                           |
| Table                  | Tables with merge/split              |
| Image                  | Image embedding                      |
| Link                   | Hyperlinks                           |
| CodeBlockLowlight      | Syntax-highlighted code blocks       |
| Blockquote             | Block quotes                         |
| HorizontalRule         | Dividers                             |
| Typography             | Smart quotes, dashes                 |
| Placeholder            | Empty state placeholder text         |
| CharacterCount         | Word/char count                      |

### Code Block Highlighting

Languages to support:
- **C#** (primary — Godot scripting)
- **GDScript** (for comparison/reference)
- **JSON** (Godot scene/resource files)
- **Shell** (terminal commands)
- **XML** (Godot .tscn/.tres files)

### Toolbar

Full toolbar with grouped controls:
- **Text**: bold, italic, underline, strikethrough, code
- **Headings**: h1–h6 dropdown
- **Alignment**: right (default for RTL), center, left
- **Color**: text color picker, highlight color picker
- **Font**: font family selector
- **Lists**: bullet, ordered, task list
- **Insert**: image, table, code block, horizontal rule, link, blockquote
- **History**: undo, redo

## RTL Considerations

- App root: `dir="rtl"` and `lang="he"`
- Tiptap editor configured with `dir: 'rtl'`
- Default text alignment: right
- Sidebar navigation on the right side
- Code blocks remain LTR (code is always LTR)
- Mixed content support — inline English/LTR within Hebrew paragraphs

## Reader Mode

- Uses Tiptap's `generateHTML()` or read-only Tiptap instance
- Styled with Tailwind prose (RTL-aware)
- No editor chrome — clean reading experience
- Chapter navigation sidebar
- Responsive for mobile reading

## Routing

| Route                | Mode   | Description              |
|----------------------|--------|--------------------------|
| `/`                  | Reader | Homepage / chapter list  |
| `/chapter/:slug`     | Reader | Read a chapter           |
| `/edit`              | Editor | Chapter list + editor    |
| `/edit/:slug`        | Editor | Edit a specific chapter  |
