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

| Extension                                           | Purpose                                     |
|-----------------------------------------------------|---------------------------------------------|
| StarterKit                                          | Basic formatting (bold, italic, etc)        |
| Heading                                             | h1–h6                                       |
| TextAlign                                           | Right/center/left alignment                 |
| TextDirection (custom, name: `customTextDirection`) | Per-block RTL/LTR direction                 |
| TextStyle + Color                                   | Font color, background color                |
| FontFamily                                          | Font selection                              |
| Highlight                                           | Text highlighting (multicolor)              |
| Underline                                           | Underline text                              |
| Subscript / Superscript                             | Sub/superscript                             |
| BulletList / OrderedList                            | Lists                                       |
| TaskList                                            | Checkboxes                                  |
| Table                                               | Tables with merge/split/resize              |
| Image                                               | Upload to content/images/ (base64 fallback) |
| Link                                                | Hyperlinks                                  |
| CodeBlock + Shiki                                   | Syntax HL + custom NodeView + line numbers  |
| Blockquote                                          | Block quotes                                |
| HorizontalRule                                      | Dividers                                    |
| Typography                                          | Smart quotes, dashes                        |
| Placeholder                                         | Empty state placeholder text                |
| CharacterCount                                      | Word/char count                             |
| Quiz (custom)                                       | Multiple-choice quiz with 4 answers         |
| NodeTree (custom)                                   | Structured tree diagrams (mobile-safe)      |

### Code Block Highlighting

Custom `CodeBlockView` React component with:
- Language selector in header bar
- Line numbers gutter (aligned via shared font-size + line-height)
- Copy-to-clipboard button
- Syntax highlighting via **Shiki** (TextMate grammars — same as VS Code)
- Highlighting applied as ProseMirror inline decorations (no overlay, clean selection)
- Dark Plus theme (VS Code default dark)

Supported languages:
- **C#** (primary — Godot scripting)
- **GDScript** (built-in Shiki grammar)
- **JavaScript / TypeScript**
- **JSON** (Godot scene/resource files)
- **Shell** (terminal commands)
- **XML** (Godot .tscn/.tres files)
- **Python, CSS, HTML**
- **Text** (plain, no highlighting — single color)

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
- Insert: image upload, link, table, code block (with language picker), quiz, node tree

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

### Quiz System

Custom `Quiz` Tiptap node (`QuizNode.ts`) with two views:

- **Editor** (`QuizEditorView.tsx`) — form UI to add questions, 4 answer options, mark correct answer
- **Reader** (`QuizReaderView.tsx`) — interactive quiz: select answers, submit all, reveal results with score

Quiz data stored as Tiptap node attributes (array of `{ question, answers[4], correct }` objects).

### Node Tree Diagrams

Custom `NodeTree` Tiptap node (`NodeTreeNode.ts`) for displaying hierarchical structures (scene trees, file trees, component composition). Replaces ASCII tree diagrams that broke on mobile.

- Single view component (`NodeTreeView.tsx`) — edit mode shows inline inputs + hover action buttons, read mode shows styled labels
- Each tree item has: `name` (required), `type` (shown as green badge), `comment` (shown as italic gray text)
- Items are recursive — unlimited nesting depth
- GitHub-dark themed with purple parent icons, dashed indent guides
- Tree data stored as Tiptap node attributes (`items: TreeItem[]`)

### Heading Anchors & Sidebar Navigation

- H2 headings auto-generate `id` attributes from their text (via extended Heading extension)
- H1 headings "סיכום" and "שאלון ידע" also get IDs for deep linking
- Sidebar shows expandable subchapter list (h2 headings) under each chapter
- "סיכום" and "שאלון ידע" always appear at the bottom of each chapter's subchapter list with a separator
- Clicking a main chapter link scrolls to top after navigation
- Clicking a subchapter smooth-scrolls to the heading anchor

## Reader Mode

- Uses read-only Tiptap instance with all extensions (including Quiz in reader mode)
- Styled with Tailwind (RTL-aware)
- No editor chrome — clean reading experience
- Chapter navigation sidebar with subchapter deep links
- Responsive for mobile reading
- Previous/next chapter navigation buttons at the bottom of each chapter (first chapter has no previous, last has no next)

## Mobile Navigation

- Hamburger menu opens a dialog with full chapter list
- Accordion support with subchapter headings (matching desktop sidebar)
- Clicking a chapter or subchapter navigates and closes the drawer
- Active chapter accordion auto-expands, others auto-collapse on navigation

## Sidebar Behavior

- Chapter titles and subchapter headings use `wrap-break-word` (no truncation) to prevent chevron icons from being pushed off-screen
- Navigating to a chapter auto-collapses other accordions and expands the active one
- Uses ref-based state sync (not useEffect) to avoid React Router flushSync conflicts

## Routing

| Route                | Mode   | Description              |
|----------------------|--------|--------------------------|
| `/`                  | Reader | Homepage / chapter list  |
| `/chapter/:slug`     | Reader | Read a chapter           |
| `/edit`              | Editor | Chapter list + editor    |
| `/edit/:slug`        | Editor | Edit a specific chapter  |
