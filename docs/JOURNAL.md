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

- [ ] Scaffold Vite + React + TypeScript project
- [ ] Install and configure Tailwind + Shadcn/ui
- [ ] Set up Tiptap with core extensions
- [ ] Build basic editor page with toolbar
- [ ] Create content directory structure
- [ ] Implement save/load from JSON files
- [ ] Build reader mode
