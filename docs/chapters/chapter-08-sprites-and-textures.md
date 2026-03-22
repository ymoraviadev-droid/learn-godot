# Chapter 8: Sprites & Textures

---

## 8.1 Importing Images and Assets

You can move a character, read input, and wire up signals. But right now your game probably looks like Godot's default icon sliding around the screen. It's time to make things look good.

### How Godot Handles Images

When you add an image file to your Godot project (by copying it into the project folder or dragging it into the FileSystem panel), Godot **imports** it automatically. The original file stays untouched — Godot creates an optimized `.import` version alongside it.

Supported image formats:
- **PNG** — lossless, supports transparency. The standard for 2D game art.
- **JPEG/JPG** — lossy, no transparency. Fine for backgrounds or photos, but avoid for pixel art or sprites with transparency.
- **WebP** — modern format, supports both lossy and lossless with transparency. Smaller file sizes than PNG.
- **SVG** — vector format. Godot rasterizes it on import. Useful for resolution-independent UI elements.

For 2D game art, **PNG is the default choice**. It's lossless, widely supported, and handles transparency well.

### Import Settings

When you select an image in the FileSystem panel, the **Import** dock appears (usually docked next to the Scene panel). Here you can adjust how Godot processes the image.

The most important settings for 2D:

**Filter Mode:**
- **Linear (default)** — smooths pixels when scaled. Good for high-resolution art.
- **Nearest** — preserves hard pixel edges. **Essential for pixel art.**

If you're making a pixel art game, you'll want to set the default filter to Nearest for the entire project:
**Project → Project Settings → Rendering → Textures → Canvas Textures → Default Texture Filter → Nearest**

This saves you from setting it on every single image.

**Repeat Mode:**
- **Disabled (default)** — the texture appears once.
- **Enabled** — the texture tiles/repeats. Useful for backgrounds and patterns.

**Mipmaps:**
- Leave disabled for 2D. Mipmaps are an optimization for 3D textures viewed at varying distances.

### Reimporting

After changing import settings, click **Reimport** (or Reimport All for project-wide changes). Godot regenerates the optimized version with the new settings.

### Where to Put Your Assets

A common project structure:

```
res://
├── assets/
│   ├── sprites/
│   │   ├── player/
│   │   ├── enemies/
│   │   └── items/
│   ├── tilesets/
│   ├── ui/
│   └── backgrounds/
├── scenes/
├── scripts/
└── audio/
```

Group assets by category. Avoid dumping everything in the root folder — it becomes unmanageable fast.

---

## 8.2 The Sprite2D Node

`Sprite2D` is the most basic node for displaying an image in 2D. You've already used it — in Chapter 5 we made one spin. Now let's understand it fully.

### Setting the Texture

There are three ways to assign an image to a Sprite2D:

1. **Drag and drop** — drag an image from the FileSystem panel onto the `Texture` property in the Inspector.
2. **Inspector** — click the `Texture` field → Load → browse to your image.
3. **Code:**

```csharp
public override void _Ready()
{
    var sprite = GetNode<Sprite2D>("Sprite2D");
    sprite.Texture = GD.Load<Texture2D>("res://assets/sprites/player.png");
}
```

### Key Properties

**Texture** — the image to display.

**Centered** — if `true` (default), the sprite's origin is at the center of the image. If `false`, the origin is at the top-left corner. Centered is usually what you want — it means `Position` refers to the center of the sprite.

**Offset** — shifts the sprite relative to its origin without moving the node. Useful for fine-tuning visual alignment without affecting collision shapes or other children.

**FlipH / FlipV** — mirrors the sprite horizontally or vertically. You'll use `FlipH` constantly for characters that face left or right:

```csharp
// Face the direction of movement
if (direction.X != 0)
{
    _sprite.FlipH = direction.X < 0;
}
```

**Hframes / Vframes** — splits the texture into a grid of frames. If your sprite sheet has 6 frames in a row, set `Hframes = 6`. Then use the `Frame` property to pick which frame to display. We'll use this more in section 8.5.

**Frame** — which frame to display (starting from 0). Only relevant when Hframes or Vframes is set.

### Sprite2D vs TextureRect

You might notice `TextureRect` in the Control node family also displays images. The difference:

