# Chapter 13: Planning the Platformer

---

## 13.1 Game Design Document (Scope)

You've learned nodes, scenes, scripts, signals, input, sprites, physics, collisions, tilemaps, cameras, and viewports. That's every building block for a 2D game. Now we use them.

Over the next five chapters (13–17), we'll build a complete 2D platformer from scratch — a real, playable game with a player character, multiple levels, enemies, collectibles, a health system, menus, sound, and polish. This chapter is about planning before coding.

### Why Plan?

Beginner game developers often open the engine and start building immediately. This works for small experiments, but for anything with multiple systems (player, enemies, levels, UI, audio), lack of planning leads to:

- **Scope creep** — "Let me just add one more feature" until the project is abandoned.
- **Tangled architecture** — systems that depend on each other in ways that make changes painful.
- **Wasted art** — creating assets you end up not using, or assets that don't fit together visually.
- **Motivation death** — the project feels 20% done forever because there's no finish line.

A simple design document fixes all of this. It doesn't need to be formal — a single page is enough. The goal is to answer: *what are we building, and when is it done?*

### Our Game: Crystal Caverns

Here's the design document for our platformer:

**Title:** Crystal Caverns

**Genre:** 2D platformer

**Concept:** A small character explores underground caverns, collecting crystals and avoiding hazards to reach the exit of each level. Simple, classic, fun.

**Core Mechanics:**

| Mechanic | Description |
| --- | --- |
| Movement | Run left/right, jump, wall jump |
| Collectibles | Crystals scattered through each level. Collect them for score |
| Hazards | Spikes (instant death), moving platforms, falling platforms |
| Enemies | Patrol enemies (walk left-right), can be defeated by stomping |
| Health | 3 hit points. Contact with enemies deals 1 damage. Spikes are instant death |
| Checkpoints | Flags that save your respawn position within a level |
| Level progression | Complete a level by reaching the exit door. 3 levels total |

**Not In Scope:**

This list is as important as the feature list. These are things we explicitly will *not* build:

- No inventory system
- No dialogue or NPCs
- No skill tree or upgrades
- No online multiplayer
- No procedural level generation
- No cutscenes
- No save/load (game is short enough to complete in one session)

Every feature you say "no" to is time saved. We can always add features later — but a finished game with 3 levels is worth more than an unfinished game with 30 planned features.

### Defining "Done"

A project without a definition of "done" is never finished. Here's ours:

The game is done when:

1. The player can move, jump, and wall jump
2. 3 levels are playable from start to exit
3. Crystals can be collected and a score is displayed
4. At least one enemy type patrols and can be stomped
5. Spikes and hazards kill or damage the player
6. Checkpoints save respawn position
7. Health system with 3 HP and visual feedback
8. Main menu with Play button
9. Pause menu with Resume and Quit
10. Game over screen with Restart option
11. At least 3 sound effects (jump, collect, damage)
12. Background music on at least one level

That's it. When all 12 items are checked, the game is complete. This list is our compass — every coding session should move us toward checking one of these boxes.

### Scope Estimation

For a beginner working through a tutorial, each chapter maps roughly to a work session:

| Chapter | Focus | Systems Built |
| --- | --- | --- |
| 13 (this chapter) | Planning & setup | Project structure, assets, base scene |
| 14 | Player character | Movement, jump, wall jump, animations |
| 15 | Level design | TileMap levels, hazards, collectibles, checkpoints, transitions |
| 16 | Enemies & AI | Patrol enemy, stomp mechanic, spawners, boss fight |
| 17 | Polish | Health/HUD, menus, sound, transitions, game feel |

Five focused chapters. No sprawl.

---

## 13.2 Project Structure and Folder Conventions

Good folder structure prevents chaos. When your project has 200+ files, knowing exactly where everything lives makes the difference between "I'll fix that in 5 minutes" and "where the hell is that script?"

### The Structure

