# Architecture

## Overview

Single-page React application with two modes: **Editor** (author) and **Reader** (public).
No backend server. Content is stored as JSON files in the repository.

## Stack

| Layer       | Technology                                                   |
|-------------|--------------------------------------------------------------|
| Framework   | React + TypeScript + Vite                                    |
| UI          | Shadcn/ui + Tailwind CSS                                     |
| Editor      | Tiptap (ProseMirror-based)                                   |
| Code blocks | lowlight (highlight.js) + custom NodeView with line numbers  |
| Storage     | In-memory + JSON files in `/content` (saved via Vite plugin) |
| Dev server  | Vite plugin provides image upload & file saving endpoints    |
| Hosting     | Static (Vercel / Netlify / Pages)                            |

## App Modes

### Editor Mode (`/edit`)

- Full Tiptap WYSIWYG editor with all formatting options
- Article management — create, reorder, edit, delete chapters
- Saves Tiptap JSON to `/content/chapters/*.json`
- Image upload to `/content/images/`
- Local-only — runs on `localhost` during authoring

### Reader Mode (`/` and `/chapter/:slug`)

- Renders Tiptap JSON as read-only styled content
- Static build — no editor code shipped to readers
- Chapter navigation sidebar
- RTL layout throughout

## Directory Structure

```
learn-godot/
├── docs/                    # Project documentation
│   └── chapters/            # Chapter drafts (English source material)
├── content/
│   ├── chapters/            # Exported tutorial JSON (godot-tutorial-content.json)
│   └── images/              # Uploaded images (via editor)
├── app/
│   ├── src/
│   │   ├── components/
│   │   │   ├── editor/      # Tiptap editor, toolbar, code block view
│   │   │   ├── layout/      # Header, sidebar, mobile drawer
│   │   │   ├── reader/      # Read-only rendering
│   │   │   └── ui/          # Shadcn components
│   │   ├── pages/
│   │   │   ├── EditorPage.tsx
│   │   │   └── ReaderPage.tsx
│   │   ├── lib/             # Content persistence, utilities
│   │   ├── vite-plugin-content.ts  # Dev server endpoints
│   │   └── App.tsx
│   ├── public/
│   └── package.json
```

## Data Flow

```
Author writes in Tiptap editor
        ↓
Every keystroke updates in-memory state
        ↓
Auto-save every 30s (or Ctrl+S) writes JSON to content/chapters/
        ↓
Image uploads saved to content/images/ via Vite plugin
        ↓
Git commit (content + images versioned)
        ↓
Static build bundles content into reader app
        ↓
Deploy to static host → readers see polished articles
```

## Vite Plugin (`vite-plugin-content.ts`)

The Vite dev server doubles as a lightweight backend during authoring:

- `POST /api/save-content` — writes full tutorial JSON to `content/chapters/godot-tutorial-content.json`
- `POST /api/upload-image` — saves uploaded image to `content/images/`, returns URL
- `GET /content/images/*` — serves uploaded images as static files

## Key Decisions

1. **Vite plugin instead of separate backend** — dev server handles file I/O, no extra process
2. **Tiptap JSON as source of truth** — not Markdown, not HTML
3. **Dark-only Godot-themed UI** — matches Godot editor color palette
4. **RTL-first** — `dir="rtl"` on html, per-block direction override for mixed content
5. **In-memory + disk** — edits update in-memory cache instantly, auto-saved to disk every 30s