- **Sprite2D** — a `Node2D`. Lives in the game world, affected by camera, physics, and transforms. Use for game objects.
- **TextureRect** — a `Control`. Lives in the UI layer, uses anchors and containers. Use for HUD elements, menu backgrounds, icons.

Don't use TextureRect for game objects, and don't use Sprite2D for UI.

---

## 8.3 Texture Regions and Atlas Textures

In real games, you rarely have one image per sprite. Art is often packed into larger **texture atlases** (also called sprite sheets) — a single image containing many smaller images arranged in a grid or packed layout.

### Why Use Atlases?

- **Performance** — the GPU can draw many sprites from one texture faster than switching between many separate textures. This is called **batching**.
- **Organization** — one file with all character frames is easier to manage than 30 separate PNGs.
- **Reduced memory** — fewer texture objects in video memory.

### Using Texture Regions

If your atlas isn't a uniform grid (frames are different sizes or packed irregularly), use a `Sprite2D` with a **region**:

1. Select the Sprite2D, set the `Texture` to your atlas image.
2. Enable **Region → Enabled** in the Inspector.
3. Click **Region** at the bottom of the editor — the texture region editor opens.
4. Draw a rectangle around the specific part of the atlas you want to display.

From code:

```csharp
var sprite = new Sprite2D();
sprite.Texture = GD.Load<Texture2D>("res://assets/tileset.png");
sprite.RegionEnabled = true;
sprite.RegionRect = new Rect2(0, 0, 32, 32);  // top-left 32x32 area
```

### AtlasTexture Resource

An alternative approach is creating an `AtlasTexture` resource. This wraps a region of a larger texture into its own texture resource that can be used anywhere a `Texture2D` is expected:

```csharp
var atlas = new AtlasTexture();
atlas.Atlas = GD.Load<Texture2D>("res://assets/sprites/characters.png");
atlas.Region = new Rect2(64, 0, 32, 32);  // second 32x32 frame

var sprite = GetNode<Sprite2D>("Sprite2D");
sprite.Texture = atlas;
```

You can also create AtlasTexture resources in the editor: right-click in FileSystem → New Resource → AtlasTexture.

### Uniform Grid Sprite Sheets

For sprite sheets where every frame is the same size and arranged in a grid, you don't need regions at all. Use `Hframes` and `Vframes` on the Sprite2D:

```
Sprite sheet layout (4 columns × 2 rows):
┌────┬────┬────┬────┐
│ 0  │ 1  │ 2  │ 3  │
├────┼────┼────┼────┤
│ 4  │ 5  │ 6  │ 7  │
└────┴────┴────┴────┘
```

Set `Hframes = 4`, `Vframes = 2`, and then `Frame = 3` displays the fourth frame (top-right). This is simpler than regions and is the standard approach for character animation sheets.

---

## 8.4 Flipping, Scaling, and Modulating Sprites

### Flipping

We've seen `FlipH` and `FlipV`. A common pattern for 2D characters:

```csharp
public override void _PhysicsProcess(double delta)
{
    Vector2 direction = Input.GetVector("move_left", "move_right", "move_up", "move_down");

    if (direction.X != 0)
    {
        _sprite.FlipH = direction.X < 0;
    }

    Velocity = direction * Speed;
    MoveAndSlide();
}
```

The `direction.X != 0` check prevents the sprite from resetting to face right when the player stops moving — it keeps the last facing direction.

**Important:** `FlipH` only flips the visual. It does not flip collision shapes, raycasts, or child node positions. If your character has a sword hitbox offset to the right, flipping the sprite won't move it to the left. You'll need to handle that separately (usually by also flipping the `Scale.X` of the parent node or repositioning children).

### Scaling

Sprites inherit `Scale` from `Node2D`. You can scale uniformly or non-uniformly:

```csharp
// Double size
Scale = new Vector2(2, 2);

// Stretch horizontally
Scale = new Vector2(2, 1);

// Flip using negative scale (alternative to FlipH)
Scale = new Vector2(-1, 1);  // mirrors horizontally
```

Using negative `Scale.X` is an alternative to `FlipH` that **does** affect children — collision shapes, particles, and other child nodes will also flip. This is often more practical for complex characters:

```csharp
// This flips everything — sprite, collision, hitboxes
if (direction.X != 0)
{
    float facing = direction.X < 0 ? -1 : 1;
    Scale = new Vector2(facing, 1);
}
```

