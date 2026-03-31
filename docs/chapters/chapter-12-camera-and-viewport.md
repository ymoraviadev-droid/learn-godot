# Chapter 12: Camera & Viewport

---

## 12.1 Camera2D Setup and Following

Without a camera, Godot renders the world from the origin — a fixed window into coordinate space. If your player moves past the edge of the screen, they simply disappear off the side. The world is still there; the window isn't moving with the player.

`Camera2D` fixes this. It's a node that controls which part of the 2D world is visible on screen. Attach it to a moving node and the view follows. Position it manually and it acts as a fixed viewpoint. Every 2D game needs at least one.

### Creating a Camera

Add a `Camera2D` node to your scene. The most common setup is as a child of the player:

```
Player (CharacterBody2D)
├── Sprite2D
├── CollisionShape2D
└── Camera2D
```

When `Camera2D` is a child of a moving node, it inherits the parent's transform — as the player moves, the camera follows automatically. No code required for basic following behavior.

### Making the Camera Active

A scene can have multiple `Camera2D` nodes, but only one can be the **current** camera at a time. The current camera is the one that controls the viewport.

In the Inspector, check the **Enabled** property (it's on by default). If you have multiple cameras, the one marked as current takes control. To switch cameras at runtime:

```csharp
// Activate this camera
camera2D.MakeCurrent();

// Or check which camera is active
bool isActive = camera2D.IsCurrent();
```

If no camera is marked current, Godot uses the default viewport position (origin). First-time developers often forget to enable the camera and wonder why the view doesn't follow the player.

### Position Smoothing

By default, the camera snaps instantly to its target position — every frame, the view jumps to wherever the player is. This works, but it feels rigid. **Position smoothing** adds a gradual catch-up effect: the camera drifts toward the player instead of teleporting.

Enable it in the Inspector under **Position Smoothing → Enabled**. The **Speed** value (default 5.0) controls how fast the camera catches up. Lower values = more floaty lag. Higher values = snappier tracking.

```
Position Smoothing:
  Enabled: true
  Speed: 5.0     ← units per second of catch-up. Try 3.0 for floaty, 8.0 for snappy
```

Smoothing is applied every frame. The camera computes the difference between its current position and the target (the parent node's position) and moves a fraction of that distance. The result is a natural easing motion that feels polished even with zero code.

**Warning:** Position smoothing can cause the camera to lag behind during fast movement. If the player dashes or teleports, the camera takes a moment to catch up. This is usually desirable — it creates a sense of speed — but if you need instant camera repositioning (e.g., after a teleport), call `ResetSmoothing()`:

```csharp
// After teleporting the player
player.GlobalPosition = newPosition;
camera.ResetSmoothing();  // Camera snaps to the new position immediately
```

### Drag Margins

Drag margins create a "dead zone" in the center of the screen. The camera only moves when the player reaches the edge of this zone. Inside the zone, the player moves freely without the camera budging.

Enable **Drag → Horizontal Enabled** and **Drag → Vertical Enabled** in the Inspector. Then configure the margins:

| Property | What It Does |
| --- | --- |
| Drag Left Margin | How far left (0.0–1.0) the player can go before the camera follows |
| Drag Right Margin | How far right |
| Drag Top Margin | How far up |
| Drag Bottom Margin | How far down |

Values are fractions of the screen size. A left margin of 0.2 means the player can move into the leftmost 20% of the screen before the camera starts scrolling.

```
Drag:
  Horizontal Enabled: true
  Vertical Enabled: true
  Left Margin: 0.2
  Top Margin: 0.08
  Right Margin: 0.2
  Bottom Margin: 0.08
```

Drag margins are common in platformers where you want the player centered-ish but don't want the camera constantly in motion during small movements. The player can walk around a small area without the world sliding underneath them.

### Camera as Standalone Node

You don't have to parent the camera to the player. A standalone `Camera2D` can be positioned anywhere in the scene tree and controlled manually:

```csharp
public partial class CameraController : Camera2D
{
    [Export] private Node2D _target;

    public override void _Process(double delta)
    {
        if (_target != null)
        {
            GlobalPosition = _target.GlobalPosition;
        }
    }
}
```

This approach gives you more control — you can switch targets, offset the camera, or add custom logic between the target position and the camera position. Many games use a standalone camera that tracks a virtual "focus point" rather than the player directly, letting the camera lead slightly in the direction of movement.

### Leading the Camera

A nice polish trick: offset the camera slightly in the direction the player is facing. This shows more of the world ahead and less behind — the player sees where they're going.

```csharp
public partial class PlayerCamera : Camera2D
{
    [Export] private CharacterBody2D _player;
    [Export] private float _lookAheadDistance = 40.0f;
    [Export] private float _lookAheadSmoothing = 3.0f;

    private float _currentLookAhead = 0.0f;

    public override void _Process(double delta)
    {
        float targetLookAhead = 0.0f;
        if (_player.Velocity.X > 10)
            targetLookAhead = _lookAheadDistance;
        else if (_player.Velocity.X < -10)
            targetLookAhead = -_lookAheadDistance;

        _currentLookAhead = Mathf.Lerp(
            _currentLookAhead,
            targetLookAhead,
            (float)delta * _lookAheadSmoothing
        );

        Offset = new Vector2(_currentLookAhead, 0);
    }
}
```

The `Offset` property shifts the camera relative to its position without moving the node itself. Combined with position smoothing, the look-ahead drifts naturally as the player changes direction.

---

## 12.2 Camera Limits and Smoothing

### Why Limits Matter

Without limits, the camera follows the player everywhere — including past the edges of your level. If the player walks to the far left of a platformer level, the camera reveals the void beyond the tiles. Grey emptiness. Broken immersion.

Camera limits define a bounding rectangle that the view cannot leave. The camera stops scrolling when the viewport edge hits a limit, even if the player keeps moving.

### Setting Limits in the Inspector

`Camera2D` has four limit properties:

| Property | Default | What It Does |
| --- | --- | --- |
| Limit Left | -10000000 | Left edge of the camera boundary (pixels) |
| Limit Top | -10000000 | Top edge |
| Limit Right | 10000000 | Right edge |
| Limit Bottom | 10000000 | Bottom edge |

The defaults are intentionally huge — effectively no limits. Set them to your level's bounds:

```
Limit:
  Left: 0
  Top: 0
  Right: 1280    ← level width in pixels
  Bottom: 720    ← level height in pixels
```

For a tile-based level, calculate limits from the TileMap:

```csharp
public partial class LevelCamera : Camera2D
{
    [Export] private TileMapLayer _terrainLayer;

    public override void _Ready()
    {
        SetLimitsFromTileMap();
    }

    private void SetLimitsFromTileMap()
    {
        Rect2I usedRect = _terrainLayer.GetUsedRect();
        Vector2I tileSize = _terrainLayer.TileSet.TileSize;

        LimitLeft = usedRect.Position.X * tileSize.X;
        LimitTop = usedRect.Position.Y * tileSize.Y;
        LimitRight = (usedRect.Position.X + usedRect.Size.X) * tileSize.X;
        LimitBottom = (usedRect.Position.Y + usedRect.Size.Y) * tileSize.Y;
    }
}
```

`GetUsedRect()` returns the bounding rectangle of all placed tiles in grid coordinates. Multiply by the tile size to get pixel coordinates. Now the camera stops exactly at the level edges.

### Limit Smoothing

When the camera hits a limit, it stops abruptly by default — the smooth following cuts off and the camera sticks to the boundary. **Limit Smoothing** (under **Position Smoothing**) controls whether the camera eases into limits instead of snapping.

Enable **Limit Smoothed** in the Inspector. With this on, the camera decelerates as it approaches a limit rather than hitting a hard wall. This feels more natural, especially in games where the player frequently bumps against level edges.

### Smoothing Gotchas

Position smoothing and limits interact in surprising ways:

**The camera starts behind.** When a scene loads, the camera's logical position is at the target, but smoothing means it starts at its own position and drifts to the target over the first few frames. On the very first frame, the view might show a different part of the level before smoothly panning to the player. Fix this by calling `ResetSmoothing()` in `_Ready()` or `ForceUpdateScroll()`:

```csharp
public override void _Ready()
{
    // Snap camera to player position on scene load — no initial drift
    ResetSmoothing();
}
```

**Smoothing fights limits.** If the player is near a limit, the smoothed camera position might overshoot past the limit briefly before being clamped back. This shows as a subtle jitter at level edges. Reducing the smoothing speed or increasing the limit margins (adding a few pixels of padding) helps.

**Teleportation needs a reset.** As mentioned in 12.1, whenever the player teleports or the scene transitions, call `ResetSmoothing()` to prevent the camera from slowly panning across the entire level to reach the new position.

---

## 12.3 Camera Zoom and Shake Effects

### Camera Zoom

`Camera2D` has a `Zoom` property — a `Vector2` that scales the view. The default `Vector2(1, 1)` is 1:1 pixel mapping. Zooming in shows a smaller area at larger scale. Zooming out shows more of the world at smaller scale.

```csharp
// Zoom in — show less of the world, things look bigger
camera.Zoom = new Vector2(2, 2);  // 2× zoom

// Zoom out — show more of the world, things look smaller
camera.Zoom = new Vector2(0.5f, 0.5f);  // half zoom

// Reset to default
camera.Zoom = new Vector2(1, 1);
```

**Important:** Higher `Zoom` values zoom IN (counterintuitive if you're thinking of "zoom level" as distance). `Zoom = (2, 2)` means each game pixel takes up 2 screen pixels — the view is magnified.

### Smooth Zoom Transitions

Jumping between zoom levels feels jarring. Tween the zoom for smooth transitions:

```csharp
public void ZoomTo(Vector2 targetZoom, float duration = 0.5f)
{
    var tween = CreateTween();
    tween.TweenProperty(this, "zoom", targetZoom, duration)
         .SetEase(Tween.EaseType.InOut)
         .SetTrans(Tween.TransitionType.Cubic);
}

// Usage
ZoomTo(new Vector2(1.5f, 1.5f));  // smooth zoom in
ZoomTo(new Vector2(1, 1));         // smooth zoom back to default
```

Common uses for zoom: zooming in during dialogue or cutscenes, zooming out to show a large boss arena, dynamically adjusting zoom based on player speed (racing games zoom out as you go faster).

### Scroll Wheel Zoom (Debug / Editor Camera)

Useful during development — zoom in and out with the mouse wheel:

```csharp
public override void _UnhandledInput(InputEvent @event)
{
    if (@event is InputEventMouseButton mouse && mouse.Pressed)
    {
        float zoomStep = 0.1f;
        if (mouse.ButtonIndex == MouseButton.WheelUp)
        {
            Zoom += new Vector2(zoomStep, zoomStep);
        }
        else if (mouse.ButtonIndex == MouseButton.WheelDown)
        {
            Zoom -= new Vector2(zoomStep, zoomStep);
            // Prevent zooming out too far
            Zoom = new Vector2(Mathf.Max(Zoom.X, 0.1f), Mathf.Max(Zoom.Y, 0.1f));
        }
    }
}
```

### Camera Shake

Screen shake is one of the most impactful "juice" effects in games. An explosion, a heavy landing, taking damage — a brief camera shake sells the impact.

The basic approach: offset the camera by a random amount each frame, decaying over time.

```csharp
public partial class ShakeableCamera : Camera2D
{
    private float _shakeStrength = 0.0f;
    private float _shakeFade = 5.0f;  // how fast the shake decays

    public override void _Process(double delta)
    {
        if (_shakeStrength > 0.1f)
        {
            Offset = new Vector2(
                (float)GD.RandRange(-_shakeStrength, _shakeStrength),
                (float)GD.RandRange(-_shakeStrength, _shakeStrength)
            );
            _shakeStrength = Mathf.Lerp(_shakeStrength, 0.0f, (float)delta * _shakeFade);
        }
        else
        {
            _shakeStrength = 0.0f;
            Offset = Vector2.Zero;
        }
    }

    /// <summary>
    /// Trigger a screen shake.
    /// strength: maximum pixel offset (try 8-16 for impacts)
    /// </summary>
    public void Shake(float strength)
    {
        _shakeStrength = Mathf.Max(_shakeStrength, strength);
    }
}
```

Call `Shake(12.0f)` when a bomb explodes. The camera jitters randomly, decaying smoothly back to center.

**Key details:**

- Use `Mathf.Max` when applying shake so multiple overlapping shakes don't cancel each other — the strongest wins.
- The fade rate (`_shakeFade`) controls how quickly the shake dies. Higher = shorter shake. Try 5.0 for a punchy hit, 2.0 for a sustained rumble.
- Reset `Offset` to `Vector2.Zero` when shake ends — otherwise the camera stays slightly off-center.

### Noise-Based Shake

Random `GD.RandRange` produces a harsh, jittery shake. For smoother, more organic shake (like an earthquake), use Perlin noise:

```csharp
public partial class NoiseShakeCamera : Camera2D
{
    private FastNoiseLite _noise = new FastNoiseLite();
    private float _shakeStrength = 0.0f;
    private float _shakeFade = 5.0f;
    private float _noiseTime = 0.0f;

    public override void _Ready()
    {
        _noise.NoiseType = FastNoiseLite.NoiseTypeEnum.Simplex;
        _noise.Frequency = 1.5f;
    }

    public override void _Process(double delta)
    {
        if (_shakeStrength > 0.1f)
        {
            _noiseTime += (float)delta * 30.0f;  // speed through the noise
            Offset = new Vector2(
                _noise.GetNoise2D(_noiseTime, 0) * _shakeStrength,
                _noise.GetNoise2D(0, _noiseTime) * _shakeStrength
            );
            _shakeStrength = Mathf.Lerp(_shakeStrength, 0.0f, (float)delta * _shakeFade);
        }
        else
        {
            _shakeStrength = 0.0f;
            Offset = Vector2.Zero;
        }
    }

    public void Shake(float strength)
    {
        _shakeStrength = Mathf.Max(_shakeStrength, strength);
    }
}
```

Noise-based shake produces smooth, wave-like motion instead of random jitter. The `Frequency` on the noise controls how "wavy" versus "twitchy" the shake feels.

---

## 12.4 Viewport and Resolution Settings

The viewport is the frame through which the player sees your game. Understanding how Godot handles resolution, scaling, and stretch modes is essential — especially if your game needs to look right on monitors ranging from 1280×720 to 3840×2160.

### What Is a Viewport?

Every Godot game has a root `Viewport` (specifically a `SubViewport` variant called the **main viewport**, accessible via `GetTree().Root`). The viewport is the canvas that all 2D and 3D rendering happens on. The `Camera2D` controls *which part* of the world is rendered into this viewport.

Think of it this way:

- **Viewport** = the TV screen (has a fixed resolution).
- **Camera2D** = the camera filming the scene (controls what you see on the TV).
- **Window** = the physical display (the monitor/OS window the game runs in).

The viewport renders at one resolution. The window might be a different size. Godot stretches (or doesn't stretch) the viewport to fill the window based on your project settings.

### Project Settings: Window Size

In **Project → Project Settings → Display → Window**:

| Setting | What It Does |
| --- | --- |
| Viewport Width | Base width of the game in pixels (default 1152) |
| Viewport Height | Base height of the game in pixels (default 648) |
| Window Width Override | Initial OS window width (can differ from viewport) |
| Window Height Override | Initial OS window height |
| Mode | Windowed, Minimized, Maximized, Fullscreen, Exclusive Fullscreen |
| Resizable | Whether the user can resize the window |

**Viewport Width/Height** is your game's **design resolution** — the resolution you author content for. If you make a pixel-art game designed for 320×180, set viewport to 320×180. If you're making an HD game, use 1920×1080.

**Window Width/Height Override** sets the actual OS window size. You can set the viewport to 320×180 but the window to 1280×720, and Godot scales the viewport up to fill the window.

### Stretch Mode

Under **Display → Window → Stretch**:

**Stretch Mode** controls how the viewport content maps to the window when they differ in size.

| Mode | Behavior |
| --- | --- |
| `disabled` | No stretching. The viewport renders at its base size in the top-left corner. If the window is larger, extra space is empty. If smaller, content is clipped. Rarely useful |
| `canvas_items` | 2D content (Control nodes, Sprite2D, TileMapLayer) scales to fill the window. Text and UI elements re-render at the window resolution, staying crisp. **Best for UI-heavy games and non-pixel-art 2D games** |
| `viewport` | The entire viewport renders at the base resolution, then the result is scaled as a single image to fill the window. This means 2D content is pixel-scaled — a 320×180 viewport upscaled to 1280×720 produces big, chunky pixels. **Best for pixel art** |

### Stretch Aspect

Controls what happens when the window's aspect ratio doesn't match the viewport's:

| Aspect | Behavior |
| --- | --- |
| `ignore` | Stretch to fill the window, distorting the image if aspect ratios differ. Characters look squished or stretched. Almost never what you want |
| `keep` | Scale uniformly, adding black bars (letterbox/pillarbox) to fill the remaining space. The game image is never distorted. **Safest default** |
| `keep_width` | Horizontal resolution stays fixed. Vertical resolution grows or shrinks to match the window. Taller windows see more of the world vertically. Good for vertical scrollers |
| `keep_height` | Vertical resolution stays fixed. Horizontal resolution changes. Wider windows see more horizontally. Good for horizontal platformers |
| `expand` | Like `keep`, but instead of adding black bars, the viewport expands to fill the window. Players on ultrawide monitors see more of the world. **Most flexible**, but you need to design your UI and gameplay to handle variable dimensions |

### Recommended Configurations

**Pixel-art platformer (320×180):**

```
Viewport Width: 320
Viewport Height: 180
Stretch Mode: viewport
Stretch Aspect: keep
```

The game renders at 320×180 and scales up with nearest-neighbor filtering. Crisp pixels at any window size.

**HD 2D game (1920×1080):**

```
Viewport Width: 1920
Viewport Height: 1080
Stretch Mode: canvas_items
Stretch Aspect: expand
```

UI stays crisp at any resolution. Players with wider or taller monitors see a bit more of the world.

**Mobile game (portrait, 720×1280):**

```
Viewport Width: 720
Viewport Height: 1280
Stretch Mode: canvas_items
Stretch Aspect: keep_width
```

Width stays consistent across devices. Taller phones see more vertical content.

### Checking Viewport Size at Runtime

```csharp
// The base viewport size (from project settings)
Vector2I baseSize = (Vector2I)ProjectSettings.GetSetting("display/window/size/viewport_width",
                                                          "display/window/size/viewport_height");

// The actual current viewport size (may differ if stretch mode is expand or window is resized)
Vector2 viewportSize = GetViewportRect().Size;

// The OS window size
Vector2I windowSize = DisplayServer.WindowGetSize();
```

`GetViewportRect().Size` is the most useful — it gives you the effective viewport dimensions after stretch calculations. Use it for UI positioning, spawn boundaries, and screen-space calculations.

---

## 12.5 Pixel-Perfect Rendering

Pixel art demands precision. A single misaligned pixel — a sprite sitting between two screen pixels, a tile edge off by half a pixel — creates visible blurring, shimmering, or inconsistent pixel sizes. Pixel-perfect rendering ensures every game pixel maps cleanly to one or more screen pixels with no sub-pixel artifacts.

### The Problem

Consider a pixel-art game at 320×180 displayed in a 1280×720 window. The scale factor is exactly 4× — each game pixel becomes a 4×4 block of screen pixels. This works perfectly. But if the window is 1366×768 (a common laptop resolution), the scale factor is 4.26875×. That's not an integer. Some game pixels map to 4 screen pixels, others to 5. The result: some pixels look bigger than others, lines shimmer as the camera scrolls, and the art looks subtly wrong.

### Step 1: Set Up Viewport Stretch Mode

```
Stretch Mode: viewport
Stretch Aspect: keep
```

`viewport` mode renders the game at the base resolution and then upscales the entire frame. This keeps all game pixels the same size relative to each other — no inconsistent scaling within the frame.

`keep` aspect adds black bars instead of distorting, so the pixel grid stays square.

### Step 2: Enable Snap 2D

In **Project Settings → Rendering → 2D → Snap**:

- **Snap 2D Transforms to Pixel**: `true`
- **Snap 2D Vertices to Pixel**: `true`

These ensure that all 2D node positions are rounded to whole pixel values before rendering. Without this, a sprite at position `(10.3, 5.7)` would render at a sub-pixel offset, causing the filtering system to blend neighboring pixels. With snapping, it renders at `(10, 6)` — clean and sharp.

### Step 3: Texture Filtering

By default, Godot uses linear filtering on textures — it interpolates between pixels when scaling, producing a blurry result. Pixel art needs **nearest-neighbor** filtering (no interpolation — each pixel is a hard square).

Set this globally in **Project Settings → Rendering → Textures → Canvas Textures → Default Texture Filter**: `Nearest`.

Or per-node: on any `CanvasItem` (Sprite2D, TileMapLayer, etc.), set **Texture → Filter** to `Nearest` in the Inspector.

### Step 4: Camera and Movement Considerations

**Camera smoothing with pixel snapping can cause jitter.** The camera smoothly follows the player at fractional positions, but snap rounds everything to integers. Each frame, the camera's rounded position might shift by 0 or 1 pixel, causing small but visible stutters.

Two approaches:

**1. Disable camera smoothing.** The camera snaps to the player's integer position every frame. No jitter, but the movement feels rigid.

**2. Use a sub-pixel offset trick.** Render the scene at double resolution and downsample, or use the camera's `Offset` to smooth out the rounding. This is more complex but preserves smooth motion.

For most pixel-art games, the simpler approach (no camera smoothing, snap everything) works well. Players expect a certain amount of snap in pixel art — it's part of the aesthetic.

### Step 5: Integer Scale Factor

For the cleanest results, ensure your window size is an exact integer multiple of your viewport size:

| Viewport | Window | Scale | Quality |
| --- | --- | --- | --- |
| 320×180 | 640×360 | 2× | Perfect |
| 320×180 | 960×540 | 3× | Perfect |
| 320×180 | 1280×720 | 4× | Perfect |
| 320×180 | 1920×1080 | 6× | Perfect |
| 320×180 | 1366×768 | 4.27× | Imperfect — some pixels larger than others |

You can enforce integer scaling by setting the initial window size to an exact multiple in the project settings. For fullscreen, black bars from `keep` aspect mode fill the gap, preserving integer scale for the game content.

### Pixel-Perfect Checklist

1. Viewport size matches your pixel art resolution (e.g., 320×180)
2. Stretch Mode: `viewport`
3. Stretch Aspect: `keep`
4. Default Texture Filter: `Nearest`
5. Snap 2D Transforms to Pixel: `true`
6. Snap 2D Vertices to Pixel: `true`
7. Window size is an integer multiple of viewport size (or fullscreen with bars)
8. Camera smoothing disabled or carefully managed
9. All art authored at 1:1 pixel scale — no high-res sprites in a low-res viewport

Follow this list and your pixel art renders exactly as drawn, at any display resolution.

---

## 12.6 Split-Screen Basics

Split-screen lets two or more players share the same display, each seeing their own view of the world. Godot handles this with `SubViewport` nodes — each viewport renders its own camera, and you compose them side by side in the UI layer.

### The Architecture

```
Root
├── HSplitView (HBoxContainer or custom Control)
│   ├── SubViewportContainer (left half)
│   │   └── SubViewport
│   │       └── World (the game scene, or a RemoteTransform2D target)
│   │           ├── TileMapLayers...
│   │           ├── Player1 (CharacterBody2D)
│   │           │   └── Camera2D
│   │           └── Player2
│   └── SubViewportContainer (right half)
│       └── SubViewport
│           └── (same or different world)
│               └── Camera2D following Player2
└── UI (CanvasLayer)
    └── HUD, menus, etc.
```

Each `SubViewport` has its own `Camera2D`. Player 1's camera follows Player 1. Player 2's camera follows Player 2. The `SubViewportContainer` nodes handle rendering each viewport's output as a texture on screen.

### Step-by-Step Setup

**Step 1: Create the layout.**

Add an `HBoxContainer` to your scene (for horizontal split) or a `VBoxContainer` (for vertical split). Inside it, add two `SubViewportContainer` nodes.

Set each `SubViewportContainer`'s **Stretch** property to `true` and give them equal **Size Flags → Horizontal → Expand** so they share the space evenly. For a horizontal split, each container takes up half the width.

**Step 2: Add SubViewports.**

Inside each `SubViewportContainer`, add a `SubViewport` node. Set its size to match half your game resolution. For a 1280×720 game with horizontal split:

- Left SubViewport: 640×720
- Right SubViewport: 640×720

Enable **Handle Input Locally** on each SubViewport if you need input events routed to the correct viewport.

**Step 3: Add the world.**

The simplest approach: put your game world inside one `SubViewport` and use `World2D` sharing so both viewports see the same world.

```csharp
// In _Ready() of the second SubViewport's script:
var mainViewport = GetNode<SubViewport>("../LeftViewport/SubViewport");
World2D = mainViewport.World2D;
```

Now both viewports render the same physics world, tile maps, and entities — but each from its own camera's perspective.

**Step 4: Add cameras.**

Each `SubViewport` needs its own `Camera2D`. Attach one to Player 1 in the first viewport, another to Player 2 (or a standalone camera) in the second viewport. Make each camera current within its own viewport.

### Handling Input

With split-screen, you need to route input correctly. Each player uses different input actions:

```
Input Map:
  p1_move_left  → A key
  p1_move_right → D key
  p1_jump       → W key

  p2_move_left  → Left arrow
  p2_move_right → Right arrow
  p2_jump       → Up arrow
```

Each player's script listens to its own action set. The input system doesn't care about viewports — actions are global. The split only affects rendering, not input.

### Gamepad Split-Screen

When using gamepads, each player naturally has their own device. Use `Input.GetJoyAxis()` and `Input.IsJoyButtonPressed()` with the device index to separate input:

```csharp
public partial class SplitScreenPlayer : CharacterBody2D
{
    [Export] private int _deviceIndex = 0;  // 0 for gamepad 1, 1 for gamepad 2

    public override void _PhysicsProcess(double delta)
    {
        float horizontal = Input.GetJoyAxis(_deviceIndex, JoyAxis.LeftX);
        bool jump = Input.IsJoyButtonPressed(_deviceIndex, JoyButton.A);

        // ... movement code using horizontal and jump ...
    }
}
```

### Performance Notes

Each `SubViewport` renders the world independently. Two viewports = roughly double the rendering cost. For most 2D games this is fine — 2D rendering is cheap. But keep it in mind for 3D split-screen or if you're already GPU-bound.

Culling helps: each camera only renders what's within its view. Two cameras looking at different parts of the level don't render the entire level twice — they each render their visible portion.

### Alternative: Dynamic Split/Merge

Some games (like *Lego* co-op games) use a single shared view when players are close together and split into separate viewports when they move apart. This is more complex — you need to dynamically enable/disable the split, adjust viewport sizes, and handle the transition — but it provides a smoother experience. The core technique is the same (`SubViewport` + `Camera2D`), just with runtime toggling and a custom divider line.

---

## Summary

This chapter covered `Camera2D` and the viewport system — how the player sees your game world.

**Camera2D basics (12.1):** Attach a `Camera2D` to your player for automatic following. Enable position smoothing for polished movement. Use drag margins for a dead zone. Use `Offset` for look-ahead effects.

**Limits and smoothing (12.2):** Set camera limits to prevent showing the void past level edges. Calculate limits from TileMap bounds automatically. Call `ResetSmoothing()` after teleports and scene loads.

**Zoom and shake (12.3):** Tween the `Zoom` property for smooth zoom transitions. Implement screen shake by randomly offsetting the camera and decaying the strength. Use noise-based shake for smoother, more organic motion.

**Viewport and resolution (12.4):** The viewport is your game's rendering canvas. Stretch Mode controls how the viewport maps to the window — `viewport` for pixel art, `canvas_items` for HD. Stretch Aspect controls how mismatched aspect ratios are handled — `keep` for safety, `expand` for flexibility.

**Pixel-perfect rendering (12.5):** Snap transforms and vertices to pixels. Use nearest-neighbor filtering. Render at your pixel-art resolution with viewport stretch mode. Ensure integer scale factors for clean upscaling.

**Split-screen (12.6):** Use `SubViewport` nodes with their own `Camera2D` instances to render multiple views. Share the `World2D` between viewports so they see the same game world. Route input through separate action sets or device indices.

---

## Quiz

**Question 1:** You create a `Camera2D` as a child of the player, but the view doesn't follow the player when you run the game. What's the most likely cause?

A) The camera's `Zoom` is set to `Vector2(0, 0)`
B) The camera is not set as the current camera (another camera is active, or Enabled is off)
C) The camera needs a `CollisionShape2D` child
D) The player's script must manually update the camera position

