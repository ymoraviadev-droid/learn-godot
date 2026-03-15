# Frontend

## Stack Details

- **Vite** — fast dev server, optimized builds
- **React 19** with TypeScript (strict mode)
- **Tailwind CSS** — utility-first, RTL support via `rtl:` variant
- **Shadcn/ui** — accessible, composable components (dialog, sidebar, dropdown, etc.)
- **React Router** — client-side routing between editor and reader

## Tiptap Editor

### Why Tiptap

- ProseMirror under the hood — battle-tested, extensible
- First-class React bindings
- RTL support
- Rich extension ecosystem

### Extensions

| Extension                | Purpose                                    |
|--------------------------|--------------------------------------------|
| StarterKit               | Basic formatting (bold, italic, etc)       |
| Heading                  | h1–h6                                      |
| TextAlign                | Right/center/left alignment                |
| TextDirection (custom)   | Per-block RTL/LTR direction                |
| TextStyle + Color        | Font color, background color               |
| FontFamily               | Font selection                             |
| Highlight                | Text highlighting (multicolor)             |
| Underline                | Underline text                             |
| Subscript / Superscript  | Sub/superscript                            |
| BulletList / OrderedList | Lists                                      |
| TaskList                 | Checkboxes                                 |
| Table                    | Tables with merge/split/resize             |
| Image                    | Upload to content/images/ (base64 fallback)|
| Link                     | Hyperlinks                                 |
| CodeBlockLowlight        | Syntax HL + custom NodeView + line numbers |
| Blockquote               | Block quotes                               |
| HorizontalRule           | Dividers                                   |
| Typography               | Smart quotes, dashes                       |
| Placeholder              | Empty state placeholder text               |
| CharacterCount           | Word/char count                            |

### Code Block Highlighting

Custom `CodeBlockView` React component with:
- Language selector in header bar
- Line numbers gutter
- Syntax highlighting via lowlight (highlight.js)
- Godot editor-inspired color scheme (matching VS Code dark theme)

Supported languages:
- **C#** (primary — Godot scripting)
- **GDScript** (custom highlight.js grammar in `src/lib/gdscript.ts`)
- **JavaScript / TypeScript**
- **JSON** (Godot scene/resource files)
- **Shell** (terminal commands)
- **XML** (Godot .tscn/.tres files)
- **Python, CSS, HTML**

### Toolbar

Three-row toolbar:

**Row 1 — Text formatting:**
- History: undo, redo
- Font family selector
- Headings: h1, h2, h3
- Formatting: bold, italic, underline, strikethrough, inline code
- Sub/superscript
- Colors: text color picker, highlight color picker
- Clear formatting

**Row 2 — Structure & Insert:**
- Alignment: right, center, left
- Direction: RTL, LTR (per-block)
- Lists: bullet, ordered, task list
- Block elements: blockquote, horizontal rule
- Insert: image upload, link, table, code block (with language picker)

**Row 3 — Table operations (contextual, shown when cursor is in a table):**
- Add row, add column, delete row, delete column
- Merge cells, split cells
- Delete table

## RTL Considerations

- `html` element has `direction: rtl` (scrollbars on left side)
- Tiptap editor configured with `dir: "rtl"`
- Default text alignment: right
- Sidebar navigation on the right side
- Per-block direction override via custom TextDirection extension (RTL/LTR buttons)
- Code blocks always LTR with explicit `direction: ltr`
- Sidebar chapter items use `dir="ltr"` wrapper with `dir="rtl"` link for correct layout

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