**Pixel art scaling tip:** When scaling pixel art, always use integer values (2, 3, 4) and make sure the filter is set to Nearest. Non-integer scaling (like 1.5) causes blurry, uneven pixels.

### Modulate (Color Tinting)

`Modulate` is inherited from `CanvasItem` and multiplies the sprite's colors by a given color. It's incredibly useful for visual feedback:

```csharp
// Tint red (damage flash)
Modulate = new Color(1, 0.3f, 0.3f);

// Return to normal
Modulate = Colors.White;

// 50% transparent
Modulate = new Color(1, 1, 1, 0.5f);

// Fully invisible
Modulate = new Color(1, 1, 1, 0);
```

The alpha channel (fourth value) controls transparency. This is a simple way to fade sprites in and out.

#### Damage Flash Pattern

A common game pattern — flash white or red when the player takes damage:

```csharp
public async void TakeDamage(int amount)
{
    _health -= amount;

    // Flash red
    _sprite.Modulate = new Color(1, 0.3f, 0.3f);

    await ToSignal(GetTree().CreateTimer(0.1), SceneTreeTimer.SignalName.Timeout);

    // Return to normal
    _sprite.Modulate = Colors.White;
}
```

`ToSignal` with a SceneTreeTimer is a clean way to wait for a short duration without blocking the game loop. We'll explore async patterns more in later chapters.

### SelfModulate vs Modulate

- **Modulate** — tints this node **and all its children**.
- **SelfModulate** — tints **only this node**, leaving children unaffected.

If you want to tint a character's sprite red without also tinting their name label or health bar (which are children), use `SelfModulate`.

### Z-Index (Draw Order)

By default, nodes draw in tree order — nodes lower in the tree draw on top. The `ZIndex` property overrides this:

```csharp
ZIndex = 0;   // default
ZIndex = 10;  // draws in front of nodes with lower ZIndex
ZIndex = -1;  // draws behind default nodes
```

**ZAsRelative** (default `true`) means the Z-index is relative to the parent. A child with `ZIndex = 1` draws in front of its siblings, but not necessarily in front of nodes outside its parent. Set `ZAsRelative = false` to use absolute Z ordering.

Common uses:
- Background elements: `ZIndex = -10`
- Ground items: `ZIndex = 0`
- Characters: `ZIndex = 1`
- Foreground effects: `ZIndex = 10`

In top-down games, you'll often set `YSortEnabled = true` on the parent node instead. This automatically sorts children by their Y position — nodes lower on screen draw in front, creating a natural depth effect.

---

## 8.5 AnimatedSprite2D — Sprite Sheet Animations

Static sprites are boring. Games need animation — characters running, enemies attacking, coins spinning. Godot offers two main approaches to 2D animation. In this section we cover `AnimatedSprite2D`, which is the simplest and best for sprite-based frame animations.

### AnimatedSprite2D vs AnimationPlayer

- **AnimatedSprite2D** — plays through a sequence of images (frames). Perfect for character sprites, animated items, and anything that uses sprite sheet art. Simpler to set up.
- **AnimationPlayer** — a timeline-based system that can animate *any* property on *any* node — position, color, visibility, audio, method calls. Far more powerful, but more complex. We'll cover it in Chapter 18.

For sprite animations (idle, walk, run, attack), `AnimatedSprite2D` is usually the right choice. For complex sequences that coordinate multiple nodes (camera shake + sound + particle + movement), use `AnimationPlayer`.

### Setting Up AnimatedSprite2D

1. Add an `AnimatedSprite2D` node to your scene.
2. In the Inspector, find the **Sprite Frames** property and click `<empty>` → **New SpriteFrames**.
3. Click the SpriteFrames resource to open the **SpriteFrames** editor at the bottom of the screen.

### The SpriteFrames Editor

The SpriteFrames editor has two panels:

**Left panel — Animation list:**
- A `default` animation is created automatically.
- Click the "Add Animation" button (paper icon) to create new ones.
- Name them descriptively: `idle`, `run`, `jump`, `fall`, `attack`, `death`.

**Right panel — Frames:**
- Add individual images by dragging them from the FileSystem.
- Or click the grid icon ("Add frames from Sprite Sheet") to import from a sprite sheet — you'll select the grid size and pick which frames to include.