```
res://
├── scenes/
│   ├── player/
│   │   ├── player.tscn
│   │   └── player.cs
│   ├── enemies/
│   │   ├── patrol_enemy.tscn
│   │   └── patrol_enemy.cs
│   ├── levels/
│   │   ├── level_01.tscn
│   │   ├── level_02.tscn
│   │   └── level_03.tscn
│   ├── objects/
│   │   ├── crystal.tscn
│   │   ├── checkpoint.tscn
│   │   ├── spike.tscn
│   │   ├── moving_platform.tscn
│   │   └── exit_door.tscn
│   └── ui/
│       ├── hud.tscn
│       ├── main_menu.tscn
│       ├── pause_menu.tscn
│       └── game_over.tscn
├── scripts/
│   ├── autoloads/
│   │   ├── GameManager.cs
│   │   └── AudioManager.cs
│   └── components/
│       ├── Hitbox.cs
│       └── Hurtbox.cs
├── art/
│   ├── tileset/
│   │   ├── cavern_tiles.png
│   │   └── cavern_tileset.tres
│   ├── player/
│   │   └── player_spritesheet.png
│   ├── enemies/
│   │   └── slime_spritesheet.png
│   ├── objects/
│   │   ├── crystal.png
│   │   ├── checkpoint_flag.png
│   │   └── exit_door.png
│   ├── ui/
│   │   ├── heart_full.png
│   │   ├── heart_empty.png
│   │   └── crystal_icon.png
│   └── backgrounds/
│       ├── cavern_bg_far.png
│       ├── cavern_bg_mid.png
│       └── cavern_bg_near.png
├── audio/
│   ├── sfx/
│   │   ├── jump.wav
│   │   ├── crystal_collect.wav
│   │   ├── player_hurt.wav
│   │   ├── enemy_stomp.wav
│   │   └── checkpoint.wav
│   └── music/
│       └── cavern_theme.ogg
└── fonts/
    └── game_font.tres
```

### Naming Conventions

Consistency matters more than the specific convention. Here's what we'll use:

| Type | Convention | Example |
| --- | --- | --- |
| Folders | `snake_case` | `scenes/`, `patrol_enemy/` |
| Scene files (.tscn) | `snake_case` | `player.tscn`, `level_01.tscn` |
| Script files (.cs) | `PascalCase` | `GameManager.cs`, `PatrolEnemy.cs` |
| Art assets | `snake_case` | `player_spritesheet.png`, `heart_full.png` |
| Audio files | `snake_case` | `crystal_collect.wav`, `cavern_theme.ogg` |
| Resources (.tres) | `snake_case` | `cavern_tileset.tres` |

**Why PascalCase for scripts?** C# convention. The class name matches the file name, and C# classes use PascalCase. Godot auto-generates the class name from the file name — `GameManager.cs` creates `class GameManager`. Keeping file and class names aligned prevents confusion.

**Why snake_case for everything else?** Godot convention. The engine, documentation, and community use snake_case for assets and scenes. Matching this makes your project feel native.

### Folder Rules

1. **Scenes and their scripts live together.** `player.tscn` and `player.cs` in the same folder. Don't separate scenes into one tree and scripts into another — you'll constantly cross-reference.

2. **Group by feature, not by type.** All player-related files (scene, script, sprites) could live in `scenes/player/`. All enemy files in `scenes/enemies/`. This is better than having all `.cs` files in one folder and all `.tscn` in another.

3. **Autoloads get their own folder.** Singletons (GameManager, AudioManager) are global — they don't belong to any scene. Put them in `scripts/autoloads/`.

4. **Art matches scene structure.** If you have `scenes/enemies/`, have `art/enemies/`. Parallel structure makes assets easy to find.

5. **Don't nest too deep.** Two or three levels is fine. `scenes/enemies/slime/variants/fire/special/` is too much. Flat is better than nested for small projects.

### .import Files

When you add an image or audio file to your project, Godot creates a `.import` file next to it (e.g., `player_spritesheet.png.import`). These files store import settings — compression mode, filter settings, etc.

Don't manually edit `.import` files. Change import settings through the Godot Inspector (select the asset, look at the Import dock at the top of the Inspector panel).

---

## 13.3 Gathering Free Assets

