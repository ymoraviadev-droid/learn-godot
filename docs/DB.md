# Data Storage

## Approach: JSON Files

No database. Content is stored as JSON files in the `/content` directory, versioned with git.

## Why Not a Database

| Concern           | JSON files                        | MongoDB                         |
|-------------------|-----------------------------------|---------------------------------|
| Setup             | Zero                              | Install, configure, host        |
| Versioning        | Git tracks every change           | Need custom versioning          |
| Backup            | Push to remote repo               | Separate backup strategy        |
| Portability       | Copy the folder                   | Export/import                   |
| Sharing (readers) | Static build, free hosting        | Need a running server           |
| Cost              | Free                              | Atlas free tier or self-host    |
| Multi-user        | Not supported (not needed)        | Supported                       |
| Scale             | Dozens of articles — no problem   | Overkill for this scale         |

## Migration Path

If a database is ever needed (multi-user editing, API access, etc.):
- Content is already JSON — MongoDB documents map 1:1
- Write an import script: read JSON files → insert into collection
- Swap the content-loading layer in the app

## File Formats

### Chapter File (`/content/chapters/XX-slug.json`)

```json
{
  "id": "01-intro",
  "title": "מבוא ל-Godot",
  "slug": "intro",
  "order": 1,
  "createdAt": "2026-03-15T00:00:00Z",
  "updatedAt": "2026-03-15T00:00:00Z",
  "tags": ["basics", "setup"],
  "content": { }
}
```

The `content` field holds the Tiptap JSON document — the editor's native format. This is an opaque blob managed entirely by Tiptap.

### Book Metadata (`/content/meta.json`)

```json
{
  "title": "למד Godot עם C#",
  "description": "מדריך בעברית לפיתוח משחקים עם Godot ו-C#",
  "author": "...",
  "language": "he",
  "chapterOrder": ["01-intro", "02-nodes", "03-scenes"]
}
```

### Images (`/content/images/`)

Images are stored as files, referenced by relative path in Tiptap content.

## Content Persistence

### Editor Mode (dev)

Content is saved in two places simultaneously:

1. **localStorage** — primary storage during editing, instant read/write
   - `godot-tutorial-chapters` — Chapter[] array
   - `godot-tutorial-meta` — BookMeta object
2. **Disk** — on every Ctrl+S, the full content is also written to `content/chapters/godot-tutorial-content.json` via the Vite plugin (`POST /api/save-content`)

### Image Upload

Images are uploaded via `POST /api/upload-image` (Vite plugin) and saved to `content/images/`. Filenames are sanitized and deduplicated. Falls back to base64 inline if the API is unavailable.

### Reader Mode (production build)

- At build time: Vite imports all JSON files from `/content`
- Bundled into the static output — no runtime file access needed
- Alternative: fetch from `/content/*.json` served as static assets

### Export/Import

- **Export**: combines all chapters + meta into a single downloadable JSON file
- **Import**: uploads a JSON file and restores to localStorage