**Animation settings (per animation):**
- **Speed (FPS)** — how fast the animation plays. 8-12 FPS is common for pixel art. 24+ for smoother art.
- **Loop** — whether the animation repeats. `idle` and `run` should loop. `death` usually shouldn't.

### Playing Animations from Code

```csharp
public partial class Player : CharacterBody2D
{
    private AnimatedSprite2D _animSprite;

    public override void _Ready()
    {
        _animSprite = GetNode<AnimatedSprite2D>("AnimatedSprite2D");
    }

    public override void _PhysicsProcess(double delta)
    {
        Vector2 direction = Input.GetVector("move_left", "move_right", "move_up", "move_down");

        if (direction != Vector2.Zero)
        {
            _animSprite.Play("run");
            _animSprite.FlipH = direction.X < 0;
        }
        else
        {
            _animSprite.Play("idle");
        }

        Velocity = direction * Speed;
        MoveAndSlide();
    }
}
```

### Key Methods and Properties

```csharp
_animSprite.Play("run");              // play animation by name
_animSprite.Play("run", 1.5f);        // play at 1.5x speed
_animSprite.PlayBackwards("run");     // play in reverse
_animSprite.Stop();                   // stop on current frame
_animSprite.Pause();                  // pause (resume with Play)

_animSprite.Animation;                // current animation name (StringName)
_animSprite.Frame;                    // current frame index
_animSprite.IsPlaying();              // is an animation currently playing?

_animSprite.SpeedScale = 2.0f;        // global speed multiplier
_animSprite.FlipH = true;             // mirror horizontally
_animSprite.FlipV = true;             // mirror vertically
```

### Signals

AnimatedSprite2D emits useful signals:

- **`AnimationFinished`** — fires when a non-looping animation completes. Use for attack animations, death sequences, etc.
- **`FrameChanged`** — fires every time the frame changes. Use for syncing effects to specific frames (e.g., play a footstep sound on frames 2 and 6 of the walk animation).
- **`AnimationChanged`** — fires when a different animation starts playing.

```csharp
public override void _Ready()
{
    _animSprite = GetNode<AnimatedSprite2D>("AnimatedSprite2D");
    _animSprite.AnimationFinished += OnAnimationFinished;
}

private void OnAnimationFinished()
{
    if (_animSprite.Animation == "attack")
    {
        _animSprite.Play("idle");
    }
    else if (_animSprite.Animation == "death")
    {
        QueueFree();
    }
}
```

### A Practical Animation State Pattern

As your character gets more animations, the `if/else` chain in `_PhysicsProcess` grows unwieldy. Here's a cleaner approach — a method that decides the animation based on state:

```csharp
public partial class Player : CharacterBody2D
{
    [Export] public float Speed = 200f;

    private AnimatedSprite2D _animSprite;
    private bool _isAttacking = false;

    public override void _Ready()
    {
        _animSprite = GetNode<AnimatedSprite2D>("AnimatedSprite2D");
        _animSprite.AnimationFinished += OnAnimationFinished;
    }

    public override void _PhysicsProcess(double delta)
    {
        if (!_isAttacking)
        {
            HandleMovement();
        }
        UpdateAnimation();
    }

    public override void _UnhandledInput(InputEvent @event)
    {
        if (@event.IsActionPressed("attack") && !_isAttacking)
        {
            _isAttacking = true;
            GetViewport().SetInputAsHandled();
        }
    }

    private void HandleMovement()
    {
        Vector2 direction = Input.GetVector("move_left", "move_right", "move_up", "move_down");

        if (direction.X != 0)
        {
            _animSprite.FlipH = direction.X < 0;
        }

        Velocity = direction * Speed;
        MoveAndSlide();
    }

    private void UpdateAnimation()
    {
        if (_isAttacking)
        {
            PlayIfNotCurrent("attack");
            return;
        }

        if (Velocity.Length() > 0)
        {
            PlayIfNotCurrent("run");
        }
        else
        {
            PlayIfNotCurrent("idle");
        }
    }

    private void PlayIfNotCurrent(string animName)
    {
        if (_animSprite.Animation != animName)
        {
            _animSprite.Play(animName);
        }
    }

    private void OnAnimationFinished()
    {
        if (_animSprite.Animation == "attack")
        {
            _isAttacking = false;
        }
    }
}
```

