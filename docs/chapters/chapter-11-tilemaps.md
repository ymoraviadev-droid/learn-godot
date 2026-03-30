# Chapter 11: TileMaps

---

## 11.1 What Is a TileMap?

Imagine building a platformer level by placing individual `Sprite2D` nodes for every ground tile, every wall block, every background brick. A small level might need hundreds. A large one, thousands. Each node takes memory, clutters the scene tree, and makes editing a nightmare. Want to move a wall? Select 40 sprites and drag them. Want to change the ground texture? Update each sprite one by one.

TileMaps solve this. Instead of individual sprites, you define a **palette** of reusable tile pieces and **paint** them onto a grid. One node, one grid, thousands of tiles — all rendered efficiently as a single batch.

### The Grid

A TileMap is a 2D grid of **cells**. Each cell is the same size (commonly 16×16 or 32×32 pixels), and each cell can hold one tile or be empty. Cells are addressed by integer coordinates using `Vector2I`:

```
     Col 0   Col 1   Col 2   Col 3
Row 0  [ ]     [G]     [G]     [ ]
Row 1  [G]     [G]     [G]     [G]
Row 2  [W]     [W]     [W]     [W]

G = grass tile, W = wall tile, [ ] = empty cell
```

Cell `(1, 0)` holds a grass tile. Cell `(0, 0)` is empty. The grid extends infinitely in all directions — you paint wherever you need, and Godot only stores data for cells that have tiles in them.

**Tile size** is set once on the TileSet resource and applies to the entire grid. All tiles in the set share the same cell dimensions. If your sprite sheet has 16×16 tiles, set the tile size to 16×16. Mismatched sizes cause visual gaps or overlaps.

### Two Key Resources: TileSet vs TileMapLayer

The system has two parts:

- **TileSet** — the palette. A resource that defines which tiles exist, what they look like, and what data they carry (collision shapes, animation frames, custom metadata). Think of it as the box of LEGO bricks.
- **TileMapLayer** — the canvas. A node that references a TileSet and stores which tile goes in which cell. Think of it as the baseplate you snap bricks onto.

One TileSet can be shared by multiple TileMapLayer nodes. You define your tiles once and reuse them across layers.

### TileMap Is Deprecated — Use TileMapLayer

In Godot 4.0–4.2, you used a single `TileMap` node that contained multiple internal layers. **Since Godot 4.3, `TileMap` is deprecated.** The replacement is `TileMapLayer` — each layer is now its own node in the scene tree.

This is a better design. Each layer is a regular node you can reorder, toggle visibility on, attach scripts to, or move independently. The old `TileMap` node still works but prints deprecation warnings and will be removed in a future version. All code in this chapter uses `TileMapLayer`.

### Typical Scene Tree

A platformer level usually has several tile layers stacked on top of each other:

```
World (Node2D)
├── BackgroundTiles (TileMapLayer)    ← distant decorations, no collision
├── GroundTiles (TileMapLayer)        ← solid ground, walls — has physics
├── ForegroundTiles (TileMapLayer)    ← vines, railings drawn over the player
├── Player (CharacterBody2D)
│   ├── Sprite2D
│   └── CollisionShape2D
└── Enemies (Node2D)
    └── ...
```

Each `TileMapLayer` references the same TileSet resource but paints different tiles. The background layer uses sky and cloud tiles. The ground layer uses solid terrain. The foreground layer uses decorative pieces that render in front of the player.

**Z-ordering matters.** Nodes higher in the tree render behind nodes lower in the tree (by default). Place the background layer above the player and the foreground layer below — or set the `Z Index` property on each layer explicitly.

### When to Use TileMaps vs Individual Sprites

TileMaps are the right choice when:

- Your level is built on a **grid** — platformer terrain, dungeon floors, puzzle boards.
- You have **repeating visual elements** — the same ground tile used hundreds of times.
- You want to **paint levels visually** in the editor rather than placing nodes one by one.
- You need **efficient rendering** — one draw call for an entire layer instead of one per sprite.

Individual sprites are better when:

- Objects don't align to a grid — trees at arbitrary positions, scattered rocks, UI elements.
- Each instance is unique — a boss arena backdrop, a one-off set piece.
- You need per-instance behavior — an animated torch that responds to the player, a destructible crate with its own health bar.

Many games use both. Paint the level structure with TileMaps and place unique objects as individual scenes on top.

---

## 11.2 Creating a TileSet

A TileSet is a resource — it lives independently of any scene and can be shared across multiple `TileMapLayer` nodes. Before you paint a single tile, you need to build this palette: import your artwork, define tile boundaries, and optionally attach physics, animation, or metadata.

### Creating a New TileSet

1. Select a `TileMapLayer` node (or create one).
2. In the Inspector, find the **Tile Set** property. Click it → **New TileSet**.
3. A new empty TileSet resource is created and assigned to this layer.

**Set the tile size immediately.** In the TileSet resource inspector, look for **Tile Size** — it defaults to `16×16`. Set this to match your sprite sheet's tile dimensions *before* adding any sources. Changing it later forces you to redo all your tile configurations.

| Common Tile Sizes | Typical Use |
| --- | --- |
| 8×8 | Retro / Game Boy style |
| 16×16 | Most pixel-art platformers |
| 32×32 | Higher-res pixel art, top-down RPGs |
| 48×48, 64×64 | HD 2D, detailed tilesets |

### TileSetAtlasSource — Sprite Sheet Import

The most common way to add tiles. An atlas source takes a single sprite sheet image and slices it into a grid of tiles.

**Steps:**

1. Click the TileSet resource to open the **TileSet** editor panel at the bottom of the screen.
2. Click the **+** button (Add Source) → **Atlas**.
3. Drag your sprite sheet texture into the **Texture** property (or click to browse).
4. Godot slices the texture into tiles based on the TileSet's tile size.

You'll immediately see a grid overlay on your texture in the editor. Each cell is one tile.

**Atlas source properties:**

| Property | What It Does |
| --- | --- |
| **Texture** | The sprite sheet image |
| **Texture Region Size** | Size of each tile in the atlas. Defaults to the TileSet's tile size — override if this particular sheet uses different dimensions |
| **Margins** | Pixels to skip at the left and top edges of the texture before the first tile begins |
| **Separation** | Pixels between tiles in the sheet (gutters). Some sprite sheets add 1–2px gaps to prevent bleeding |
| **Use Texture Padding** | Adds transparent padding around tiles at runtime to prevent texture filtering artifacts. Leave on unless you have a reason not to |

**Example:** You have a 256×128 sprite sheet with 16×16 tiles, no margins, no separation. That gives you a 16×8 grid = 128 possible tiles. Not every cell needs to contain a tile — empty cells in the sheet are simply unused.

### Inspector Walkthrough

Here's what a typical atlas setup looks like in the Inspector, top to bottom:

```
TileSet
├── Tile Size: 16 × 16
└── Sources
    └── Source 0 (Atlas)
        ├── Texture: res://assets/tiles/platformer_sheet.png
        ├── Texture Region Size: 16 × 16
        ├── Margins: 0 × 0
        ├── Separation: 0 × 0
        └── Use Texture Padding: true
```

After adding the source, switch to the **TileSet** tab at the bottom of the editor. You'll see your sprite sheet with a grid overlay. Tiles that Godot auto-detected as non-empty are highlighted. You can:

- **Click a tile** to select it and edit its properties (collision, animation, custom data).
- **Click and drag** across multiple cells to create a multi-cell tile (e.g., a 2×2 tree that spans four cells).
- **Right-click** a tile for options like deleting it from the palette.

### Handling Sprite Sheets with Margins and Separation

Many sprite sheets from asset packs include margins (empty space around the edges) and separation (gaps between tiles). If you don't configure these, Godot slices at the wrong positions and every tile is offset.

