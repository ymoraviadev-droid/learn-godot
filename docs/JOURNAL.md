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
3. **Save to disk** — Ctrl+S writes to `content/chapters/godot-tutorial-content.json` via Vite plugin
4. **Godot dark theme** — removed light mode, color palette extracted from Godot 4.x editor (dark charcoal, Godot blue accent)
5. **RTL fixes** — scrollbars on left, sidebar chapter order, code blocks LTR, per-block text direction (RTL/LTR buttons)
6. **Table operations** — contextual row 3 in toolbar with add/delete row/column, merge/split, delete table
7. **Lists** — restored bullet/number markers (Tailwind preflight was stripping them)
8. **Tutorial structure** — 39 chapters across 10 parts in `docs/TUTORIAL.md`, Chapter 1 draft in `docs/chapters/`

---

## 2026-03-16 — Save Rework, Quiz System, Chapter 1 Complete

### Changes

1. **Removed localStorage** — content persistence is now fully in-memory + disk (no localStorage at all)
2. **Runtime fetch** — content loaded via `fetch()` on page load instead of static `import`, with cache-busting to always get fresh data after save
3. **Auto-save** — every 30 seconds if there are unsaved changes (no debounce on keystroke, immediate in-memory update)
4. **Save button fix** — uses DOM refs for status updates to avoid React re-renders that caused scroll-to-top
5. **Vite plugin** — added `GET /content/chapters/*` endpoint to serve chapter JSON with no-cache headers
6. **Quiz system** — custom Tiptap node (`QuizNode.ts`) with editor view (form UI) and reader view (interactive quiz with reveal)
7. **Sidebar subchapters** — h2 headings extracted from content, shown as expandable nested items under each chapter
8. **Heading anchors** — h2 headings auto-generate `id` attributes for deep linking, smooth scroll on click
9. **Sidebar entries** — "סיכום" and "שאלון ידע" always appear with separator at bottom of each chapter's subchapter list
10. **GDScript syntax highlighting** — custom highlight.js grammar registered with lowlight
11. **Mobile table scroll** — horizontal scroll wrapper for tables on small screens

### Chapter 1 — Complete

First chapter (מבוא) written in Hebrew covering:
- What is Godot and why use it
- C# vs GDScript comparison
- Tutorial project overview (3 games + capstone)
- Prerequisites
- Technical terms language policy
- Summary + 5-question quiz

---

## 2026-03-16 — Chapter 2 Complete

### Chapter 2 — הכנת סביבת העבודה (Setting Up Your Environment)

Written in Hebrew covering:
- 2.1 Downloading Godot (.NET version) — portable install for Windows/macOS/Linux, warning against Flatpak/Snap on Linux due to sandboxing issues with IDE integration
- 2.2 Installing .NET SDK — what it is, step-by-step install, verification with `dotnet --version`, version requirements (.NET 8+)
- 2.3 Setting up an IDE — VS Code (with C# Dev Kit + godot-tools extensions) and JetBrains Rider, connecting each to Godot, comparison table
- 2.4 First Godot project — Project Manager, creating project, Version Control/Git explanation, **creating C# Solution** (mandatory step: Project → Tools → C# → Create C# Solution), setting C# as default script language, first build via MSBuild panel, troubleshooting
- 2.5 Godot Editor first look — layout overview (Scene Tree, Viewport, Inspector, Bottom Panel, FileSystem), toolbar, play buttons
- 2.6 Hello World from C# — create scene, set main scene, attach C# script, _Ready() and _Process(), GD.Print(), build & run workflow, experimentation exercises
- Summary + 10-question quiz

### Key Discoveries

- **C# Solution is a mandatory manual step** — new Godot projects do NOT auto-generate `.sln`/`.csproj`. User must go to Project → Tools → C# → Create C# Solution before any C# code can be built.
- **Flatpak Godot breaks IDE integration** — sandboxing prevents Godot from communicating with VS Code/Rider. Portable `.zip` download recommended for Linux.
- **Default script language** — new projects default to GDScript. Must set C# as default via Editor → Editor Settings → Text Editor → Script → Default Script Language.