Key design decisions:

- **`PlayIfNotCurrent`** — calling `Play("run")` every frame would restart the animation from frame 0. This helper only calls `Play` when switching to a different animation.
- **`_isAttacking` flag** — attack blocks movement and overrides the animation until it finishes. The `AnimationFinished` signal clears the flag.
- **`UpdateAnimation` is separate from movement** — this keeps animation logic clean and easy to extend. Adding a `jump` or `hurt` animation means adding one more condition.

This isn't a full state machine yet (we'll build one in Chapter 24), but it's a solid pattern for simple characters.

---

## 8.6 Organizing Art Assets

As your project grows, a clear asset structure prevents chaos.

### Folder Structure

```
res://assets/
├── sprites/
│   ├── player/
│   │   ├── idle.png
│   │   ├── run.png
│   │   └── attack.png
│   ├── enemies/
│   │   ├── slime/
│   │   │   ├── slime_idle.png
│   │   │   └── slime_walk.png
│   │   └── skeleton/
│   │       ├── skeleton_idle.png
│   │       └── skeleton_attack.png
│   └── items/
│       ├── coin.png
│       ├── heart.png
│       └── key.png
├── tilesets/
│   ├── grass_tileset.png
│   └── dungeon_tileset.png
├── ui/
│   ├── buttons/
│   ├── icons/
│   └── fonts/
├── backgrounds/
│   ├── sky.png
│   └── mountains.png
└── effects/
    ├── explosion.png
    └── dust.png
```

### Naming Conventions

Pick a convention and stick to it:

- **snake_case** for file names: `player_idle.png`, `slime_walk.png`
- **Descriptive names**: `player_run_spritesheet.png` is better than `sprite2.png`
- **Consistent prefixes**: all slime assets start with `slime_`, all player assets start with `player_`

### Working with Free Assets

When learning, you don't need to create your own art. Great free asset sources:

- **Kenney.nl** — massive library of high-quality free game assets (CC0 license).
- **OpenGameArt.org** — community-contributed game art.
- **itch.io** — search for free asset packs (filter by "Free" and "Assets").

When downloading asset packs:

1. Place them in a subfolder under `assets/` — don't scatter files across the project.
2. Check the license. CC0 means use freely. CC-BY means credit the author. Some assets restrict commercial use.
3. Keep the original file names from the pack if possible — it makes finding specific assets in the documentation easier.

### Import Presets

If you're making a pixel art game, you'll want Nearest filtering on every image. Instead of setting it one by one:

1. Select an image → set the import settings how you want.
2. Click the **Preset** dropdown at the top of the Import dock → **Save Current as Default for 'Texture2D'**.

Now every new image you add uses those settings automatically.

---

## 8.7 Exercise: Coin Runner

Time to put everything together. We'll build a small game that uses concepts from Chapters 1–8: scenes, nodes, scripts, signals, input, and sprites. The player runs across a floor, collects coins, reaches a finish zone, and sees their score.

The game is intentionally simple — the goal is practicing scene decoupling, signals, and clean project structure. Every scene is self-contained. No scene knows about any other scene's internals.

### Getting the Assets

We'll use **Kenney's "New Platformer Pack"** — a free, high-quality asset pack.

Download it from: https://kenney.nl/assets/new-platformer-pack

**About the license:** Kenney's assets are released under **CC0 (Creative Commons Zero)**. This means you can use them for anything — personal, commercial, modify, redistribute — with no restrictions and no credit required. That said, Kenney creates an incredible amount of free resources for the game development community. If you find his work useful, consider donating on his website to support his continued work.

After downloading, extract the pack and copy the images you need into your project under `res://assets/kenney/`.

We'll use these images from the pack:
- A player character sprite (e.g., `character_0000.png` or whichever you like)
- A coin sprite (e.g., `item_coin.png`)
- A ground/floor tile (e.g., `tile_0040.png` or any ground tile)

### Project Settings

1. Create a new Godot project (or use your existing one).
2. Set the texture filter to Nearest for pixel art: **Project → Project Settings → Rendering → Textures → Canvas Textures → Default Texture Filter → Nearest**.
3. Set up the Input Map (**Project → Project Settings → Input Map**):
   - `move_left` — A, Left Arrow
   - `move_right` — D, Right Arrow

