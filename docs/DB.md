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

### Book Metadata (`/content/chapters/meta.json`)

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

No localStorage. Content lives in two layers:

1. **In-memory cache** — on page load, `meta.json` is fetched first, then each chapter file is fetched in parallel by ID from `chapterOrder` (cache-busted with timestamp). Every keystroke updates this cache instantly.
2. **Disk** — the in-memory state is flushed to per-chapter files via the Vite plugin (`POST /api/save-content`):
   - Writes `meta.json` + one `{chapter-id}.json` file per chapter
   - Removes stale chapter files (from deletions)
   - **Auto-save** every 30 seconds (only if there are unsaved changes)
   - **Ctrl+S** or save button for immediate save
   - **On create/delete/import** — saved immediately

### Image Upload

Images are uploaded via `POST /api/upload-image` (Vite plugin) and saved to `content/images/`. Filenames are sanitized and deduplicated. Falls back to base64 inline if the API is unavailable.

### Reader Mode (production build)

- On load, `meta.json` is fetched, then each chapter file in parallel
- `content/` is symlinked into `public/` so chapters, images, and JSON are included in the static build

### Export/Import

- **Export**: combines all chapters + meta into a single downloadable JSON file
- **Import**: uploads a JSON file, loads into memory, and saves to disk (as split per-chapter files)