You're learning game development, not pixel art. Using free, pre-made assets lets you focus on code and design without getting stuck on drawing a character sprite for three days.

### Recommended Asset Packs

These are high-quality, free, and commercially usable:

**Kenney.nl** — The single best source of free game assets. Everything is CC0 (public domain — use for anything, no attribution required).

| Pack | What It Contains | URL |
| --- | --- | --- |
| Pixel Platformer | 18×18 tiles, 24×24 characters (1 idle + 1 jump), items, backgrounds | kenney.nl/assets/pixel-platformer |
| Platformer Art Deluxe | Player sprites with walk cycle (11 frames), idle, jump, hurt | kenney.nl/assets/platformer-art-deluxe |
| Pixel Platformer Industrial | Industrial-themed tiles, hazards, pipes, gears | kenney.nl/assets/pixel-platformer-industrial-expansion |
| UI Pack (Pixel) | Buttons, panels, hearts, icons — pixel style | kenney.nl/assets/ui-pack-pixel-adventure |

The **Pixel Platformer** pack has everything you need for tiles, items, enemies, and level art. For the player character, you have two options: the base pack includes a character with 1 idle + 1 jump frame (enough to get started), or the **Platformer Art Deluxe** pack has a character with a full walk cycle (11 frames), idle, jump, and hurt sprites. Both are CC0.

| | |
| --- | --- |
| Tile size (Pixel Platformer) | 18 × 18 |
| License | Creative Commons CC0 |

**itch.io Asset Packs** — The itch.io marketplace has thousands of free packs. Search for "free pixel platformer tileset" or browse the "Free" tag under "Game assets":