**Answer:** B. If another camera is current or Enabled is unchecked, this camera doesn't control the view.

---

**Question 2:** What does `ResetSmoothing()` do on a `Camera2D`?

A) Disables position smoothing permanently
B) Sets the smoothing speed to 0
C) Snaps the camera immediately to the target position, skipping the smooth interpolation
D) Resets the camera's Offset to Vector2.Zero

**Answer:** C. It eliminates the catch-up delay, useful after teleports or scene transitions.

---

**Question 3:** The player walks past the left edge of your level and the camera reveals empty grey space. How do you fix this?

A) Add more tiles beyond the level boundary
B) Set the camera's `Limit Left` property to the level's left edge in pixels
C) Reduce the camera's `Zoom` value
D) Enable `Drag Horizontal`

**Answer:** B. Camera limits constrain the view to stay within the level bounds.

---

**Question 4:** In `Camera2D`, `Zoom = new Vector2(2, 2)` does what?

A) Zooms out — shows twice as much of the world
B) Zooms in — shows half as much of the world, things appear bigger
C) Doubles the camera's movement speed
D) Sets the camera to 2× offset from the player

**Answer:** B. Higher zoom values magnify the view, showing a smaller area of the world.

---

**Question 5:** What is the difference between Stretch Mode `viewport` and `canvas_items`?

