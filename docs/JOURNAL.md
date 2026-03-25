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
8. **Tutorial structure** — 52 chapters across 12 parts in `docs/TUTORIAL.md`, Chapter 1 draft in `docs/chapters/`

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

---

## 2026-03-17 — Chapter 3 Complete, Sidebar & Navigation Fixes

### Chapter 3 — עורך Godot (The Godot Editor)

Written in Hebrew covering:

- 3.1 Main panels — Scene, Inspector, FileSystem, Output + bottom dock tabs (Debugger, Audio, Animation, Shader Editor, MSBuild)
- 3.2 2D & 3D viewports — navigation controls, mode buttons (Q/W/E/S), grid snapping, Y-axis direction, fly mode for 3D, Script tab, AssetLib tab
- 3.3 Scene tree & node hierarchy — parent-child relationships (transform inheritance, processing order, lifetime management, visibility), tree manipulation in editor, root node types, node naming conventions
- 3.4 Creating & saving scenes — three creation methods, .tscn vs .scn formats, scene tabs, instancing scenes (composition pattern), property overrides on instances
- 3.5 Project settings overview — General tab (Application, Display/Window, Input Map, Physics/2D, Rendering/Textures), Editor Settings vs Project Settings distinction
- 3.6 Keyboard shortcuts & workflow tips — full shortcut tables, Ctrl+P quick open, F1 search help, 7 workflow tips (context menus, drag-and-drop, Inspector search, undo, F6, pinning, Remote tab)
- Summary + 10-question quiz

### App Fixes

1. **Sidebar text wrapping** — replaced `truncate` with `wrap-break-word` on chapter titles and subchapter headings to prevent chevron icons from vanishing when text is long
2. **Mobile drawer accordions** — MobileChapterDrawer now shows subchapter headings with expand/collapse chevrons, matching desktop sidebar functionality
3. **Accordion auto-collapse** — navigating to a chapter now collapses all other accordions and expands only the active chapter's accordion (ref-based state sync to avoid flushSync warnings)
4. **Previous/next chapter navigation** — reader mode now shows prev/next chapter buttons with labels at the bottom of each chapter (first chapter has no previous, last has no next)
5. **Dialog accessibility** — DialogTitle and DialogDescription now use Radix primitives instead of plain HTML elements; added `aria-describedby={undefined}` to dialogs without descriptions
6. **Tiptap flushSync fix** — added `immediatelyRender: false` to useEditor to prevent flushSync warnings during navigation
7. **Duplicate extension fix** — disabled StarterKit's bundled `link` and `underline` (we configure them explicitly); renamed custom `textDirection` to `customTextDirection` to avoid clash with @tiptap/core's built-in extension

---

## 2026-03-19 — Per-Chapter JSON Split, Sidebar Scroll Fix

### Changes