- Look for packs labeled **CC0**, **CC-BY**, or **MIT** for maximum flexibility.
- **CC-BY** means you must credit the artist (add a line in your game's credits screen).
- **Read the license** before using any asset commercially.

**OpenGameArt.org** — A library of free game art, organized by style, license, and type. Quality varies widely — filter by license and sort by popularity.

### What We Need

Based on our design document:

| Category | Assets Needed |
| --- | --- |
| Player | Idle (1 frame), walk (11 frames), jump (1 frame), hurt (1 frame) — from Platformer Art Deluxe |
| Terrain | Ground tiles, wall tiles, platform tiles, slope tiles — enough variety to build cave levels |
| Background | 2–3 parallax layers (distant cave walls, mid-ground rocks, near stalactites) |
| Enemies | Patrol enemy with walk animation, stomp/defeat animation (available for some enemies in the base pack) |
| Objects | Crystal (animated, 4–6 frames), checkpoint flag (2 states: inactive/active), exit door, spikes |
| UI | Heart icons (full/empty), crystal counter icon, button sprites for menus |
| Audio SFX | Jump, land, collect crystal, take damage, enemy stomp, checkpoint activate |
| Music | One looping background track per level (or one shared track) |

### Audio Sources

**Freesound.org** — Huge library of user-uploaded sounds. Quality and licensing vary — check each sound's license. Many are CC0. Search for "platformer jump", "coin collect", "retro damage".

**Kenney.nl** also has audio packs — consistent quality, CC0 license:

- *Interface Sounds* — UI clicks, confirms, cancels
- *Impact Sounds* — hits, explosions, thuds
- *Digital Audio* — retro-style bleeps and bloops

**For music:** Search itch.io for "free chiptune music" or "free game music loop". Many indie musicians release free packs for game jams.

### Organizing Downloaded Assets

Don't dump everything into one folder. When you download an asset pack:

1. Extract it to a temporary folder outside your project.
2. Pick only the files you need — most packs contain far more than you'll use.
3. Copy selected files into the appropriate `art/` or `audio/` subfolder in your project.
4. Rename files to match your naming convention if needed.

For example, after downloading a pack:

```text
Tilemap/tilemap.png        → copy to art/tileset/cavern_tiles.png
Characters/character.png   → copy to art/player/
Items/item_gem.png         → copy to art/objects/crystal.png
```

Only import what you'll use. Extra files inflate your export size and clutter the FileSystem panel.

### Tile Size Decision

Before importing tile assets, decide on your tile size. This affects everything — sprite scale, physics shapes, level dimensions, camera zoom.

Common choices:

| Tile Size | Feel | Good For |
| --- | --- | --- |
| 8×8 | Ultra retro, tiny detail | NES-style, minimalist games |
| 16×16 | Classic pixel art, most common | SNES-style platformers, general purpose |
| 18×18 | Kenney's default, slight extra room | Using Kenney asset packs |
| 32×32 | Larger, more room for detail | HD pixel art, mobile games |

We'll use **18×18** if using Kenney's Pixel Platformer pack (that's how the tiles are authored), or **16×16** for any other tileset. Set this in the TileSet resource and stick with it — don't mix tile sizes.

---

## 13.4 Setting Up the Project

Let's create the Godot project and configure it for our platformer.

### Step 1: Create the Project

Open Godot and create a new project:

1. Click **New Project** in the Project Manager.
2. Name: `CrystalCaverns`
3. Choose a location on disk.
4. Renderer: **Forward+** (default, fine for 2D).
5. Click **Create & Edit**.

Then immediately:

1. **Project → Tools → C# → Create C# Solution** — generates the `.sln` and `.csproj` files. Without this, no C# scripts will compile. (We covered this in Chapter 2.)
2. **Editor → Editor Settings → Text Editor → Script → Default Script Language → C#** — so new scripts default to C# instead of GDScript.

### Step 2: Create the Folder Structure

In the FileSystem panel (bottom-left), right-click `res://` and create the folder tree from section 13.2:

```
res://
├── scenes/
│   ├── player/
│   ├── enemies/
│   ├── levels/
│   ├── objects/
│   └── ui/
├── scripts/
│   ├── autoloads/
│   └── components/
├── art/
│   ├── tileset/
│   ├── player/
│   ├── enemies/
│   ├── objects/
│   ├── ui/
│   └── backgrounds/
├── audio/
│   ├── sfx/
│   └── music/
└── fonts/
```

Empty folders don't show up in Godot's FileSystem panel until they contain at least one file. Godot creates a `.gdignore` or you can place a placeholder. The simplest fix: create folders as you need them rather than all upfront. But having the plan is what matters.

### Step 3: Project Settings

Open **Project → Project Settings** and configure:

**Display → Window:**

```
Viewport Width:   320
Viewport Height:  180
Window Width Override:   1280
Window Height Override:  720
Stretch Mode:     viewport
Stretch Aspect:   keep
```

This gives us a pixel-art-friendly setup: the game renders at 320×180 (a standard 16:9 low-res canvas) and scales up to 1280×720 (exactly 4×) in the window. The `viewport` stretch mode ensures clean pixel upscaling, and `keep` aspect prevents distortion.

Why 320×180? At 18px tiles, the viewport fits roughly 17 tiles wide and 10 tiles tall — a comfortable view for a platformer. The player can see enough of the level to react to hazards without the view feeling cramped.

**Rendering → Textures → Canvas Textures:**

```
Default Texture Filter:  Nearest
```

This prevents Godot from applying bilinear filtering to sprites and tiles, which would make pixel art look blurry.

**Physics → 2D:**

```
Default Gravity:  980
```

Godot's default gravity is 980 pixels/second². This is a reasonable starting value for our viewport size. We'll tune it during player movement in Chapter 14 — platformer gravity is a game-feel decision, not a physics-accuracy one.

### Step 4: Verify Pixel Art Rendering

We already set `Default Texture Filter: Nearest` in the project settings (Step 3). In Godot 4, this is the primary way to control texture filtering — there's no per-texture "Filter" toggle in the Import dock like there was in Godot 3.

If a specific sprite or node needs different filtering, you can override it per-node: select any `CanvasItem` node (Sprite2D, AnimatedSprite2D, etc.) and in the Inspector under **Texture → Filter**, change it from `Inherit` to `Nearest` or `Linear`. But with the project default set to Nearest, you shouldn't need to touch this.

### Step 5: The Main Scene

Every Godot project needs a main scene — the first scene loaded when the game runs. For now, create a placeholder:

1. Create a new scene: **Scene → New Scene**.
2. Choose **Node2D** as the root node.
3. Rename it to `Main`.
4. Save as `res://scenes/levels/level_01.tscn`.
5. Set it as the main scene: **Project → Project Settings → Application → Run → Main Scene** → select `level_01.tscn`.

Press **F5** to run. You should see an empty black window at 1280×720. That's correct — we haven't added any content yet.

### Step 6: The GameManager Autoload

We'll need a global manager to track game state across scenes — score, health, current level. Create it now as a skeleton:

Create `res://scripts/autoloads/GameManager.cs`:

```csharp
using Godot;

public partial class GameManager : Node
{
    public static GameManager Instance { get; private set; }

    public int Score { get; set; } = 0;
    public int PlayerHealth { get; set; } = 3;
    public int MaxHealth { get; private set; } = 3;

    public override void _Ready()
    {
        Instance = this;
    }

    public void AddScore(int amount)
    {
        Score += amount;
        GD.Print($"Score: {Score}");
    }

    public void TakeDamage(int amount)
    {
        PlayerHealth = Mathf.Max(0, PlayerHealth - amount);
        GD.Print($"Health: {PlayerHealth}/{MaxHealth}");

        if (PlayerHealth <= 0)
        {
            GameOver();
        }
    }

    public void Heal(int amount)
    {
        PlayerHealth = Mathf.Min(MaxHealth, PlayerHealth + amount);
    }

    public void ResetState()
    {
        Score = 0;
        PlayerHealth = MaxHealth;
    }

    private void GameOver()
    {
        GD.Print("Game Over!");
        // We'll implement the game over screen in Chapter 17
    }
}
```

Register it as an autoload:

1. **Build the project first** — click the MSBuild panel's **Build** button (or press Alt+B). Godot cannot register a C# script as an autoload until it has been compiled. If you skip this step, you'll get: `Failed to create an autoload, script is not compiling`.
2. **Project → Project Settings → Autoload** tab.
3. Click the folder icon and select `GameManager.cs`.
4. Node Name: `GameManager`.
5. Click **Add**.

Now `GameManager.Instance` is accessible from any script in any scene. The `static Instance` pattern gives us a typed reference without calling `GetNode` every time.

**Why not a static class?** Autoloads are nodes — they participate in the scene tree, receive `_Process()` calls, can emit signals, and persist across scene changes. A plain static class can hold data but can't do any of that.

### What We've Built

At the end of this chapter, you have:

- A clear design document defining what the game includes and (crucially) what it doesn't
- A folder structure ready for scenes, scripts, art, audio, and UI
- Project settings configured for pixel-art rendering at 320×180
- A GameManager autoload skeleton tracking score and health
- A list of assets needed and where to find them

No gameplay code yet — that's intentional. Planning and setup is invisible work, but it pays off every single day of development. The next chapter is where the fun starts: we'll build the player character with movement, jumping, wall jumping, and animations.

---

## Summary

**Game design document (13.1):** Define scope before opening the editor. List what's in, list what's out, and write a concrete "done" checklist. Our game is Crystal Caverns — a 3-level platformer with crystals, enemies, hazards, and checkpoints.

**Project structure (13.2):** Organize files by feature (`scenes/player/`, `scenes/enemies/`). Scripts use PascalCase, everything else uses snake_case. Scenes and their scripts live together.

**Free assets (13.3):** Kenney.nl for CC0 art and audio. itch.io and OpenGameArt for additional resources. Only import assets you'll actually use. Decide on tile size early (16×16 or 18×18) and stick with it.

**Project setup (13.4):** Viewport at 320×180 with `viewport` stretch mode for pixel-perfect rendering. Nearest-neighbor texture filtering. 2D pixel snapping enabled. GameManager autoload for global state.

---

**Next up: Chapter 14 — Player Character.** We'll create the player scene, implement run/jump/fall/wall-jump movement, hook up sprite animations, add coyote time and jump buffering, and make it feel great to control.