A) `viewport` renders at base resolution and scales the result as a single image; `canvas_items` re-renders UI elements at the window resolution for crisp text
B) `viewport` is for 3D games; `canvas_items` is for 2D games
C) They are identical — just different names
D) `viewport` adds black bars; `canvas_items` stretches to fill

**Answer:** A. `viewport` pixel-scales the entire frame (ideal for pixel art), while `canvas_items` scales the canvas but keeps UI text and Control nodes crisp.

---

**Question 6:** You're making a pixel-art game at 320×180. Which Stretch Aspect setting prevents the image from being distorted when the window is resized to a non-matching aspect ratio?

A) `ignore`
B) `expand`
C) `keep`
D) `canvas_items`

**Answer:** C. `keep` adds black bars (letterbox/pillarbox) to maintain the correct aspect ratio without distortion.

---

**Question 7:** Which two project settings must be enabled for pixel-perfect rendering to prevent sprites from rendering at sub-pixel positions?

A) `Snap 2D Transforms to Pixel` and `Snap 2D Vertices to Pixel`
B) `Vsync` and `Anti-Aliasing`
C) `Physics Interpolation` and `Jitter Fix`
D) `HDR` and `MSAA`

**Answer:** A. Both snapping settings round positions to whole pixels, preventing sub-pixel blurring.

---

**Question 8:** In a split-screen setup, how do two `SubViewport` nodes render the same game world?

A) Each viewport must contain its own complete copy of the game scene
B) They share the same `World2D` resource, so both see the same physics and rendering world
C) Split-screen is only possible with 3D viewports
D) You duplicate the entire scene tree into each viewport

**Answer:** B. Sharing `World2D` lets both viewports render the same world from different camera positions without duplicating nodes.

---

**Question 9:** How do you implement a smooth camera zoom transition?

A) Set `camera.Zoom` directly in `_Process()` each frame
B) Use `CreateTween()` to tween the `zoom` property over a duration with easing
C) Change the viewport resolution at runtime
D) Adjust the `Offset` property

**Answer:** B. Tweening the zoom property creates a smooth animated transition between zoom levels.

---

**Question 10:** You implement a screen shake effect that offsets the camera by random amounts. After the shake ends, the camera is slightly off-center. What did you forget?

A) To call `ResetSmoothing()` after the shake
B) To reset `Offset` back to `Vector2.Zero` when the shake strength reaches zero
C) To disable position smoothing during the shake
D) To set `Zoom` back to the default

**Answer:** B. If you don't explicitly reset `Offset` to zero after the shake decays, the last random offset remains applied.
