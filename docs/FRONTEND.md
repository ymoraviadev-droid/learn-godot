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
- Sidebar organized by **parts** (two-level accordion: part → chapter → subchapter headings)
- "סיכום" and "שאלון ידע" appear at the bottom of each chapter's subchapter list with a separator, but only if the corresponding h1 heading exists in the chapter content (not all chapters have them — project chapters like 13–17 don't)
- Clicking a main chapter link scrolls to top after navigation
- Clicking a subchapter smooth-scrolls to the heading anchor

### Parts System (`lib/parts.ts`)

- 12 parts defined with slug, title, Hebrew description, icon (Lucide), and color
- `groupChaptersByPart()` maps flat chapter list into part groups by order range
- `getPartBySlug()`, `getPartNumber()`, `hebrewPartLabel()` helpers
- `hebrewPartLabel()` returns Hebrew part labels like "חלק א׳", "חלק ב׳", etc.
- Parts are display-only grouping — not stored in `meta.json`, derived from chapter order
- Each part has a dedicated page at `/part/:partSlug` (PartPage.tsx)
- Part headers display Hebrew label + dot separator + title (e.g., "חלק א׳ ● צעדים ראשונים")

## App Header

- Logo + title link to landing page
- In dev mode (`VITE_DEV_MODE=true`): shows gallery, עריכה (edit), and קריאה (read) buttons
- In production: no navigation buttons shown
- Active mode button highlighted with orange tint (`bg-orange-500/20 text-orange-400`)
- Edit mode detected by `/edit` route prefix

## Reader Mode

- Uses read-only Tiptap instance with all extensions (including Quiz in reader mode)
- Styled with Tailwind (RTL-aware)
- No editor chrome — clean reading experience
- Chapter navigation sidebar grouped by parts with subchapter deep links
- Responsive for mobile reading
- Previous/next chapter navigation buttons at the bottom of each chapter (first chapter has no previous, last has no next)

## Mobile Navigation

- Hamburger menu opens a dialog with full chapter list grouped by parts
- Two-level accordion: part → chapter → subchapter headings (matching desktop sidebar)
- Clicking a chapter or subchapter navigates and closes the drawer
- Active part and chapter auto-expand on navigation

## Sidebar Behavior

- Two-level accordion: **parts** (top level) → **chapters** → **subchapter headings** (h2)
- Part headers show Hebrew label (חלק א׳) + dot separator + icon (colored) + title + chevron toggle
- Clicking part text navigates to part page + expands accordion; clicking chevron only toggles accordion
- In edit mode, part links include `?mode=edit` query param to preserve edit context
- Navigating to a chapter auto-expands its parent part and the chapter itself
- Navigating to a part page auto-expands that part
- Chapter titles and subchapter headings use `wrap-break-word` (no truncation)
- Uses ref-based state sync (not useEffect) to avoid React Router flushSync conflicts
- Sidebar width: `w-88` (22rem)

### Coming Soon Chapters

- Chapters whose only content (besides the h1 title) is a paragraph starting with "בקרוב" are detected as placeholders via `isComingSoon()` in `lib/content.ts`
- These chapters show "(בקרוב)" label next to the title in sidebar, mobile drawer, and landing page
- Subchapter deep links (headings, סיכום, שאלון ידע) are hidden for coming-soon chapters
- סיכום and שאלון ידע links are only shown when those h1 sections actually exist in the chapter content (checked via `hasH1()` in `lib/headings.ts`)
- Detection is automatic — no manual flagging needed; replacing the placeholder with real content switches to normal display

## Routing

| Route                       | Mode    | Description                               |
|-----------------------------|---------|-------------------------------------------|
| `/`                         | Landing | Landing page with TOC                     |
| `/part/:partSlug`           | Reader  | Part description page                     |
| `/part/:partSlug?mode=edit` | Editor  | Part page with editable title/description |
| `/chapter/:slug`            | Reader  | Read a chapter                            |
| `/edit`                     | Editor  | Chapter list + editor                     |
| `/edit/:slug`               | Editor  | Edit a specific chapter                   |
