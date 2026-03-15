# Architecture

## Overview

Single-page React application with two modes: **Editor** (author) and **Reader** (public).
No backend server. Content is stored as JSON files in the repository.

## Stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Framework   | React + TypeScript + Vite         |
| UI          | Shadcn/ui + Tailwind CSS          |
| Editor      | Tiptap (ProseMirror-based)        |
| Code blocks | Shiki or lowlight (syntax HL)     |
| Storage     | JSON files in `/content`          |
| Hosting     | Static (Vercel / Netlify / Pages) |

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

## Directory Structure (planned)

```
learn-godot/
├── docs/                    # Project documentation
├── content/
│   ├── chapters/            # Article JSON files
│   │   ├── 01-intro.json
│   │   ├── 02-nodes.json
│   │   └── ...
│   ├── images/              # Uploaded images
│   └── meta.json            # Book metadata (title, chapter order)
├── src/
│   ├── components/
│   │   ├── editor/          # Tiptap editor components
│   │   ├── reader/          # Read-only rendering
│   │   └── ui/              # Shadcn components
│   ├── pages/
│   │   ├── EditorPage.tsx
│   │   └── ReaderPage.tsx
│   ├── lib/                 # Utilities, content loading
│   └── App.tsx
├── public/
└── package.json
```

## Data Flow

```
Author writes in Tiptap
        ↓
Tiptap JSON saved to /content/chapters/XX-slug.json
        ↓
Git commit (content is versioned)
        ↓
Static build bundles content into reader app
        ↓
Deploy to static host → readers see polished articles
```

## Key Decisions

1. **No backend** — content is files, not database records
2. **Tiptap JSON as source of truth** — not Markdown, not HTML
3. **RTL-first** — Tailwind `dir="rtl"`, Tiptap configured for RTL
4. **Editor code-split** — reader bundle excludes editor dependencies