```
Separation = 0:          Separation = 1:
┌──┬──┬──┐               ┌──┬─┬──┬─┬──┐
│T1│T2│T3│               │T1│ │T2│ │T3│
├──┼──┼──┤               ├──┼─┼──┼─┼──┤
│T4│T5│T6│               │T4│ │T5│ │T6│
└──┴──┴──┘               └──┴─┴──┴─┴──┘
                          1px gap between tiles
```

Set **Margins** and **Separation** on the atlas source to match your sheet. If tiles look like they're showing slivers of neighboring tiles, separation is likely off by a pixel.

### TileSetScenesCollectionSource — Scene Tiles

Not every tile is a simple sprite. Sometimes a tile cell needs to contain an entire scene — an animated torch with particles, an interactive lever with its own script, a chest that plays an animation when opened.

**TileSetScenesCollectionSource** lets you register Godot scenes (`.tscn` files) as tiles. When you paint them onto the grid, Godot instantiates the scene at that cell position.

**When to use scene tiles:**

- The tile needs its own node tree (particles, lights, `AnimationPlayer`).
- The tile needs a script with custom behavior.
- The tile has complex collision or Area2D children that go beyond what the TileSet physics layer offers.

**When NOT to use scene tiles:**

- Simple static sprites — use atlas tiles instead. Scene tiles are heavier because each placed tile instantiates a full scene.
- Tiles that just need collision or animation — the TileSet editor handles both without scenes.

**Adding a scene tile:**

1. In the TileSet editor, click **+** (Add Source) → **Scenes Collection**.
2. Click the **+** in the scenes list to add a scene.
3. Browse to your `.tscn` file.
4. The scene appears as a paintable tile in the TileMap editor.

```
TileSet
├── Source 0 (Atlas)              ← regular sprite tiles
└── Source 1 (Scenes Collection)
    ├── Scene 0: res://scenes/tiles/animated_torch.tscn
    └── Scene 1: res://scenes/tiles/treasure_chest.tscn
```

Scene tiles render a preview icon in the editor but appear as full scene instances at runtime.

### Alternative Tiles

Sometimes you want a tile that looks slightly different but shares the same base — a ground tile flipped horizontally, a wall tile with a different tint, or a platform tile rotated 90°.

**Alternative tiles** are variants of an existing atlas tile. They share the same texture region but can override properties like flip, rotation, modulation (color tint), and even collision shapes.

**Creating an alternative tile:**