### Folder Structure

```
res://
├── assets/
│   └── kenney/
│       ├── character_0000.png
│       ├── item_coin.png
│       └── tile_0040.png
├── scenes/
│   ├── main.tscn
│   ├── player.tscn
│   ├── coin.tscn
│   ├── finish_zone.tscn
│   └── hud.tscn
└── scripts/
    ├── Player.cs
    ├── Coin.cs
    ├── FinishZone.cs
    ├── HUD.cs
    └── Main.cs
```

Every game element is its own scene with its own script. The Main scene brings them together.

---

### Step 1: The Player Scene

Create a new scene. Root node: `CharacterBody2D`. Rename it to `Player`.

Add children:
```
Player (CharacterBody2D) — Player.cs
├── Sprite2D
└── CollisionShape2D
```

1. Set the `Sprite2D` texture to your character image from the Kenney pack.
2. Add a `RectangleShape2D` to the `CollisionShape2D` and size it to roughly match the character.
3. Save as `res://scenes/player.tscn`.

Attach a script to the Player node — `res://scripts/Player.cs`:

```csharp
using Godot;

public partial class Player : CharacterBody2D
{
    [Signal]
    public delegate void CoinCollectedEventHandler(int totalCoins);

    [Export] public float Speed = 300f;
    [Export] public float Gravity = 800f;

    private Sprite2D _sprite;
    private int _coinCount = 0;

    public override void _Ready()
    {
        _sprite = GetNode<Sprite2D>("Sprite2D");
    }

    public override void _PhysicsProcess(double delta)
    {
        // Apply gravity
        if (!IsOnFloor())
        {
            Velocity = new Vector2(Velocity.X, Velocity.Y + Gravity * (float)delta);
        }

        // Horizontal movement
        float horizontal = Input.GetAxis("move_left", "move_right");
        Velocity = new Vector2(horizontal * Speed, Velocity.Y);

        // Flip sprite to face movement direction
        if (horizontal != 0)
        {
            _sprite.FlipH = horizontal < 0;
        }

        MoveAndSlide();
    }

    public void CollectCoin()
    {
        _coinCount++;
        EmitSignal(SignalName.CoinCollected, _coinCount);
    }

    public int GetCoinCount()
    {
        return _coinCount;
    }
}
```

Notice: the Player doesn't know about the HUD, the coins, or the finish zone. It exposes a `CoinCollected` signal and a `CollectCoin()` method. That's it.

---

### Step 2: The Coin Scene

Create a new scene. Root node: `Area2D`. Rename it to `Coin`.

Add children:
```
Coin (Area2D) — Coin.cs
├── Sprite2D
└── CollisionShape2D
```

1. Set the `Sprite2D` texture to the coin image.
2. Add a `CircleShape2D` to the `CollisionShape2D` and size it to match the coin.
3. Save as `res://scenes/coin.tscn`.

Attach a script — `res://scripts/Coin.cs`:

```csharp
using Godot;

public partial class Coin : Area2D
{
    [Signal]
    public delegate void CollectedEventHandler();

    public override void _Ready()
    {
        BodyEntered += OnBodyEntered;
    }

    private void OnBodyEntered(Node2D body)
    {
        if (body is Player player)
        {
            player.CollectCoin();
            EmitSignal(SignalName.Collected);
            QueueFree();
        }
    }
}
```

The Coin detects when a body enters it. If it's a Player, it calls `CollectCoin()` on the player (direct reference downward — the coin knows a Player touched it), emits its own `Collected` signal (for anyone who might care — sound effects, particles, etc.), and destroys itself.

---

### Step 3: The Finish Zone Scene

Create a new scene. Root node: `Area2D`. Rename it to `FinishZone`.

Add children:
```
FinishZone (Area2D) — FinishZone.cs
├── Sprite2D (or ColorRect as a placeholder)
└── CollisionShape2D
```

1. For the visual, you can use a `ColorRect` with a green tint, or a flag sprite if your pack includes one. Make it tall enough to be visible.
2. Add a `RectangleShape2D` to the `CollisionShape2D`.
3. Save as `res://scenes/finish_zone.tscn`.

Attach a script — `res://scripts/FinishZone.cs`:

```csharp
using Godot;

public partial class FinishZone : Area2D
{
    [Signal]
    public delegate void PlayerFinishedEventHandler();

    public override void _Ready()
    {
        BodyEntered += OnBodyEntered;
    }

    private void OnBodyEntered(Node2D body)
    {
        if (body is Player)
        {
            EmitSignal(SignalName.PlayerFinished);
        }
    }
}
```

The FinishZone doesn't show a game over screen — it just announces that the player arrived. The Main scene decides what happens next.

---

### Step 4: The HUD Scene

Create a new scene. Root node: `CanvasLayer`. Rename it to `HUD`.

Add children:
```
HUD (CanvasLayer) — HUD.cs
├── CoinLabel (Label)
└── GameOverPanel (PanelContainer)
    └── VBoxContainer
        ├── GameOverLabel (Label)
        └── ScoreLabel (Label)
```

1. Position `CoinLabel` in the top-left corner. Set its text to `"Coins: 0"`. Make the font size large enough to read.
2. `GameOverPanel` — center it on screen using anchors (Anchor Preset: Center). Style it however you like.
3. `GameOverLabel` — set text to `"Game Over!"`, center-aligned, large font.
4. `ScoreLabel` — set text to `"Score: 0"`, center-aligned.
5. Set `GameOverPanel` **Visible** to `false` (hidden by default).
6. Save as `res://scenes/hud.tscn`.

Attach a script — `res://scripts/HUD.cs`:

```csharp
using Godot;

public partial class HUD : CanvasLayer
{
    private Label _coinLabel;
    private PanelContainer _gameOverPanel;
    private Label _scoreLabel;

    public override void _Ready()
    {
        _coinLabel = GetNode<Label>("CoinLabel");
        _gameOverPanel = GetNode<PanelContainer>("GameOverPanel");
        _scoreLabel = GetNode<Label>("GameOverPanel/VBoxContainer/ScoreLabel");
    }

    public void UpdateCoinCount(int count)
    {
        _coinLabel.Text = $"Coins: {count}";
    }

    public void ShowGameOver(int finalScore)
    {
        _scoreLabel.Text = $"Score: {finalScore}";
        _gameOverPanel.Visible = true;
    }
}
```

The HUD only knows how to display data. It has no idea where coins or scores come from. It exposes two public methods and that's it.

---

### Step 5: The Main Scene — Wiring Everything Together

Create a new scene. Root node: `Node2D`. Rename it to `Main`.

Build the level:

```
Main (Node2D) — Main.cs
├── Player (instance of player.tscn)
├── Floor (StaticBody2D)
│   ├── Sprite2D (or multiple Sprite2Ds tiled across)
│   └── CollisionShape2D
├── Coin1 (instance of coin.tscn)
├── Coin2 (instance of coin.tscn)
├── Coin3 (instance of coin.tscn)
├── FinishZone (instance of finish_zone.tscn)
└── HUD (instance of hud.tscn)
```

**Building the floor:**
1. Add a `StaticBody2D` node. Rename it to `Floor`.
2. Add a `CollisionShape2D` child with a `RectangleShape2D`. Make it wide (e.g., 2000×32 pixels) to span the level.
3. Add a `Sprite2D` child. Set the texture to the ground tile. Enable **Region** and set the region rect to cover the full width, or use `Texture Repeat → Enabled` to tile it.
4. Position the floor near the bottom of the viewport.

**Placing the objects:**
1. Instance `player.tscn` — place the player on the right side of the floor.
2. Instance `coin.tscn` three times — scatter the coins along the floor between the player start and the finish zone.
3. Instance `finish_zone.tscn` — place it on the left end of the floor.
4. Instance `hud.tscn`.

**Set the main scene:** **Project → Project Settings → Application → Run → Main Scene** → select `main.tscn`.

Save as `res://scenes/main.tscn`.

Now the important part — attach a script to Main that **wires the signals**:

`res://scripts/Main.cs`:

```csharp
using Godot;

public partial class Main : Node2D
{
    private Player _player;
    private FinishZone _finishZone;
    private HUD _hud;

    public override void _Ready()
    {
        _player = GetNode<Player>("Player");
        _finishZone = GetNode<FinishZone>("FinishZone");
        _hud = GetNode<HUD>("HUD");

        // Wire signals — Main is the "orchestrator"
        _player.CoinCollected += OnCoinCollected;
        _finishZone.PlayerFinished += OnPlayerFinished;
    }

    private void OnCoinCollected(int totalCoins)
    {
        _hud.UpdateCoinCount(totalCoins);
    }

    private void OnPlayerFinished()
    {
        _hud.ShowGameOver(_player.GetCoinCount());

        // Stop the player from moving
        _player.SetPhysicsProcess(false);
    }
}
```

**This is scene decoupling in action:**

- The **Player** emits `CoinCollected` — doesn't know the HUD exists.
- The **Coin** calls `player.CollectCoin()` — knows it touched a Player, nothing more.
- The **FinishZone** emits `PlayerFinished` — doesn't know what "game over" means.
- The **HUD** displays data — doesn't know where it comes from.
- The **Main** scene is the **orchestrator** — it knows all its children and wires them together. This is the only place where scenes "meet."

If you want to add a sound effect when a coin is collected, you add it in Main (connect to `CoinCollected`) or in the Coin scene itself. No other scene needs to change.

If you want to replace the HUD with a completely different UI, you swap the scene and update Main. The Player, Coins, and FinishZone don't care.

---

### Step 6: Build and Play

1. Build the project (Alt+B).
2. Run with F5.
3. Move left with A or Left Arrow to run toward the finish zone.
4. Collect coins along the way — the HUD updates.
5. Reach the green finish zone — "Game Over!" appears with your score.

### What You Practiced

| Concept | Chapter | Where in This Exercise |
|---|---|---|
| Nodes & scenes | 4 | Every game element is its own scene |
| Scripts & lifecycle | 5 | `_Ready()`, `_PhysicsProcess()`, `[Export]` |
| Signals | 6 | `CoinCollected`, `PlayerFinished`, `Collected`, `BodyEntered` |
| Input handling | 7 | `Input.GetAxis()` for movement |
| Sprites & textures | 8 | Kenney assets, `FlipH`, sprite setup |
| Scene decoupling | 4, 6 | Main as orchestrator, signals for communication |

### Challenges (Optional)

If you want to take it further:

- **Add a timer** — show elapsed time on the HUD. The faster you finish, the better.
- **Add more coins** — scatter 10-15 coins across the level.
- **Add a restart** — when the game is over, pressing a key restarts the scene (`GetTree().ReloadCurrentScene()`).
- **Add animation** — give the player an `AnimatedSprite2D` with `idle` and `run` animations instead of a static `Sprite2D`.
- **Add a coin spin** — make the coin an `AnimatedSprite2D` with a spinning animation.

---

## Summary

- **Godot auto-imports images** when you add them to the project. For pixel art, set the texture filter to **Nearest** (project-wide or per-image) to keep crisp pixels.
- **Sprite2D** displays a texture in the game world. Use `Centered`, `Offset`, `FlipH`, and `FlipV` to control how it appears. Don't confuse it with `TextureRect`, which is for UI.
- **Texture regions and atlases** let you display parts of a larger image. Use `Hframes`/`Vframes` for uniform grids, `RegionRect` for irregular atlases, or `AtlasTexture` resources for reusable sub-textures.
- **Flipping with `FlipH`** only affects the visual — not children or collision shapes. Use negative `Scale.X` when you need to flip everything.
- **Modulate** tints and fades sprites. White = normal, any color = tint, alpha = transparency. Use `SelfModulate` to tint only the node, not its children.
- **Z-Index** controls draw order. Use `YSortEnabled` on the parent for automatic top-down depth sorting.
- **AnimatedSprite2D** plays frame-by-frame animations using a `SpriteFrames` resource. Name animations clearly (`idle`, `run`, `attack`), set speed and loop, and control playback from code with `Play()`.
- **Use `PlayIfNotCurrent`** logic to avoid restarting animations every frame. Use the `AnimationFinished` signal to chain animations (attack → idle).
- **Organize assets** in a clear folder structure with consistent naming. Use free assets from Kenney.nl, OpenGameArt, or itch.io for learning.

**Next up: Chapter 9 — Movement & Physics.** You've got a character that looks good and animates. Now let's make it move properly — with collision detection, gravity, and physics bodies that interact with the world.