1. **Per-chapter JSON files** — replaced single monolithic `godot-tutorial-content.json` (~1.1MB) with individual `{chapter-id}.json` files + `meta.json`. Better git diffs (editing one chapter doesn't touch others), smaller files. Loading fetches `meta.json` first, then all chapters in parallel by ID. Saving writes each chapter as a separate file and cleans up stale files (from deletions). Backward-compatible: falls back to old single-file format if `meta.json` doesn't exist.
2. **Sidebar scroll-to-top** — clicking a main chapter link in the sidebar (desktop and mobile) now scrolls to top after navigation. Subchapter links still smooth-scroll to their heading anchors.
3. **Shiki syntax highlighting** — replaced lowlight/highlight.js with Shiki (TextMate grammars, same engine as VS Code). Highlighting applied via ProseMirror inline decorations — no overlay layer, clean text selection. Uses `dark-plus` theme. Removed custom `csharp-enhanced.ts` grammar (Shiki's built-in C# grammar is far superior). GDScript also uses Shiki's built-in grammar.
4. **Copy-to-clipboard button** — code blocks now have a copy button in the header bar.
5. **Text language** — added "Text" option to code block language selector for plain textual content (no syntax highlighting).
6. **Code block line alignment** — line numbers and code content now share identical `font-size`, `font-family`, and `line-height` to stay perfectly aligned. Trailing empty lines hidden via CSS (`.ProseMirror-trailingBreak`).

---

## 2026-03-19 — Node Tree Diagrams, Chapter 5

### Node Tree Custom Tiptap Node

ASCII tree diagrams (using `├──`, `└──`, `│`) were breaking on mobile — monospace characters wrap unpredictably on narrow screens. Replaced with a custom `NodeTree` Tiptap node that renders structured HTML.

1. **NodeTreeNode.ts** — Tiptap `Node.create()` with `items` attribute storing recursive `TreeItem[]` (`name`, optional `type`, optional `comment`, optional `children`)
2. **NodeTreeView.tsx** — single React component for both edit and read modes. Edit mode: inline inputs for name/type/comment with hover action buttons (add child, add sibling, delete). Read mode: styled labels with icons
3. **Design** — GitHub-dark theme (`#161b22`), header bar with FolderTree icon, purple ChevronDown for parent nodes, gray Box for leaves, green type badges, italic gray comments, dashed indent guides, hover row highlight
4. **Toolbar** — GitBranch icon button added to editor toolbar row 2
5. **Content migration** — wrote a Node.js script to parse all 8 ASCII tree diagrams across chapters 02–05 JSON files into structured `nodeTree` nodes. Parser handles `#` comments (file trees), ` — ` comments (node trees), multi-space parenthetical comments, and single-space `(Type)` annotations
6. **Mobile-safe** — HTML reflows naturally at any width, no monospace dependency

### Chapter 5 — C# in Godot: The Basics

Written in English (docs/chapters/) covering:
- 5.1 How C# integrates with Godot — .NET runtime, partial classes, binding layer, one-script-per-node
- 5.2 First script — creating/attaching scripts, spinning sprite example, build step
- 5.3 Lifecycle methods — `_Ready()`, `_Process()`, `_PhysicsProcess()`, comparison table, delta time
- 5.4 Accessing node properties — Position, Rotation, Modulate, methods on nodes
- 5.5 `GetNode<T>()` and `[Export]` — node paths, caching, export hints, enums, PackedScene pattern
- 5.6 Logging and debugging — GD.Print, Remote Inspector, breakpoints, visual debugging
- 5.7 C# vs GDScript — syntax comparison, naming conventions, API differences, translation checklist

### Bug Fix

- **ShikiPlugin.ts** — removed unused `ColoredToken` type import that was causing a TS6133 build error

---

## 2026-03-21 — Chapter 6 Complete, Chapter 7 Written

### Chapter 6 — Signals & Communication (Hebrew Translation Complete)

Hebrew translation completed and published as `06-signals-ותקשורת.json`. Covers:
- 6.1 What are signals — Observer pattern, built-in signals, core concept
- 6.2 Connecting signals in the editor — step-by-step with C#-specific note (editor doesn't auto-create methods for C#)
- 6.3 Connecting signals from C# code — `+=`/`-=` syntax, lambdas, Timer spawner example
- 6.4 Custom signals with `[Signal]` — delegate naming, EmitSignal, collectible coin example
- 6.5 Signal parameters and delegates — passing data with signals, supported types
- 6.6 When to use signals vs direct references — direction-based rule of thumb, anti-patterns
- 6.7 The Observer pattern in game design — architecture, autoloads preview, common patterns
- Summary + 10-question quiz

### Fixes

- **Signals tab** — corrected all references from "Node tab" to "Signals tab" throughout chapter 6 (8 occurrences)

### Chapter 7 — Input Handling (English Draft)

Written in English (docs/chapters/) covering:
- 7.1 The Input Map — defining actions, why not raw key codes, dead zones, built-in `ui_` actions
- 7.2 Polling input — `IsActionPressed()`, `IsActionJustPressed()`, `IsActionJustReleased()`, `GetAxis()`, `GetVector()`, normalization explanation
- 7.3 Event-driven input — `_Input()` vs `_UnhandledInput()`, input processing order, consuming input
- 7.4 Keyboard, mouse, and gamepad — `InputEventKey`, `InputEventMouseButton`, `InputEventMouseMotion`, `InputEventJoypadButton`, input type detection
- 7.5 Input actions vs raw key codes — when to use each, action naming conventions
- 7.6 Practical example — complete top-down player controller with movement, sprint, interaction area, interactable chest (ties back to signals from chapter 6)

---

## 2026-03-25 — Chapter 10 Complete

### Chapter 10 — Collisions & Physics Shapes (English Draft + Hebrew Translation)

Written in English (docs/chapters/) and Hebrew translation in progress. Covers:

- 10.1 CollisionShape2D and Collision Polygons — shape types (Rectangle, Capsule, Circle, WorldBoundary, Segment, SeparationRay), CollisionPolygon2D, concave vs convex, disabling shapes at runtime, one-way collision
- 10.2 Collision Layers and Masks — layer/mask concept, Inspector setup, naming layers, code API (SetCollisionLayerValue/SetCollisionMaskValue), practical layer configuration, runtime layer changes
- 10.3 Detecting Collisions in Code — GetSlideCollision() after MoveAndSlide(), KinematicCollision2D properties, MoveAndCollide() for manual control (bounce/stop/slide), RigidBody2D contact signals, TestMove() for look-ahead
- 10.4 Area2D Overlap Detection — signal-based vs polling, GetOverlappingBodies()/GetOverlappingAreas(), hitbox/hurtbox pattern with layer setup, overlap timing gotcha (first frame empty)
- 10.5 Raycasting in 2D — RayCast2D node (floor/wall detection, patrol enemy example), PhysicsDirectSpaceState2D for one-off queries (line of sight), excluding bodies, shape casting with CastMotion()
- 10.6 One-Way Platforms and Slopes — one-way platform setup, drop-through (two approaches: nudge vs collision layer toggle), slope handling (FloorMaxAngle, FloorSnapLength, StopOnSlope), slope speed adjustment, stairs (two approaches: slope over stairs vs SeparationRayShape2D)
- Summary + 8-question quiz
- SVG diagrams: `raycast_vs_shapecast.svg`, `floor_snap_comparison.svg`, `stairs_two_approaches.svg`

---

## 2026-03-25 — Chapter 9 Complete, Landing Page, Code Block Fix

### Chapter 9 — Movement & Physics 2D (English Draft + Hebrew Translation)

Written in English (docs/chapters/) and Hebrew translation completed. Covers:

- 9.1 Moving a node with code — Position vs Velocity, delta time, global vs local position
- 9.2 CharacterBody2D — the player controller, Motion Mode (Grounded vs Floating), floor/wall/ceiling settings
- 9.3 MoveAndSlide() — collision-aware movement, sliding mechanics, collision queries, platformer controller
- 9.4 RigidBody2D — physics-driven objects, forces vs impulses, PhysicsMaterial, contact monitoring
- 9.5 StaticBody2D — walls/floors, AnimatableBody2D for moving platforms, conveyor belts
- 9.6 Area2D — triggers and detection zones, signals, overlap queries, damage zone pattern
- 9.7 Gravity, friction, and bounce — project gravity, fall multiplier, variable jump height, acceleration/friction via MoveToward, complete platformer script
- Summary + 10-question quiz
- Chapter overview SVG diagram (`chapter9_physics_overview.svg`)

### Landing Page

New `LandingPage.tsx` at `/` route:

- Hero section with logo (`/images/logo.png`), title, call-to-action button
- Full table of contents organized by all 12 parts with icons and chapter lists
- Part titles link to dedicated part pages, chapter titles link to reader pages
- SEO: Open Graph meta tags, Twitter cards, structured description
- Professional tone, not commercial

### App Changes

1. **Routing update** — `/` now shows LandingPage instead of redirecting to first chapter. Reader is at `/chapter/:slug`
2. **Logo as favicon** — replaced `favicon.svg` with `logo.png` in index.html, added `apple-touch-icon`
3. **Twitter image meta** — added `twitter:image` tag pointing to logo
4. **Code block horizontal scroll** — fixed ProseMirror's `white-space: pre-wrap` override on code blocks. ProseMirror's stylesheet forces `pre-wrap` on `.ProseMirror` and `.ProseMirror pre`, which was preventing horizontal scrolling. Fixed with `!important` overrides on `.code-block-wrapper` selectors and inline styles on CodeBlockView component
5. **Content width** — increased reader article max-width from `max-w-3xl` to `lg:max-w-4xl` on desktop

---

## 2026-03-26 — Parts System, 3D Expansion, Sidebar Overhaul

### Parts System

Introduced a proper "parts" concept to the app. Previously parts were hardcoded display-only elements in the landing page. Now:

1. **`lib/parts.ts`** — shared parts definition with slug, title, Hebrew description, icon, color, and chapter list. `groupChaptersByPart()` maps flat chapter list into part groups by order range. Used by sidebar, mobile drawer, landing page, and part pages.
2. **`PartPage.tsx`** — dedicated page per part (`/part/:partSlug`) with description, chapter list as clickable cards, prev/next part navigation, and "Start reading" CTA.
3. **Route** — added `/part/:partSlug` to `App.tsx`.

### Sidebar Overhaul

Replaced flat chapter list with two-level accordion: **parts** → **chapters** → **subchapter headings (h2)**.

1. **Part headers** — icon (colored) + title + chevron toggle. In reader mode, clicking text navigates to part page + expands accordion; clicking chevron only toggles. In editor mode, parts are accordion-only (no navigation).
2. **Auto-expand** — navigating to a chapter auto-expands its parent part. Navigating to a part page auto-expands that part.
3. **Mobile drawer** — same two-level accordion structure.

### Tutorial Restructured — 12 Parts, 52 Chapters

Expanded from 10 parts / 39 chapters to 12 parts / 52 chapters:

- **Part 8 (Capstone)** — now explicitly 2D-focused, moved before advanced topics
- **Part 9 (Advanced Topics)** — networking, performance, testing, export (unchanged)
- **Part 10 (3D Fundamentals)** — 5 chapters: intro, materials/lighting, physics, camera/nav/raycast, animation. Covers Node3D, MeshInstance3D, Camera3D, CharacterBody3D, RigidBody3D, NavigationAgent3D, Skeleton3D, GPUParticles3D
- **Part 11 (3D Worlds & Systems)** — 6 chapters: CSG prototyping, GridMap, procedural meshes (SurfaceTool/ArrayMesh/MeshDataTool), 3D visual effects (Decals/SDFGI/VoxelGI), advanced physics (joints/VehicleBody3D/SoftBody3D), 3D performance (MultiMeshInstance3D/LOD/occlusion)
- **Part 12 (FPS Explorer Project)** — 5 chapters: planning, FPS controller, world building, interaction/enemies, polish/publish

All 28 new placeholder chapter files created with "בקרוב.." content.

### Landing Page Updates

- Part titles link to `/part/:partSlug`
- Chapter titles link to `/chapter/:slug` (dimmed if not yet written)
- Updated counts: "12 חלקים, 52 פרקים, ו-4 פרויקטים מעשיים"
