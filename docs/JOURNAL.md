# Journal

Development log — decisions, progress, and notes.

---

## 2026-03-15 — Project Kickoff

### Context

Goal: learn Godot (C#) by writing a Hebrew tutorial book. Build a web-based editor to write it and a reader mode to share it.

### Decisions Made

1. **No backend** — React SPA is sufficient. Express would add complexity with no benefit for a single-author, file-based workflow.

2. **JSON files over MongoDB** — content is a finite set of articles, git versioning is more valuable than a database. Migration to MongoDB is trivial later if needed.

3. **Tiptap for the editor** — richest ProseMirror-based editor for React. Supports RTL, code highlighting, images, tables, and every formatting option needed.

4. **Shadcn/ui for UI** — composable, accessible, pairs well with Tailwind.

5. **RTL-first** — Hebrew is the primary language. Layout, alignment, and navigation default to RTL. Code blocks stay LTR.

### Next Steps

- [x] Scaffold Vite + React + TypeScript project
- [x] Install and configure Tailwind + Shadcn/ui
- [x] Set up Tiptap with core extensions
- [x] Build basic editor page with toolbar
- [x] Create content directory structure
- [x] Implement save/load from JSON files
- [ ] Build reader mode

---

## 2026-03-15 — Editor Features & Theme

### Changes

1. **Code blocks** — custom NodeView with line numbers gutter, language selector header, VS Code-inspired syntax highlighting colors
2. **Image upload** — file picker uploads to `content/images/` via Vite dev server plugin, base64 fallback
3. **Save to disk** — Ctrl+S writes to localStorage AND `content/chapters/godot-tutorial-content.json` via Vite plugin
4. **Godot dark theme** — removed light mode, color palette extracted from Godot 4.x editor (dark charcoal, Godot blue accent)
5. **RTL fixes** — scrollbars on left, sidebar chapter order, code blocks LTR, per-block text direction (RTL/LTR buttons)
6. **Table operations** — contextual row 3 in toolbar with add/delete row/column, merge/split, delete table
7. **Lists** — restored bullet/number markers (Tailwind preflight was stripping them)
8. **Tutorial structure** — 39 chapters across 10 parts in `docs/TUTORIAL.md`, Chapter 1 draft in `docs/chapters/`