1. In the TileSet editor, select a tile in the atlas.
2. Right-click → **Create an Alternative Tile** (or look for the **+** button in the tile's property panel).
3. A new alternative appears next to the base tile. Select it to configure its overrides.

Common uses:

- **Horizontal/vertical flip** — one grass edge tile becomes both left and right edges.
- **Color modulation** — same brick tile tinted slightly darker for variety.
- **Different collision** — base tile is fully solid, alternative has one-way collision for platforms.

Alternative tiles share the base tile's texture and only store the differences. They're lightweight — creating 4 rotated variants of a tile doesn't quadruple memory usage.

**In code**, alternative tiles have an `alternativeTileId` that you pass alongside the atlas coordinates:

```csharp
// Place the base tile
tileMapLayer.SetCell(new Vector2I(5, 3), sourceId: 0, atlasCoords: new Vector2I(2, 1));

// Place alternative tile 1 of the same base tile
tileMapLayer.SetCell(new Vector2I(6, 3), sourceId: 0, atlasCoords: new Vector2I(2, 1), alternativeTile: 1);
```

### Practical Walkthrough: Importing a Platformer TileSet

Let's put it all together. You've downloaded a platformer sprite sheet — a PNG with 16×16 tiles, no margins, no separation.

**Step 1: Create the TileMapLayer and TileSet.**

Add a `TileMapLayer` node to your scene. In the Inspector, create a **New TileSet**. Set **Tile Size** to `16 × 16`.

**Step 2: Add an atlas source.**

Open the TileSet editor (bottom panel). Click **+** → **Atlas**. Drag your PNG into the Texture property. Godot slices it automatically.

**Step 3: Review the auto-detected tiles.**

Godot highlights cells that contain non-transparent pixels. Fully transparent cells are ignored. If a cell is incorrectly detected (or missed), right-click to manually add or remove it.

**Step 4: Create alternatives for symmetric tiles.**

Select a ground-edge tile. Create an alternative tile, flip it horizontally. Now you have both left and right edges from one sprite.

**Step 5: Save the TileSet as a resource.**

Click the TileSet resource in the Inspector → **Save As** → `res://resources/platformer_tileset.tres`. This lets you reuse it across multiple `TileMapLayer` nodes and scenes. If you skip this step, the TileSet is embedded in the scene file — it works, but you can't share it.

Your TileSet is ready. Next, we'll paint with it.

---

## 11.3 Painting Tiles in the Editor

You have a TileSet with tiles defined. Now you paint. Select a `TileMapLayer` node and look at the bottom of the editor — the **TileMap** panel appears. This is where you spend most of your level-design time.

### The TileMap Editor Panel

The panel has three tabs:

- **Tiles** — shows the tile palette. Click a tile to select it, then click in the 2D viewport to place it.
- **Terrains** — shows terrain brushes for auto-tiling. Select a terrain and paint — Godot picks the correct tile variant automatically based on neighbors. We'll cover this in depth in section 11.4.
- **Patterns** — stores saved groups of tiles you can stamp repeatedly (useful for pre-built structures like doors or staircases).

Above the palette is a toolbar with painting tools. Below, the tile atlas is displayed — click to pick a tile, then paint on the canvas.

### Painting Tools

| Tool | Shortcut | What It Does |
| --- | --- | --- |
| Paint | D | Click or click-and-drag to place the selected tile. The bread and butter |
| Eraser | E | Click or drag to remove tiles from cells |
| Rectangle | R | Click and drag to fill a rectangular region with the selected tile |
| Line | L | Click start point, drag to end point — fills a straight line of tiles |
| Bucket Fill | B | Fills a contiguous region of empty cells (or cells matching the clicked tile) with the selected tile |

Switch between tools with the shortcuts or by clicking the toolbar icons. Hold **Shift** while using the Paint tool to draw a straight horizontal or vertical line from your last placement — useful for long walls.

### Eyedropper (Pick Tile)

**Ctrl+Click** in the viewport picks the tile under the cursor and makes it the active tile in the palette. This is the eyedropper — essential when you're working with a large tileset and don't want to scroll through the palette hunting for the right tile.

The eyedropper picks up everything: the tile's atlas coordinates, its alternative tile ID, and any flip/rotation state. What you pick is exactly what you'll paint.

### Rotation and Flipping

With a tile selected in the palette, use these shortcuts before painting:

| Action | Shortcut |
| --- | --- |
| Flip horizontally | X |
| Flip vertically | Y |
| Rotate clockwise 90° | Z |
| Rotate counter-clockwise 90° | Shift+Z |

The toolbar shows the current flip/rotation state as toggle buttons. These transforms are applied to every tile you paint until you reset them. Click the transform buttons again (or press the shortcut again) to toggle off.

**Tip:** If your tiles look wrong after rotating, check whether your TileSet has the **Tile Offset Axis** set correctly. Square tiles work with any rotation. Non-square tiles or isometric setups need matching offset configuration.

### Scatter and Random Painting

Painting the same grass tile across an entire field looks flat and repetitive. The **scatter** feature (also called random painting) solves this.

**How to use it:**

1. In the tile palette, **select multiple tiles** — hold Ctrl and click several grass variants, or click-and-drag across a group of tiles.
2. Enable the **Random** toggle in the toolbar (the dice icon).
3. Paint normally. Each cell randomly picks one of your selected tiles.

You can also adjust the **scattering** slider to control density — useful when painting sparse decoration tiles over an area. At lower values, some cells are left empty, creating a natural random distribution.

**For more control**, use **Tile Probability**. In the TileSet editor, select a tile and set its **Probability** value (default 1.0). Higher probability tiles appear more often during random painting. Set your plain grass to probability 3.0 and the flower variant to 0.5 — you'll get mostly grass with occasional flowers.

### Multi-Cell Selection and Stamping

Select multiple tiles in the palette by clicking and dragging across a rectangle of tiles. When you paint, the entire group stamps down as a unit. This is great for structures that span multiple tiles — a 3×2 tree, a 2×3 door frame, a decorative arch.

The **Patterns** tab takes this further. Paint a group of tiles in the viewport, then select them and save as a pattern. Now you can stamp that exact arrangement anywhere. Useful for:

- Window + frame combinations you reuse across buildings.
- Pre-built platform segments.
- Decorative clusters (group of mushrooms, pile of rocks).

### Practical Tips

**Work in layers.** Paint background decoration on one `TileMapLayer`, solid terrain on another, foreground details on a third. This keeps things organized and lets you toggle layer visibility while editing.

**Use the grid.** Press **G** to toggle grid visibility in the 2D viewport. The grid aligns to your tile size and helps you see cell boundaries while painting.

**Zoom in.** Tile painting is pixel-precise work. Use the scroll wheel to zoom into the area you're editing. At low zoom levels it's easy to paint in the wrong cell.

**Undo is generous.** Ctrl+Z undoes individual paint strokes. Godot tracks tile painting at a fine granularity, so you can undo a misplaced tile without losing the last 50 you placed.

**Paint terrain before decoration.** Get the solid ground and walls right first — collision and gameplay geometry. Then add visual polish on the decoration layers. It's much harder to rearrange structural tiles when decoration is already painted around them.

---

## 11.4 Auto-Tiling and Terrain Rules

Painting individual border tiles, corner tiles, and transition tiles by hand works — until it doesn't. A 10-tile-wide platform needs a left edge, a right edge, 8 middle tiles, and if the platform has a top surface, you need top-left corner, top-right corner, and top-middle variants too. Change the platform width? Repaint every edge. Add a step? Figure out which corner piece goes where.

Terrains automate this. You define **rules** — "this tile goes next to ground on its left and air on its right" — and Godot picks the correct tile as you paint. You just drag a brush across the canvas and the engine figures out corners, borders, and transitions for you.

---

### The Problem with Manual Tile Placement

Consider a simple cave wall tileset with 16 variants: top-left corner, top edge, top-right corner, left edge, center fill, right edge, bottom-left corner, bottom edge, bottom-right corner, plus inner corners for concave turns. Manually choosing each piece is:

- **Slow.** Every tile requires scanning the palette for the right variant.
- **Error-prone.** Place a left-edge tile where a corner should go and the seam looks broken.
- **Fragile.** Editing one tile might invalidate its neighbors — you repaint the corner, but now the adjacent edge is wrong.

Auto-tiling reduces this to: select a terrain, paint a blob, and every tile in the blob gets the right variant automatically.

---

### Terrain Sets and Terrains

The terrain system has two levels of organization:

**Terrain Set** — a group of related terrains that interact with each other. Each terrain set has a **matching mode** that determines how tiles connect. A TileSet can have multiple terrain sets (e.g., one for ground surfaces, another for wall types).

**Terrain** — a single terrain type within a set. For example, a terrain set might contain "Grass," "Dirt," and "Stone" terrains. Each terrain gets a color in the editor for visual clarity.

```
TileSet
└── Terrain Sets
    ├── Terrain Set 0: "Ground"
    │   ├── Terrain 0: Grass (green)
    │   ├── Terrain 1: Dirt (brown)
    │   └── Terrain 2: Stone (gray)
    └── Terrain Set 1: "Walls"
        ├── Terrain 0: Brick (red)
        └── Terrain 1: Cave (dark gray)
```

---

### Matching Modes

Each terrain set uses one of three matching modes. The mode determines which parts of a tile must match its neighbors for the auto-tiler to consider them compatible.

**Match Corners and Sides** — the most precise mode. Each tile edge and each tile corner is checked independently. This gives you full control: a tile knows whether its top-left corner touches grass, its top edge touches dirt, and its right side touches air. Use this for terrain that needs smooth diagonal transitions and inner/outer corner variants.

```
┌───┬───┬───┐
│ C │ S │ C │   C = corner peering bit
├───┼───┼───┤   S = side peering bit
│ S │   │ S │
├───┼───┼───┤   Total: 8 peering bits per tile
│ C │ S │ C │   (4 corners + 4 sides)
└───┴───┴───┘
```

**Match Sides** — only the four sides of a tile are checked. Corner information is ignored. Simpler to set up — fewer bits to configure per tile. Good for tile types that don't need corner transitions, like a road that only cares about connecting north/south/east/west.

```
┌───────────┐
│     S     │   S = side peering bit
│           │
│ S       S │   Total: 4 peering bits per tile
│           │
│     S     │
└───────────┘
```

**Match Corners** — only corners are checked, sides are ignored. Uncommon, but useful for certain artistic styles where corners define the visual transitions and sides blend naturally.

```
┌───────────┐
│ C       C │   C = corner peering bit
│           │
│           │   Total: 4 peering bits per tile
│           │
│ C       C │
└───────────┘
```

**Which mode to use?** Start with **Match Corners and Sides** unless your tileset specifically doesn't have corner variants. It requires more setup but produces the best results. Match Sides works well for roads, rivers, and pipe-like tilesets.

---

### Peering Bits

Peering bits are the core mechanism. Each bit on a tile says: "in this direction, I expect terrain X." When you paint terrain on the map, Godot checks each cell's neighbors and selects the tile variant whose peering bits match the surrounding cells.

For a ground tile's **right side** peering bit:

- If it's set to **Grass terrain** → this tile expects grass to its right.
- If it's set to **no terrain** (empty / -1) → this tile expects air (or a different terrain) to its right.

A center fill tile has all peering bits set to its own terrain — it expects the same terrain on all sides. An edge tile has some bits set to its terrain and others set to empty — it expects terrain on one side and nothing on the other.

**Example peering bits for a grass right-edge tile (Match Corners and Sides):**

```
┌───────────────────────┐
│ Grass │ Grass │ Empty │
├───────┼───────┼───────┤
│ Grass │       │ Empty │  ← right side is "Empty" because
├───────┼───────┼───────┤    air is to the right of this edge
│ Grass │ Grass │ Empty │
└───────┴───────┴───────┘
```

---

### Step-by-Step Setup

**Step 1: Add a terrain set to the TileSet.**

Select the TileSet resource in the Inspector. Scroll to **Terrain Sets** → click **Add Element**. A new terrain set appears. Set the **Mode** (Match Corners and Sides for most cases).

**Step 2: Add terrains to the set.**

Expand the terrain set. Click **Add Element** under its **Terrains** list. Name it (e.g., "Grass"). Pick a color — this is just for editor visualization. Repeat for each terrain type.

**Step 3: Open the TileSet editor and switch to Terrains mode.**

Click the TileSet tab at the bottom of the editor. Switch to the **Select** editing mode. You'll see the atlas with your tiles. In the properties panel on the right, look for the **Terrains** section.

**Step 4: Assign a terrain to each tile.**

Select a tile in the atlas. In the Terrains section, set its **Terrain Set** and **Terrain** to identify which terrain this tile belongs to.

**Step 5: Configure peering bits.**

With the tile selected and terrain assigned, the peering bit editor appears. It shows the 8-bit grid (for Match Corners and Sides) overlaid on the tile. Click each bit to cycle through terrains or set it to "no terrain." Paint the bits to describe what this tile expects on each side and corner.

**Step 6: Repeat for all tile variants.**

Every variant in your tileset — centers, edges, corners, inner corners — needs its peering bits configured. This is the most tedious part. For a typical 47-tile blob set, you configure 47 tiles × 8 bits each. But you only do it once.

**Step 7: Paint with the terrain brush.**

Switch to the TileMap editor. In the tile palette, switch from the **Tiles** tab to the **Terrains** tab. Select your terrain (e.g., Grass). Paint on the viewport. Godot automatically picks the correct tile variant for each cell based on its neighbors.

---

### Common Patterns

**Ground with grass top:** A terrain where the top edge has grass blades and everything else is dirt. Center tiles are solid dirt. Top-edge tiles show grass. Corner tiles show grass transitioning to air. The auto-tiler handles all transitions — you just paint a platform shape and it figures out which tiles are edges and which are fill.

**Cave walls:** The inverse — solid rock that borders empty cave interior. The terrain defines the rock, and peering bits pointing inward (toward the cave) are set to "no terrain." Outer corners handle concave turns in the cave walls, inner corners handle convex turns.

**Water edges:** Water terrain bordered by ground. Water center tiles are deep blue. Edge tiles show shoreline transitions. This often uses a separate terrain set from the ground terrain set, since water and ground don't share corner variants.

**Roads:** A good fit for **Match Sides** mode. Road tiles connect north-south-east-west. A straight road tile has peering bits on two opposite sides. A crossroads tile has all four sides. A T-junction has three. The auto-tiler builds road networks as you paint paths.

---

### SetCellsTerrainConnect in C#

Painting terrain in code works through `SetCellsTerrainConnect()`. Instead of specifying exact tile coordinates and atlas positions, you specify cells and a terrain — Godot resolves the correct tile variants.

```csharp
public partial class LevelGenerator : Node2D
{
    [Export] private TileMapLayer _groundLayer;

    public override void _Ready()
    {
        // Define which cells should be terrain
        var cells = new Godot.Collections.Array<Vector2I>();

        // A flat platform from (2,5) to (12,5)
        for (int x = 2; x <= 12; x++)
        {
            cells.Add(new Vector2I(x, 5));
        }

        // Add a second row underneath for thickness
        for (int x = 2; x <= 12; x++)
        {
            cells.Add(new Vector2I(x, 6));
        }

        // terrainSet: 0, terrain: 0 (e.g., Grass)
        _groundLayer.SetCellsTerrainConnect(cells, terrainSet: 0, terrain: 0);
    }
}
```

`SetCellsTerrainConnect()` places tiles and resolves all peering bits in one call. It looks at the existing tiles around the area and makes sure the new tiles connect properly to whatever is already there.

There's also `SetCellsTerrainPath()` — it works the same way but treats the input cells as a path rather than a blob. The difference matters for thin, one-cell-wide structures like roads: `TerrainPath` forces each cell to connect only to the previous and next cell in the list, producing a connected line rather than a filled area.

```csharp
// Place a winding road as a connected path
var roadPath = new Godot.Collections.Array<Vector2I>
{
    new Vector2I(0, 3),
    new Vector2I(1, 3),
    new Vector2I(2, 3),
    new Vector2I(2, 2),
    new Vector2I(2, 1),
    new Vector2I(3, 1),
};

_groundLayer.SetCellsTerrainPath(roadPath, terrainSet: 1, terrain: 0);
```

---

### Limitations

The terrain system is powerful but not magic. Know its boundaries:

**It works within a single TileMapLayer.** Terrain resolution doesn't look across layers. If your ground is on one layer and your decoration is on another, the decoration layer's terrain won't consider the ground layer's tiles when picking variants. Each layer resolves independently.

**It requires a complete tileset.** If your art is missing a variant — say you have outer corners but no inner corners — the auto-tiler can't find a matching tile for concave turns. It either leaves the cell empty or picks the closest match, which usually looks wrong. For Match Corners and Sides mode, a full blob set requires up to 47 tile variants per terrain.

**Custom tile shapes aren't resolved.** The auto-tiler picks tiles based on peering bits, not collision shapes. You still need to manually configure collision for each tile variant in the TileSet editor. Terrain setup and collision setup are independent processes.

**Performance with many terrain sets is fine** — terrain resolution happens when you paint (in the editor) or when you call `SetCellsTerrainConnect()` (at runtime). It's a one-time cost per placed tile, not a per-frame cost. Thousands of cells resolve in milliseconds.

**Diagonal connections need Match Corners and Sides.** If you use Match Sides mode, you won't get distinct inner/outer corner variants — the auto-tiler simply can't distinguish them with only 4 bits.

---

## 11.5 Tile Collisions and Physics Layers

Your tiles look great. Your level is painted. But if you run the game right now, the player falls straight through the floor. That's because painting a tile only places a visual — it has no effect on physics until you add collision data to the TileSet.

This section covers how to give your tiles physical presence: adding physics layers to a TileSet, drawing collision shapes on individual tiles, configuring layers and masks, handling special cases like jump-through platforms, and understanding why tile collision is cheap even with thousands of tiles.

---

### Why Tiles Need Collision Shapes

A `TileMapLayer` node is, fundamentally, a renderer. It knows which tiles to draw and where, but the physics engine knows nothing about it unless you explicitly attach collision geometry to the TileSet resource.

Without collision shapes on your tiles:

- Characters fall through floors.
- Walls are decorative — nothing stops the player from walking through them.
- `RayCast2D` nodes aimed at the ground return no hits.

With collision shapes, the physics engine treats each placed tile as a `StaticBody2D` with the shape you defined. Your character can stand on the floor, bump into walls, and slide along slopes — all driven by the tile grid.

---

### Adding a Physics Layer to the TileSet

Collision is configured at the **TileSet resource level**, not per-tile yet. Think of it as declaring "this TileSet participates in physics." Individual tiles then opt in by having shapes drawn onto them.

**Steps:**

1. Select the `TileMapLayer` node.
2. In the Inspector, click the **TileSet** resource to open it.
3. Scroll down to the **Physics Layers** section. Click **Add Element**.

This creates **Physics Layer 0** with two properties:

- **Collision Layer** — which physics layer the tiles placed here exist on.
- **Collision Mask** — which physics layers these tiles detect (almost always left empty — solid tiles don't need to detect anything, they just block).

A single TileSet can have multiple physics layers (Physics Layer 0, 1, 2...). Each one maps to a different collision layer/mask combination. We'll use this for different tile types shortly.

---

### Collision Layers and Masks on Physics Layers

This connects directly to the system from Chapter 10. The **Layer** and **Mask** on a TileSet physics layer work exactly the same way as on any `StaticBody2D`:

- **Layer** — which layer the tile *exists on*. Other bodies scan for it here.
- **Mask** — which layers this tile scans for. Solid tiles typically leave this empty.

A typical setup for a platformer:

```
Project Settings → Layer Names → 2D Physics:
  Layer 1: Player
  Layer 2: Enemies
  Layer 3: World
  Layer 4: Hazards
  Layer 5: Water
```

Then configure your TileSet physics layers:

| Physics Layer | Collision Layer | Collision Mask | Purpose |
|---|---|---|---|
| 0 | 3 (World) | — | Solid ground, walls, ceilings |
| 1 | 4 (Hazards) | — | Spikes, lava tiles |
| 2 | 5 (Water) | — | Water/slow zones |

Your player's `CharacterBody2D` has mask 3 (World) set, so it collides with ground tiles. To detect hazards, add mask 4 — either on the player body itself, or on a separate `Area2D` hurtbox.

---

### Multiple Physics Layers on One TileSet

Having separate physics layers per tile type gives you fine-grained control without splitting your art into multiple TileSet resources. A single floor tile can exist on the World layer while a spike tile on the same sheet uses the Hazards layer — painted on the same `TileMapLayer`.

**Why not just use one layer for everything?** Because different game systems care about different tiles differently. The player physics body needs to collide with ground. A separate Area2D hurtbox needs to detect hazards. A "wet" movement modifier script needs to sense water tiles. One physics layer per semantic category keeps these concerns cleanly separated.

To draw collision shapes for a specific physics layer, select the physics layer in the tile editor before drawing. Each tile stores shapes per physics layer independently.

---

### Drawing Collision Shapes on Individual Tiles

Declaring a physics layer makes the TileSet collision-aware, but individual tiles still need shapes drawn on them. You do this in the **TileSet editor** panel at the bottom of the screen.

**Entering the tile editor:**

1. With the `TileMapLayer` node selected, open the **TileSet** tab at the bottom.
2. Click on a tile in the tile atlas to select it.
3. Switch to the **Select** tab and look for the **Physics** section in the properties panel on the right side, or use the paint tools in the main editor area.

**Full-tile collision shortcut (most common):**

For square tiles where you want the entire tile to be solid, there's no need to draw manually. Right-click the tile in the atlas → **Reset to Default** or look for the **F key shortcut** while the physics layer is active. This fills the entire tile cell with a rectangle matching the tile size. Most platformer floors and walls use this.

**Drawing a custom polygon:**

1. Select the tile in the atlas.
2. In the Physics section, ensure you have the correct physics layer selected.
3. Click **Add Polygon** or use the polygon draw tool.
4. Click in the tile preview area to place vertices. The polygon snaps to a grid — hold Ctrl to disable snapping for finer control.
5. Close the polygon by clicking the first vertex again.

**Rectangle shortcut:**

Hold **Shift** while clicking and dragging in the tile preview to draw a rectangle collision shape instead of placing vertices one at a time. This is faster for tiles that need a rectangular collision that doesn't fill the whole cell (half-tiles, ledge tiles, sloped rooftops).

**Editing existing shapes:**

Click on a shape to select it. Drag vertices to reshape. Right-click a vertex to delete it. Delete the shape entirely with the trash icon in the properties panel.

---

### Per-Tile Collision vs Full-Tile Collision

Not every tile needs precise collision geometry. Think about what the player will actually interact with:

**Full-tile collision** (the rectangle covering the whole tile):
- Ground tiles, wall tiles, ceiling tiles — anything solid all the way through.
- Easiest to set up, cheapest to compute.

**Partial collision** (a smaller rectangle or custom polygon):
- Half-height platforms (the player can stand on the top half but the bottom half is air).
- Sloped tiles — a triangle or angled polygon so the character slides smoothly.
- Decorative tiles that have a small ledge or bump.

**No collision** (shapes omitted entirely):
- Background decoration tiles on a separate `TileMapLayer` — clouds, distant mountains, parallax layers.
- Cosmetic detail tiles overlaid on solid ground.

The rule: draw the simplest shape that gives the right gameplay feel. A triangle for a 45° slope tile is better than 8 vertices tracing the pixel outline — it slides more predictably and costs less.

---

### One-Way Collision on Tiles (Jump-Through Platforms)

Tiles support one-way collision — the player can jump up through the tile from below and land on top. This is the standard behavior for floating platforms in platformers.

**Enabling it:**

1. Select the tile in the TileSet editor.
2. In the Physics section, find the collision shape you've drawn.
3. Enable **One Way** on that shape.

The physics layer's **One Way Margin** (a small pixel value, typically 1–2px) controls how much tolerance the engine gives at the surface. Increase it slightly if characters are jittery on one-way platforms.

**Connecting to the drop-through code from Chapter 10:**

One-way tiles work with the same layer-mask drop-through technique. Put your one-way platform tiles on a dedicated physics layer (e.g., layer 9: "Platforms"), then temporarily remove that layer from the player's mask when they press Down:

```csharp
private async void DropThroughPlatform()
{
    // Stop colliding with the Platforms layer
    SetCollisionMaskValue(9, false);
    await ToSignal(GetTree().CreateTimer(0.2f), Timer.SignalName.Timeout);
    // Restore collision
    SetCollisionMaskValue(9, true);
}
```

This works cleanly because all one-way tiles share the same physics layer — there's no need to find and disable individual nodes.

---

### Performance: Why Tile Collision Scales

A large level might have 10,000 tiles. You might expect that to be 10,000 collision shapes the physics engine must track. It's not.

**How Godot handles it:**

- Tile collision data is stored in the **TileSet resource**, not duplicated per placed tile. Every grass tile references the same rectangle shape. 1,000 grass tiles = one shape definition used 1,000 times.
- The physics engine only activates collision shapes for tiles **near active bodies**. Tiles far from any physics body are not checked. This is managed automatically.
- Tile shapes are **static** — they never move. Static bodies are the cheapest physics objects by a significant margin. The engine keeps them in a separate spatial hash that's much faster to query than dynamic body lists.

In practice, tile collision scales to very large levels without issue. Thousands of tiles perform better than dozens of `StaticBody2D` nodes placed individually, because there's no per-node overhead — it's all batched geometry.

**What can hurt performance:**

- Very complex polygon shapes on many tiles (50+ vertices per tile across tens of thousands of tiles). Stick to simple shapes.
- Extremely large tilemaps where the broad-phase spatial structure needs to be rebuilt frequently. This matters for procedurally generated levels, not hand-authored ones.
- Using `Area2D` physics layers for detection on every tile. Area overlap checks are more expensive than solid collision. Use them sparingly — one or two detection layers maximum.

---

### Checking Which Tile Was Hit

Sometimes you need to know not just *that* a character touched a tile, but *which* tile — to play the right footstep sound, apply a movement modifier, or trigger a tile-specific effect.

```csharp
public partial class Player : CharacterBody2D
{
    [Export] private TileMapLayer _groundLayer;

    public override void _PhysicsProcess(double delta)
    {
        // ... movement code ...
        MoveAndSlide();

        if (IsOnFloor())
        {
            // Convert world position to tile coordinates
            Vector2I tileCoords = _groundLayer.LocalToMap(
                _groundLayer.ToLocal(GlobalPosition + new Vector2(0, 2))
            );

            // Read custom data from the tile (requires a Custom Data Layer on the TileSet)
            TileData tileData = _groundLayer.GetCellTileData(tileCoords);
            if (tileData != null)
            {
                string surface = tileData.GetCustomData("surface").AsString();
                // "grass", "stone", "ice", etc.
                PlayFootstep(surface);
            }
        }
    }
}
```

`LocalToMap()` converts a world position into tile grid coordinates. `GetCellTileData()` returns the `TileData` for that cell, which carries whatever custom data layers you've added to the TileSet. Custom data layers are added in the TileSet editor under **Custom Data** — name a layer (e.g., "surface"), give it a type (String), and set values per tile.

---

## 11.6 Multiple Tile Layers

Section 11.1 mentioned that a typical level has several `TileMapLayer` nodes stacked in the scene tree. Now let's look at why, how to organize them, and the practical details that matter when you go from one layer to several.

---

### Why Multiple Layers?

A single `TileMapLayer` can only hold one tile per cell. That's fine when every cell is either ground or empty — but real levels have depth. A brick wall sits behind the player. Grass grows on top of the ground. Vines hang in front of the player, partially obscuring them.

If you try to put all of this on one layer, tiles fight for the same cell. You can't place a background brick at `(4, 3)` and a foreground vine at `(4, 3)` on the same layer — one overwrites the other.

Multiple layers solve this by stacking independent grids on top of each other. Each layer has its own set of cells, its own rendering order, and its own physics configuration. Same grid dimensions, same tile size, same TileSet — but each layer paints different content.

---

### Typical Layer Setup

Most 2D games use three to five layers. Here's a common arrangement for a platformer:

| Layer Name | Content | Collision? | Render Order |
| --- | --- | --- | --- |
| Background | Sky tiles, distant walls, parallax decoration | No | Behind everything |
| Terrain | Solid ground, walls, ceilings, platforms | Yes | Behind player |
| Decoration | Flowers, torches, signs, non-solid detail | No (usually) | Behind player |
| Foreground | Vines, railings, fog, overhanging branches | No | In front of player |

The player character sits between the back layers and the front layer. Background and terrain render behind the player. Foreground renders in front, creating depth.

Not every game needs all four. A top-down RPG might only use Background and Terrain. A puzzle game might use one. Scale to your art's needs.

---

### Scene Tree Organization

In Godot 4.3+, each layer is its own `TileMapLayer` node. Arrange them in the scene tree from back to front:

```text
World (Node2D)
├── Background (TileMapLayer)       ← renders first (behind)
├── Terrain (TileMapLayer)          ← solid ground, has collision
├── Decoration (TileMapLayer)       ← non-solid details
├── Player (CharacterBody2D)
│   ├── Sprite2D
│   └── CollisionShape2D
├── Enemies (Node2D)
│   └── ...
└── Foreground (TileMapLayer)       ← renders last (in front of player)
```

Notice the **player is between Decoration and Foreground**. Godot renders sibling nodes in tree order — top of the tree is drawn first (behind), bottom is drawn last (in front). By placing the player between the back layers and Foreground, vines and railings render over the player automatically.

This is the main advantage of `TileMapLayer` over the old deprecated `TileMap` node. Each layer is a regular node you can freely reposition in the tree. Want the decoration layer in front of the player instead? Drag it below the Player node. No code changes needed.

---

### Z-Index for Fine-Grained Depth Control

Tree order works for most cases, but sometimes you need more control. The **Z Index** property on each `TileMapLayer` (inherited from `CanvasItem`) overrides the default tree-order rendering.

Higher Z-index values render in front of lower values. Nodes with the same Z-index fall back to tree order.

**When to use Z-index instead of tree order:**

- When the player needs to walk behind *some* tiles on a layer but in front of others. For example, a row of tall trees — the player should appear behind the treetops but in front of the trunks.
- When you want to keep the scene tree organized by function (all tile layers grouped together) rather than by render depth.

A typical Z-index setup:

```text
Background      Z-index: -10
Terrain         Z-index: 0
Decoration      Z-index: 5
Player          Z-index: 10
Foreground      Z-index: 20
```

With this, every layer has an explicit render order — no ambiguity and no reliance on scene tree position. Gaps between values (0, 5, 10, 20) leave room to insert new layers later without reshuffling everything.

**Y-Sort and tile layers:** If your game uses top-down perspective with Y-sorting (entities behind other entities based on their Y position), enable **Y Sort Enabled** on the parent node and ensure each `TileMapLayer` has it set appropriately. For side-scrollers, Y-sort is typically irrelevant — use Z-index.

---

### Sharing a TileSet Across Layers

All layers should reference the **same TileSet resource**. You define your tiles, collision shapes, terrains, and custom data once. Each layer picks from the same palette but paints different tiles.

**How to share the TileSet:**

1. Create the TileSet on your first `TileMapLayer` and save it as a `.tres` file (e.g., `res://resources/level_tileset.tres`).
2. On every additional `TileMapLayer`, drag that same `.tres` file into the **Tile Set** property in the Inspector.

All layers now see the same tiles. Edit the TileSet once — add a new tile, change a collision shape — and every layer picks up the change.

**Don't** create separate TileSet resources per layer unless your layers genuinely use completely different tile art (e.g., a parallax background with a different tile size). Duplicate TileSets mean duplicate maintenance.

---

### Which Layers Get Collision?

Not every layer should participate in physics. Adding collision shapes to tiles is meaningless unless the layer is meant to block movement.

**Terrain layer — collision ON.** This is the solid world. Ground, walls, ceilings, platforms. The TileSet's physics layers are configured here, and tiles on this layer have collision shapes drawn on them. The player walks on this layer, bullets hit it, enemies navigate around it.

**Background layer — collision OFF.** These tiles are purely visual. Distant mountains, parallax clouds, decorative wall patterns — none of these should stop the player. Don't draw collision shapes on background tiles. Even if you accidentally do, the background layer won't interfere with gameplay as long as the tiles aren't on a physics layer the player's mask checks.

**Decoration layer — usually collision OFF.** Flowers, torches, and signs don't block movement. Exception: if a decoration is also an interactable (a sign the player can read), consider using an `Area2D` on the tile or a separate node rather than tile collision.

**Foreground layer — collision OFF.** Vines and fog don't stop the player. These tiles exist only for visual layering.

The rule: **only the Terrain layer (and maybe a Hazards layer) needs collision.** Everything else is visual. This keeps physics cheap and avoids unexpected invisible walls from decorative tiles.

---

### Practical Example: Platformer Level with Four Layers

Let's build a small platformer scene step by step.

**Step 1: Create the scene and TileSet.**

Add a `Node2D` as the root (name it "Level"). Create a `TileMapLayer` child, name it "Terrain". Create a new TileSet on it, set tile size to 16×16, add your sprite sheet as an atlas source. Save the TileSet as `res://resources/platformer_tileset.tres`.

**Step 2: Add the remaining layers.**

Add three more `TileMapLayer` children to the root: "Background", "Decoration", "Foreground". Drag them in the tree so the order is:

```text
Level (Node2D)
├── Background (TileMapLayer)
├── Terrain (TileMapLayer)
├── Decoration (TileMapLayer)
└── Foreground (TileMapLayer)
```

Assign the same `platformer_tileset.tres` to each layer's Tile Set property.

**Step 3: Configure collision only on Terrain.**

The TileSet already has physics layers configured (from section 11.5). Only the Terrain layer uses tiles with collision shapes. Background, Decoration, and Foreground paint tiles that have no collision shapes — or tiles that do have shapes, but it doesn't matter because nothing collides with decorative layers.

**Step 4: Set Z-index for the Foreground.**

Set Foreground's Z-index to 10. Now it renders over the player even if you later rearrange the tree.

**Step 5: Add the player between layers.**

Add your `CharacterBody2D` player scene as a child of Level. Position it in the tree between Decoration and Foreground:

```text
Level (Node2D)
├── Background (TileMapLayer)
├── Terrain (TileMapLayer)
├── Decoration (TileMapLayer)
├── Player (CharacterBody2D)
└── Foreground (TileMapLayer)
```

**Step 6: Paint each layer.**

Select Background — paint sky tiles, distant wall patterns. Select Terrain — paint solid ground, walls, platforms. Select Decoration — paint flowers, torches, signs on top of the ground. Select Foreground — paint vines, overhanging branches, fog effects.

Run the scene. The player stands on the Terrain tiles, walks behind the Foreground vines, and appears in front of the Background bricks. Four layers, one TileSet, full depth.

---

## 11.7 Procedural Tile Placement from Code

The editor's painting tools are great for hand-authored levels. But sometimes you need tiles placed at runtime — a procedurally generated cave, blocks the player can destroy, a building system where the player clicks to place walls. All of this requires manipulating tile cells from C#.

This section covers the `TileMapLayer` API for reading, writing, and querying tiles in code.

---

### SetCell — Placing a Tile

`SetCell()` is the core method. It places a single tile at the given grid coordinates.

```csharp
tileMapLayer.SetCell(
    coords:          new Vector2I(5, 3),      // grid cell to place in
    sourceId:        0,                        // TileSet source index (atlas ID)
    atlasCoords:     new Vector2I(2, 1),       // position of the tile within the atlas
    alternativeTile: 0                         // alternative tile ID (0 = base)
);
```

**Parameters:**

- **coords** — the cell position in the grid. `Vector2I(0, 0)` is the origin cell. Negative coordinates are valid — the grid extends infinitely.
- **sourceId** — which atlas source in the TileSet to use. If you have one atlas, this is `0`. If you added multiple atlas sources (e.g., one for terrain, one for decorations), use the corresponding index.
- **atlasCoords** — the tile's position within the atlas, measured in tiles (not pixels). `Vector2I(0, 0)` is the top-left tile in the atlas. `Vector2I(2, 1)` is the third column, second row.
- **alternativeTile** — which variant of the tile to use. `0` is the base tile. `1`, `2`, etc. are alternative tiles you created in the TileSet editor (flipped, rotated, tinted variants).

**Shortcut for base tiles:**

```csharp
// alternativeTile defaults to 0, so you can omit it
tileMapLayer.SetCell(new Vector2I(5, 3), 0, new Vector2I(2, 1));
```

---

### EraseCell — Removing a Tile

```csharp
tileMapLayer.EraseCell(new Vector2I(5, 3));
```

Removes whatever tile is in the given cell, leaving it empty. If the cell is already empty, nothing happens.

---

### Reading Tile Data

Several methods let you inspect what's already placed on the grid:

```csharp
// Which atlas source is this cell using? Returns -1 if empty.
int sourceId = tileMapLayer.GetCellSourceId(new Vector2I(5, 3));

// Which tile within the atlas? Returns Vector2I(-1, -1) if empty.
Vector2I atlasCoords = tileMapLayer.GetCellAtlasCoords(new Vector2I(5, 3));

// Which alternative tile? Returns -1 if empty.
int altTile = tileMapLayer.GetCellAlternativeTile(new Vector2I(5, 3));

// Get the full TileData resource for a cell (collision, custom data, etc.)
TileData tileData = tileMapLayer.GetCellTileData(new Vector2I(5, 3));
// Returns null if the cell is empty
```

`GetCellSourceId()` returning `-1` is the standard way to check if a cell is empty.

---

### GetUsedCells — Querying the Grid

```csharp
// All cells that have a tile placed
Godot.Collections.Array<Vector2I> allCells = tileMapLayer.GetUsedCells();

// All cells using a specific atlas source
Godot.Collections.Array<Vector2I> fromAtlas0 = tileMapLayer.GetUsedCellsById(0);

// The bounding rectangle of all used cells
Rect2I bounds = tileMapLayer.GetUsedRect();
```

`GetUsedCells()` returns every non-empty cell on the layer. This is useful for iterating over placed tiles — for example, checking all tiles for a condition, or saving level state.

`GetUsedRect()` returns the smallest `Rect2I` that encloses all placed tiles. Useful for camera bounds, minimap rendering, or knowing the level's extent.

---

### Coordinate Conversion: LocalToMap and MapToLocal

Tile grids use integer `Vector2I` coordinates. The game world uses floating-point `Vector2` positions. You'll constantly need to convert between them.

```csharp
// World position → tile coordinates
Vector2I tileCoords = tileMapLayer.LocalToMap(tileMapLayer.ToLocal(globalPosition));

// Tile coordinates → world position (center of the cell)
Vector2 worldPos = tileMapLayer.ToGlobal(tileMapLayer.MapToLocal(new Vector2I(5, 3)));
```

**`LocalToMap(Vector2 localPos)`** — converts a position in the layer's local space to grid coordinates. The result is which cell that position falls inside. Since it expects local coordinates, wrap a global position with `ToLocal()` first.

**`MapToLocal(Vector2I mapCoords)`** — converts grid coordinates to the local position of that cell's **center**. A 16×16 tile at grid `(0, 0)` returns `Vector2(8, 8)` — the center of the first cell.

These two methods are inverses. They handle all tile sizes and grid configurations automatically, including isometric and hexagonal grids.

---

### Example: Fill a Rectangle with Ground Tiles

A basic building block — fill a rectangular region with a specific tile.

```csharp
public partial class LevelGenerator : Node2D
{
    [Export] private TileMapLayer _groundLayer;

    public override void _Ready()
    {
        FillRect(new Vector2I(0, 8), new Vector2I(19, 9), sourceId: 0, atlasCoords: new Vector2I(1, 0));
    }

    private void FillRect(Vector2I topLeft, Vector2I bottomRight, int sourceId, Vector2I atlasCoords)
    {
        for (int x = topLeft.X; x <= bottomRight.X; x++)
        {
            for (int y = topLeft.Y; y <= bottomRight.Y; y++)
            {
                _groundLayer.SetCell(new Vector2I(x, y), sourceId, atlasCoords);
            }
        }
    }
}
```

This places a 20×2 strip of ground tiles at the bottom of a screen-sized area. Simple, but it's the foundation for every procedural technique below.

---

### Example: Cellular Automaton Cave Generation

Cellular automata produce organic-looking cave layouts from random noise. The algorithm:

1. Fill every cell randomly — roughly 45% wall, 55% empty.
2. Run several smoothing passes. In each pass, a cell becomes a wall if 5 or more of its 8 neighbors are walls. Otherwise it becomes empty.
3. After 4–5 passes, random noise solidifies into smooth, cave-like blobs.

```csharp
public partial class CaveGenerator : Node2D
{
    [Export] private TileMapLayer _wallLayer;
    [Export] private Vector2I _mapSize = new Vector2I(60, 34);
    [Export] private int _smoothPasses = 4;
    [Export(PropertyHint.Range, "0.0,1.0")] private float _wallChance = 0.45f;

    private int _sourceId = 0;
    private Vector2I _wallAtlas = new Vector2I(0, 0);  // your wall tile's atlas coords

    public override void _Ready()
    {
        bool[,] map = GenerateCave();
        PaintMap(map);
    }

    private bool[,] GenerateCave()
    {
        var random = new RandomNumberGenerator();
        random.Randomize();

        // Step 1: random fill
        bool[,] map = new bool[_mapSize.X, _mapSize.Y];
        for (int x = 0; x < _mapSize.X; x++)
        {
            for (int y = 0; y < _mapSize.Y; y++)
            {
                // Edges are always walls to seal the cave
                bool isEdge = x == 0 || y == 0 || x == _mapSize.X - 1 || y == _mapSize.Y - 1;
                map[x, y] = isEdge || random.Randf() < _wallChance;
            }
        }

        // Step 2: smooth
        for (int pass = 0; pass < _smoothPasses; pass++)
        {
            bool[,] next = new bool[_mapSize.X, _mapSize.Y];
            for (int x = 1; x < _mapSize.X - 1; x++)
            {
                for (int y = 1; y < _mapSize.Y - 1; y++)
                {
                    int neighbors = CountWallNeighbors(map, x, y);
                    next[x, y] = neighbors >= 5;
                }
            }
            // Keep edges as walls
            for (int x = 0; x < _mapSize.X; x++)
            {
                next[x, 0] = true;
                next[x, _mapSize.Y - 1] = true;
            }
            for (int y = 0; y < _mapSize.Y; y++)
            {
                next[0, y] = true;
                next[_mapSize.X - 1, y] = true;
            }
            map = next;
        }

        return map;
    }

    private int CountWallNeighbors(bool[,] map, int cx, int cy)
    {
        int count = 0;
        for (int x = cx - 1; x <= cx + 1; x++)
        {
            for (int y = cy - 1; y <= cy + 1; y++)
            {
                if (x == cx && y == cy) continue;
                if (map[x, y]) count++;
            }
        }
        return count;
    }

    private void PaintMap(bool[,] map)
    {
        for (int x = 0; x < _mapSize.X; x++)
        {
            for (int y = 0; y < _mapSize.Y; y++)
            {
                if (map[x, y])
                {
                    _wallLayer.SetCell(new Vector2I(x, y), _sourceId, _wallAtlas);
                }
                else
                {
                    _wallLayer.EraseCell(new Vector2I(x, y));
                }
            }
        }
    }
}
```

Each run produces a different cave. Tweak `_wallChance` and `_smoothPasses` to control density and smoothness. Lower wall chance = more open space. More passes = smoother walls.

To make the cave visually polished, combine this with the terrain system from section 11.4 — after generating the boolean map, use `SetCellsTerrainConnect()` instead of `SetCell()` so Godot auto-selects the correct edge and corner tile variants.

---

### Example: Breakable Blocks

Tiles you can destroy — crates, cracked walls, ice blocks. The idea: detect a hit on a tile cell, erase it.

```csharp
public partial class BreakableBlockHandler : Node2D
{
    [Export] private TileMapLayer _breakableLayer;

    /// <summary>
    /// Call this when something hits a world position (bullet impact, melee swing, etc.)
    /// </summary>
    public void HitAt(Vector2 globalPos)
    {
        Vector2I cell = _breakableLayer.LocalToMap(_breakableLayer.ToLocal(globalPos));

        // Check if there's a tile here
        if (_breakableLayer.GetCellSourceId(cell) == -1) return;

        // Optional: read custom data to check if this tile is actually breakable
        TileData data = _breakableLayer.GetCellTileData(cell);
        if (data == null) return;

        bool isBreakable = data.GetCustomData("breakable").AsBool();
        if (!isBreakable) return;

        // Remove the tile
        _breakableLayer.EraseCell(cell);

        // Spawn particle effect, play sound, drop item, etc.
        SpawnBreakEffect(_breakableLayer.ToGlobal(_breakableLayer.MapToLocal(cell)));
    }

    private void SpawnBreakEffect(Vector2 position)
    {
        // Your particle/sound logic here
    }
}
```

The key pattern: convert a world-space hit position to grid coordinates with `LocalToMap()`, read the tile's custom data to confirm it's breakable, then `EraseCell()` to remove it. Custom data layers (added in the TileSet editor under **Custom Data**) let you mark only certain tiles as breakable without maintaining a separate list.

**Tip:** Put breakable blocks on their own `TileMapLayer` so erasing them doesn't affect the permanent terrain. You can even save the breakable layer's state (using `GetUsedCells()`) to restore destroyed blocks when the player revisits the room.

---

### Example: Building System (Place on Click)

Let the player place tiles by clicking — a building or crafting mechanic.

```csharp
public partial class BuildingSystem : Node2D
{
    [Export] private TileMapLayer _buildLayer;
    [Export] private int _sourceId = 0;
    [Export] private Vector2I _wallAtlas = new Vector2I(3, 0);
    [Export] private Camera2D _camera;

    private bool _buildMode = false;

    public override void _UnhandledInput(InputEvent @event)
    {
        if (Input.IsActionJustPressed("toggle_build"))
        {
            _buildMode = !_buildMode;
        }

        if (!_buildMode) return;

        if (@event is InputEventMouseButton mouse && mouse.Pressed)
        {
            Vector2 worldPos = GetGlobalMousePosition();
            Vector2I cell = _buildLayer.LocalToMap(_buildLayer.ToLocal(worldPos));

            if (mouse.ButtonIndex == MouseButton.Left)
            {
                // Place tile if cell is empty
                if (_buildLayer.GetCellSourceId(cell) == -1)
                {
                    _buildLayer.SetCell(cell, _sourceId, _wallAtlas);
                }
            }
            else if (mouse.ButtonIndex == MouseButton.Right)
            {
                // Remove tile
                _buildLayer.EraseCell(cell);
            }
        }
    }
}
```

Left-click places a wall tile, right-click removes it. The check `GetCellSourceId(cell) == -1` prevents placing on top of existing tiles. A real building system would add inventory checks, placement validation (can't build in mid-air), preview ghosts, and snap-to-grid visual feedback — but the tile manipulation core is always `SetCell()` and `EraseCell()`.

---

### GetCellTileData and Custom Data Layers

We've used `GetCellTileData()` in several examples. It deserves a focused look because custom data layers are how you attach game logic to tiles without subclassing or external lookups.

**Setting up custom data layers:**

1. Open the TileSet resource in the Inspector.
2. Scroll to **Custom Data Layers** → **Add Element**.
3. Name the layer (e.g., "surface", "damage", "breakable", "slow_factor").
4. Set the type (String, Bool, Int, Float, etc.).

**Assigning values per tile:**

In the TileSet editor, select a tile. In the **Custom Data** section of the properties panel, set values for each custom data layer. A grass tile might have `surface = "grass"`. A spike tile might have `damage = 10`. A crate tile might have `breakable = true`.

**Reading in code:**

```csharp
TileData data = tileMapLayer.GetCellTileData(cell);
if (data != null)
{
    string surface = data.GetCustomData("surface").AsString();
    int damage = data.GetCustomData("damage").AsInt32();
    float slowFactor = data.GetCustomData("slow_factor").AsSingle();
    bool breakable = data.GetCustomData("breakable").AsBool();
}
```

`GetCustomData()` returns a `Variant`. Use the appropriate `As*()` method to convert it. If the custom data layer exists but the tile doesn't have a value set, you get the type's default (empty string, 0, false, etc.).

Custom data layers are defined on the TileSet and values are stored per tile definition — not per placed cell. Every instance of the same tile returns the same custom data. If you need per-cell state (e.g., a block with 3 HP that decreases as it's hit), track that in a `Dictionary<Vector2I, int>` in your script, not in tile data.

---

### Quick Reference

| Method | Purpose |
| --- | --- |
| `SetCell(coords, sourceId, atlasCoords, alternativeTile)` | Place a tile at grid coordinates |
| `EraseCell(coords)` | Remove the tile at grid coordinates |
| `GetCellSourceId(coords)` | Atlas source ID of the tile (-1 if empty) |
| `GetCellAtlasCoords(coords)` | Atlas position of the tile |
| `GetCellAlternativeTile(coords)` | Alternative tile ID |
| `GetCellTileData(coords)` | Full `TileData` resource (collision, custom data) |
| `GetUsedCells()` | All non-empty cell coordinates |
| `GetUsedCellsById(sourceId)` | Non-empty cells from a specific atlas source |
| `GetUsedRect()` | Bounding `Rect2I` of all placed tiles |
| `LocalToMap(localPos)` | Local `Vector2` → grid `Vector2I` |
| `MapToLocal(mapCoords)` | Grid `Vector2I` → local `Vector2` (cell center) |
| `SetCellsTerrainConnect(cells, terrainSet, terrain)` | Place tiles using terrain auto-resolution |
| `SetCellsTerrainPath(cells, terrainSet, terrain)` | Place tiles as a terrain path |
| `Clear()` | Remove all tiles from the layer |

---

## Chapter Summary

- **A TileMap is a grid of reusable tile cells** rendered efficiently as a single batch. In Godot 4.3+, use `TileMapLayer` nodes — the old `TileMap` node is deprecated. The **TileSet** resource is the palette; the **TileMapLayer** node is the canvas.
- **TileSet sources define your tiles.** Atlas sources slice a sprite sheet into a grid of tiles. Scene sources embed full scenes as tiles. Alternative tiles create lightweight variants (flipped, rotated, tinted) without duplicating texture data.
- **The editor's painting tools** — Paint, Eraser, Rectangle, Line, Bucket Fill — let you build levels quickly. Use Ctrl+Click to eyedrop, X/Y/Z to flip and rotate, and Patterns to stamp pre-built structures.
- **Terrain auto-tiling** eliminates manual tile selection. Define terrain sets with peering bits, and Godot picks the correct edge, corner, and fill variants as you paint. Use `SetCellsTerrainConnect()` for the same behavior in code.
- **Tile collision** is configured on the TileSet resource, not per placed cell. Add physics layers, draw collision shapes on individual tiles (full-tile rectangle shortcut for solid tiles, custom polygons for slopes), and use collision layers/masks from the same system as Chapter 10. Use **multiple physics layers** on one TileSet to separate solid ground from hazards from detection zones. Enable **One Way** on a tile's collision shape for jump-through platforms. Collision is efficient — shapes are defined once and reused, and the physics engine only activates geometry near active bodies.
- **Multiple TileMapLayer nodes** create depth — background behind the player, terrain the player walks on, foreground in front. Share one TileSet across all layers. Only the terrain layer needs collision. Control render order with scene tree position or Z-index.
- **Procedural tile placement** uses `SetCell()` and `EraseCell()` to manipulate the grid at runtime. Convert between world and grid coordinates with `LocalToMap()` and `MapToLocal()`. Read tile metadata with `GetCellTileData()` and custom data layers. This powers cave generation, breakable blocks, building systems, and any runtime level manipulation.

**Next up: Chapter 12 — Camera & Viewport.** Your levels are built with tiles, but the player can only see a small window of the world. Now let's control what that window shows — camera follow, screen bounds, zoom, split-screen, and viewport effects.
