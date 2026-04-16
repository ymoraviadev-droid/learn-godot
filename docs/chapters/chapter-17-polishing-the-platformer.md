# Chapter 17: Polishing the Platformer

---

## 17.1 HUD — Health, Lives, and Score Display

The player has HP, lives, collects crystals, and can die. But none of that is visible — there's no health display, no life counter, no score. The game works, but it doesn't *communicate*. Time to fix that.

A HUD (Heads-Up Display) is a UI layer that sits on top of the game world and shows the player critical information: how much health they have, how many lives remain, how many crystals they've collected. It doesn't scroll with the camera, doesn't interact with physics, and never moves.

### Why CanvasLayer?

The game camera follows the player. If you put UI nodes as children of the level scene, they'll scroll off-screen. `CanvasLayer` solves this — it renders its children on a separate canvas that ignores the camera transform. Layer 1 (or higher) draws on top of the game world.

Think of it like a transparent sheet of glass between you and the TV — the game scrolls behind it, but the HUD stays pinned in place.

### The Spritesheet

Kenney's UI pack includes a spritesheet with all the HUD elements we need: heart frames (full, half, empty), digit sprites (0–9), an "X" symbol, and character icons. It's one image file with everything laid out in a grid.

We *could* use the individual PNG files that Kenney also provides — one file per heart state, etc. But for hearts specifically, the spritesheet is one image, and Godot's `AtlasTexture` lets us slice out exactly the region we need from it. For digits (0–9), we'll use individual PNGs — they map naturally to an array index, so separate files are actually easier to work with.

### AtlasTexture — Cutting Sprites from a Sheet

An `AtlasTexture` is a texture that points to a rectangular region inside a larger image. You give it the full spritesheet and a pixel rectangle, and it returns just that portion as a usable texture.

To create one in the Inspector:

1. Select a `TextureRect` node.
2. In the `Texture` property, click the dropdown and choose **New AtlasTexture**.
3. Click the new `AtlasTexture` to expand its properties:
   - **Atlas:** assign your spritesheet image (`art/ui/hud_spritesheet.png`)
   - **Region:** the pixel rectangle of the sprite you want, e.g. `(0, 0, 18, 18)` for the top-left 18×18 sprite

You'll need to know the pixel coordinates of each sprite in your sheet. Open the spritesheet in any image editor and note the position and size of each element:

| Sprite | Region (example) |
| --- | --- |
| Heart full | `(0, 0, 18, 18)` |
| Heart half | `(18, 0, 18, 18)` |
| Heart empty | `(36, 0, 18, 18)` |
| Digit 0 | `(0, 18, 18, 18)` |
| Digit 1 | `(18, 18, 18, 18)` |
| ... | ... |
| Digit 9 | `(162, 18, 18, 18)` |
| X symbol | `(180, 18, 18, 18)` |
| Player icon | `(0, 36, 18, 18)` |

Your actual coordinates depend on how your spritesheet is laid out — these are examples. Measure yours.

**Creating AtlasTextures in code:**

```csharp
private AtlasTexture CreateAtlas(Texture2D sheet, Rect2 region)
{
    var atlas = new AtlasTexture();
    atlas.Atlas = sheet;
    atlas.Region = region;
    return atlas;
}
```

This is useful when you need to create textures dynamically — like updating digit sprites based on a changing number.

### Two Display Strategies

Before building the scene, you need to make a design decision. There are two ways to show a value like HP or lives, and the right choice depends on how large the number can get.

**Strategy A — Individual icons (best for 3 or fewer):**

Display one icon per unit. Three hearts for 3 HP. Two character sprites for 2 lives. Each icon shows the state directly — a full heart, a half heart, an empty heart. The player reads the state at a glance without counting.

```
♥ ♥ ♡        — 2 out of 3 HP (full, full, empty)
♥ ♥½ ♡       — 3 out of 6 HP with half-hearts (full, half, empty)
🧑 🧑 🧑      — 3 lives remaining
```

This is the classic approach from NES/SNES platformers. It works beautifully when the maximum is small — you see the state instantly. But it breaks down at higher numbers: ten hearts in a row is hard to count and eats screen space in a 320×180 viewport.

**Strategy B — Icon × number (best for more than 3):**

Display a single icon, the "X" sprite, and digit sprites for the count. One heart, an X, and the number 5 means 5 HP. Compact and scales to any number.

```
♥ × 5        — 5 HP
🧑 × 7        — 7 lives
```

This is the approach from games like Mega Man or Sonic. It uses fixed screen space regardless of the value.

**Which should you use?** It depends on your game:

- If your game has 3 HP and 3 lives (like our Crystal Caverns design document from Chapter 13), Strategy A is more expressive — half-hearts show partial damage, and the visual density is readable at a glance.
- If you want more HP or more lives (5+ of either), Strategy B keeps the HUD compact. Ten individual hearts would span half the viewport width.
- You can mix them — hearts for HP (Strategy A with half-hearts) and icon × number for lives (Strategy B), or vice versa.

We'll build both. Pick the one that fits your game, or combine them.

### HUD Scene Structure

The scene structure depends on which strategies you choose. Here's the full layout that supports both:

```
HUD (CanvasLayer)
└── MarginContainer
    ├── HealthDisplay (HBoxContainer)     — top-left
    ├── LivesDisplay (HBoxContainer)      — bottom-left
    └── ScoreColumn (VBoxContainer)       — top-right
        ├── ScoreContainer (HBoxContainer)
        │   ├── CrystalIcon (TextureRect)
        │   ├── XSymbol (TextureRect)
        │   └── Digits (HBoxContainer)
        └── CrystalRequirement (HBoxContainer)  — hidden by default
            ├── CrystalIcon (TextureRect)
            ├── Slash (TextureRect)
            └── RequiredDigits (HBoxContainer)
```

Save as `res://scenes/ui/hud.tscn`.

The children inside `HealthDisplay` and `LivesDisplay` depend on which strategy you use — we'll populate them in the script or in the editor depending on the approach. `ScoreColumn` is a `VBoxContainer` that stacks the score and crystal requirement vertically — `ScoreContainer` always shows (crystal + X + digits), and `CrystalRequirement` is hidden by default and only appears on levels that require a minimum crystal count (more on this below).

### MarginContainer — Keeping UI Off the Edges

The `MarginContainer` pushes all its children inward from the screen edges. Without it, icons would sit flush against the corner — cramped and hard to read.

```
Layout → Anchors Preset: Full Rect    — fills the entire screen
Theme Overrides → Constants:
  Margin Left:   4
  Margin Top:    4
  Margin Right:  4
  Margin Bottom: 4
```

4 pixels is enough for pixel art at 320×180 resolution. It's subtle but keeps the UI breathing.

### Score Display

Score uses the same icon × number pattern as Strategy B — a crystal icon, the X sprite, and digit images. Visually consistent with the rest of the HUD.

```
ScoreContainer (HBoxContainer)
├── CrystalIcon (TextureRect)
├── XSymbol (TextureRect)
└── Digits (HBoxContainer)
```

**CrystalIcon (TextureRect):**

Assign an `AtlasTexture` pointing to the crystal region in your spritesheet:

```
Stretch Mode: Keep
Custom Minimum Size: (18, 18)    — match your sprite size
```

**XSymbol (TextureRect):**

Same as in the health/lives multiplier displays — `AtlasTexture` pointing to the X region.

**Digits (HBoxContainer):**

Starts empty. The script populates it with digit `TextureRect` nodes dynamically at runtime. But first, the digit images need to exist in the project.

### Setting Up the Digit Images

Kenney's Pixel Platformer pack includes individual PNG files for each digit (0–9) and the X symbol. Find them in the pack — they're typically named something like `number_0.png` through `number_9.png` and `x.png` (exact names vary by pack version — check your download).

Copy these files into your project's UI art folder:

```
res://art/ui/
├── number_0.png
├── number_1.png
├── number_2.png
├── number_3.png
├── number_4.png
├── number_5.png
├── number_6.png
├── number_7.png
├── number_8.png
├── number_9.png
└── x.png
```

After copying, switch back to the Godot editor — it auto-imports new files in the `res://` directory. You should see them in the FileSystem dock.

**Assigning the digits to the HUD script:**

1. Select the `HUD` root node in the scene.
2. In the Inspector, find the `Digit Textures` property — it shows an array with 10 slots (0–9).
3. Expand the array. For each slot, drag the matching PNG from the FileSystem dock:
   - Slot 0 → `number_0.png`
   - Slot 1 → `number_1.png`
   - ... and so on through slot 9.

The index matches the digit — when the script needs to display "5", it reads `DigitTextures[5]`, which is `number_5.png`.

**The X symbol** is not part of the digit array. It's a separate `TextureRect` node (`XSymbol`) in the scene tree — assign `x.png` to its `Texture` property directly in the Inspector, either as a standalone texture or as an `AtlasTexture` region from the spritesheet.

The digit images and X symbol are used everywhere Strategy B appears: score display, HP multiplier, lives multiplier, and crystal requirement. Set them up once on the HUD scene, and every instance of the HUD across all levels shares the same assignments.

**ScoreColumn (VBoxContainer):**

```
Alignment: End
```

`Alignment: End` pushes the children to the right side. The `MarginContainer` parent handles screen-edge positioning.

**ScoreContainer (HBoxContainer):**

```
Theme Overrides → Constants:
  Separation: 2
```

### Crystal Requirement Display

In Chapter 15.5, the `ExitDoor` has a `RequiredCrystals` property — some levels lock the door until the player collects enough crystals. When a level has this requirement, the player needs to see how many crystals are left. When a level doesn't (requirement is 0), the display should be hidden entirely.

`CrystalRequirement` is already in the scene tree from above — it sits inside `ScoreColumn` directly below `ScoreContainer`. The `VBoxContainer` stacks them vertically so they don't overlap.

This shows the target: the current score is already visible in the `ScoreContainer` above, and this row shows what the player needs to reach. For example, if the door requires 5 crystals and the player has 2, the score shows `crystal × 2` and the requirement shows `crystal / 5`.

Alternatively, you can show remaining crystals: `crystal × 3` (3 left to collect). Pick whichever reads more naturally for your game.

**The key:** this element is only visible when the level's exit door has a non-zero crystal requirement.

The HUD needs to know the requirement at startup. Since the `ExitDoor` is a sibling in the level scene, the level script can pass the value to the HUD:

```csharp
// Add to Level.cs — in _Ready(), after setting up the HUD

var exitDoor = GetNodeOrNull<ExitDoor>("ExitDoor");
var hud = GetNode<HUD>("HUD");

if (exitDoor != null && exitDoor.RequiredCrystals > 0)
{
    hud.ShowCrystalRequirement(exitDoor.RequiredCrystals);
}
```

And in the HUD script:

```csharp
// Add to HUD.cs

private HBoxContainer _crystalRequirement;
private HBoxContainer _requiredDigits;
private int _requiredCrystals;

public void ShowCrystalRequirement(int required)
{
    _requiredCrystals = required;
    _crystalRequirement = GetNode<HBoxContainer>(
        "MarginContainer/ScoreColumn/CrystalRequirement");
    _requiredDigits = _crystalRequirement.GetNode<HBoxContainer>(
        "RequiredDigits");

    _crystalRequirement.Visible = true;
    UpdateDigits(_requiredDigits, required);
}
```

In `_Ready()`, hide it by default:

```csharp
GetNode<HBoxContainer>("MarginContainer/ScoreColumn/CrystalRequirement").Visible = false;
```

**Why not read the ExitDoor directly from the HUD?** The HUD is a reusable scene — it shouldn't know about level-specific nodes like `ExitDoor`. The level script acts as the middleman: it knows both the door and the HUD, and wires them together. This keeps the HUD generic and the coupling in one place.

If you want the display to update dynamically (e.g., showing remaining crystals that counts down as the player collects), subscribe to `ScoreChanged` and recalculate:

```csharp
private void UpdateCrystalRequirement(int currentScore)
{
    if (_requiredCrystals <= 0) return;

    int remaining = Mathf.Max(0, _requiredCrystals - currentScore);
    UpdateDigits(_requiredDigits, remaining);

    if (remaining == 0)
    {
        // Optional: hide or change color to signal "door unlocked"
        _crystalRequirement.Modulate = new Color(0.5f, 1f, 0.5f);
    }
}
```

Hook this up alongside the other signal subscriptions in `_Ready()` — but only after `ShowCrystalRequirement` has been called (otherwise `_requiredCrystals` is 0 and the method returns immediately, which is the correct default).

### Strategy A — Individual Hearts (≤ 3 HP)

For this approach, add `TextureRect` children directly in the editor:

```
HealthDisplay (HBoxContainer)
├── Heart1 (TextureRect)
├── Heart2 (TextureRect)
└── Heart3 (TextureRect)
```

Each `TextureRect` gets an `AtlasTexture` pointing to the full heart region of your spritesheet:

```
Texture: AtlasTexture → Atlas: hud_spritesheet.png, Region: (your full heart region)
Stretch Mode: Keep
Custom Minimum Size: (18, 18)    — match your heart sprite size
```

**HealthDisplay (HBoxContainer):**

```
Layout → Anchors Preset: Top Left
Theme Overrides → Constants:
  Separation: 2    — 2px gap between hearts
```

The script swaps each heart's `AtlasTexture` region based on current HP. With half-hearts, 6 max HP maps to 3 heart icons — each heart represents 2 HP:

```csharp
// Strategy A — individual hearts with full/half/empty states

[Export] public Texture2D Spritesheet { get; set; }
[Export] public Rect2 HeartFullRegion { get; set; }
[Export] public Rect2 HeartHalfRegion { get; set; }
[Export] public Rect2 HeartEmptyRegion { get; set; }

private TextureRect[] _hearts;

private void SetupHealthIcons()
{
    var container = GetNode<HBoxContainer>("MarginContainer/HealthDisplay");
    _hearts = new TextureRect[container.GetChildCount()];
    for (int i = 0; i < _hearts.Length; i++)
    {
        _hearts[i] = container.GetChild<TextureRect>(i);
    }
}

private void UpdateHealthIcons(int currentHealth)
{
    // Each heart represents 2 HP (full = 2, half = 1, empty = 0)
    for (int i = 0; i < _hearts.Length; i++)
    {
        int heartHp = currentHealth - (i * 2);

        Rect2 region;
        if (heartHp >= 2)
            region = HeartFullRegion;
        else if (heartHp == 1)
            region = HeartHalfRegion;
        else
            region = HeartEmptyRegion;

        _hearts[i].Texture = CreateAtlas(Spritesheet, region);
    }
}
```

**How half-hearts work:** If max HP is 6 and current HP is 5, the three hearts show: full (2), full (2), half (1). If current HP is 4: full, full, empty. If current HP is 3: full, half, empty. Each heart holds 2 HP, so the half state represents an odd remainder.

If you don't want half-hearts, set max HP to 3 (not 6) and remove the half-heart logic — each heart is simply full or empty:

```csharp
// Simpler version — no half-hearts, 1 HP per heart
private void UpdateHealthIcons(int currentHealth)
{
    for (int i = 0; i < _hearts.Length; i++)
    {
        Rect2 region = i < currentHealth ? HeartFullRegion : HeartEmptyRegion;
        _hearts[i].Texture = CreateAtlas(Spritesheet, region);
    }
}
```

### Strategy B — Icon × Number (> 3 HP or Lives)

For this approach, the container holds three elements: the icon, the X sprite, and a container for digit sprites:

```
HealthDisplay (HBoxContainer)
├── HeartIcon (TextureRect)      — single full heart
├── XSymbol (TextureRect)        — the "X" sprite
└── Digits (HBoxContainer)       ��� holds digit TextureRects
```

Kenney's pack includes individual PNG files for each digit (0–9). We export a `Texture2D` for each one and drag them into the Inspector — 10 slots, one per digit. The script looks up the right texture by index:

```csharp
// Strategy B — icon × number display

[Export] public Texture2D[] DigitTextures { get; set; } = new Texture2D[10];

private HBoxContainer _digitsContainer;

private void SetupMultiplierDisplay(string containerPath)
{
    _digitsContainer = GetNode<HBoxContainer>(
        $"MarginContainer/{containerPath}/Digits");
}

private void UpdateDigits(int value)
{
    // Clear old digits
    foreach (var child in _digitsContainer.GetChildren())
    {
        child.QueueFree();
    }

    // Convert value to digit string and create a TextureRect per digit
    string digits = value.ToString();
    foreach (char c in digits)
    {
        int digit = c - '0';
        var rect = new TextureRect();
        rect.Texture = DigitTextures[digit];
        rect.StretchMode = TextureRect.StretchModeEnum.Keep;
        _digitsContainer.AddChild(rect);
    }
}
```

In the Inspector, the `DigitTextures` array shows 10 slots. Drag `digit_0.png` into slot 0, `digit_1.png` into slot 1, and so on up to slot 9. The index matches the digit — `DigitTextures[3]` is the image for "3".

**Why sprite images instead of a Label?** Consistency. The heart, X, and digit images all come from the same art pack, so they share the same pixel style and weight. A `Label` with a font would look slightly different — different baseline, different anti-aliasing. For a pixel art HUD, sprite digits look cleaner.

That said, if you'd rather keep it simple, a `Label` works fine. Replace the `Digits` container and `UpdateDigits` method with a plain label and `label.Text = value.ToString()`. Pragmatism over perfection.

### Lives Display

Lives follow the exact same two strategies as HP. The only difference is the icon — a small player character sprite instead of a heart.

**Strategy A — Individual character icons (�� 3 lives):**

```
LivesDisplay (HBoxContainer)
├── Life1 (TextureRect)    — player icon from spritesheet
├── Life2 (TextureRect)
└── Life3 (TextureRect)
```

Show or hide icons based on remaining lives. Full opacity for remaining lives, low opacity (or a grayed-out region) for lost ones.

```csharp
private void UpdateLivesIcons(int currentLives)
{
    for (int i = 0; i < _lifeIcons.Length; i++)
    {
        _lifeIcons[i].Modulate = i < currentLives
            ? Colors.White
            : new Color(1, 1, 1, 0.2f);
    }
}
```

**Strategy B — Icon × number (> 3 lives):**

```
LivesDisplay (HBoxContainer)
├── PlayerIcon (TextureRect)
├── XSymbol (TextureRect)
└── Digits (HBoxContainer)
```

Same `UpdateDigits` pattern as HP — reuse the method with a different container path.

### Putting It Together — The Full HUD Script

Here's the complete script that supports both strategies. Pick the methods that match your design:

```csharp
using Godot;

public partial class HUD : CanvasLayer
{
    [Export] public Texture2D Spritesheet { get; set; }

    // Heart regions in the spritesheet
    [Export] public Rect2 HeartFullRegion { get; set; }
    [Export] public Rect2 HeartHalfRegion { get; set; }
    [Export] public Rect2 HeartEmptyRegion { get; set; }

    // Digit images (individual PNGs, one per digit 0-9)
    [Export] public Texture2D[] DigitTextures { get; set; } = new Texture2D[10];

    // Strategy A fields (individual icons)
    private TextureRect[] _heartIcons;
    private TextureRect[] _lifeIcons;

    // Strategy B fields (multiplier display)
    private HBoxContainer _healthDigits;
    private HBoxContainer _livesDigits;

    // Score (always uses multiplier display)
    private HBoxContainer _scoreDigits;

    public override void _Ready()
    {
        _scoreDigits = GetNode<HBoxContainer>(
            "MarginContainer/ScoreColumn/ScoreContainer/Digits");

        // --- Choose your setup per display ---
        // For HP, pick ONE:
        SetupHealthIcons();      // Strategy A
        // SetupHealthMultiplier(); // Strategy B

        // For lives, pick ONE:
        SetupLivesIcons();       // Strategy A
        // SetupLivesMultiplier(); // Strategy B

        // Initial state
        UpdateHealth(GameManager.Instance.PlayerHealth);
        UpdateLives(GameManager.Instance.Lives);
        UpdateScore(GameManager.Instance.Score);

        // Listen for changes
        GameManager.Instance.HealthChanged += UpdateHealth;
        GameManager.Instance.LivesChanged += UpdateLives;
        GameManager.Instance.ScoreChanged += UpdateScore;
    }

    public override void _ExitTree()
    {
        GameManager.Instance.HealthChanged -= UpdateHealth;
        GameManager.Instance.LivesChanged -= UpdateLives;
        GameManager.Instance.ScoreChanged -= UpdateScore;
    }

    // --- Health ---

    private void SetupHealthIcons()
    {
        var container = GetNode<HBoxContainer>(
            "MarginContainer/HealthDisplay");
        _heartIcons = new TextureRect[container.GetChildCount()];
        for (int i = 0; i < _heartIcons.Length; i++)
        {
            _heartIcons[i] = container.GetChild<TextureRect>(i);
        }
    }

    private void SetupHealthMultiplier()
    {
        _healthDigits = GetNode<HBoxContainer>(
            "MarginContainer/HealthDisplay/Digits");
    }

    private void UpdateHealth(int currentHealth)
    {
        if (_heartIcons != null)
        {
            // Strategy A — individual hearts
            for (int i = 0; i < _heartIcons.Length; i++)
            {
                int heartHp = currentHealth - (i * 2);
                Rect2 region;
                if (heartHp >= 2)
                    region = HeartFullRegion;
                else if (heartHp == 1)
                    region = HeartHalfRegion;
                else
                    region = HeartEmptyRegion;

                _heartIcons[i].Texture = CreateAtlas(Spritesheet, region);
            }
        }
        else if (_healthDigits != null)
        {
            // Strategy B — heart × number
            UpdateDigits(_healthDigits, currentHealth);
        }
    }

    // --- Lives ---

    private void SetupLivesIcons()
    {
        var container = GetNode<HBoxContainer>(
            "MarginContainer/LivesDisplay");
        _lifeIcons = new TextureRect[container.GetChildCount()];
        for (int i = 0; i < _lifeIcons.Length; i++)
        {
            _lifeIcons[i] = container.GetChild<TextureRect>(i);
        }
    }

    private void SetupLivesMultiplier()
    {
        _livesDigits = GetNode<HBoxContainer>(
            "MarginContainer/LivesDisplay/Digits");
    }

    private void UpdateLives(int currentLives)
    {
        if (_lifeIcons != null)
        {
            // Strategy A — individual character icons
            for (int i = 0; i < _lifeIcons.Length; i++)
            {
                _lifeIcons[i].Modulate = i < currentLives
                    ? Colors.White
                    : new Color(1, 1, 1, 0.2f);
            }
        }
        else if (_livesDigits != null)
        {
            // Strategy B — character × number
            UpdateDigits(_livesDigits, currentLives);
        }
    }

    // --- Score ---

    private void UpdateScore(int score)
    {
        UpdateDigits(_scoreDigits, score);
    }

    // --- Shared Helpers ---

    private AtlasTexture CreateAtlas(Texture2D sheet, Rect2 region)
    {
        var atlas = new AtlasTexture();
        atlas.Atlas = sheet;
        atlas.Region = region;
        return atlas;
    }

    private void UpdateDigits(HBoxContainer container, int value)
    {
        foreach (var child in container.GetChildren())
        {
            child.QueueFree();
        }

        string digits = value.ToString();
        foreach (char c in digits)
        {
            int digit = c - '0';
            var rect = new TextureRect();
            rect.Texture = DigitTextures[digit];
            rect.StretchMode = TextureRect.StretchModeEnum.Keep;
            container.AddChild(rect);
        }
    }
}
```

**The script supports both strategies simultaneously** — one for HP, one for lives. Comment out the setup call you don't use. The `Update` methods check which fields were initialized and act accordingly.

### Updating GameManager with Lives and Signals

The HUD needs to know when health, lives, or score change. `GameManager` from Chapter 13 tracked health and score — now we add lives:

```csharp
// Updated GameManager.cs

using Godot;

public partial class GameManager : Node
{
    public static GameManager Instance { get; private set; }

    public int Score { get; set; } = 0;
    public int PlayerHealth { get; set; } = 3;
    public int MaxHealth { get; private set; } = 3;
    public int Lives { get; set; } = 3;
    public int MaxLives { get; private set; } = 3;

    [Signal]
    public delegate void HealthChangedEventHandler(int currentHealth);

    [Signal]
    public delegate void LivesChangedEventHandler(int currentLives);

    [Signal]
    public delegate void ScoreChangedEventHandler(int score);

    public override void _Ready()
    {
        Instance = this;
    }

    public void AddScore(int amount)
    {
        Score += amount;
        EmitSignal(SignalName.ScoreChanged, Score);
    }

    public void TakeDamage(int amount)
    {
        PlayerHealth = Mathf.Max(0, PlayerHealth - amount);
        EmitSignal(SignalName.HealthChanged, PlayerHealth);

        if (PlayerHealth <= 0)
        {
            LoseLife();
        }
    }

    public void Heal(int amount)
    {
        PlayerHealth = Mathf.Min(MaxHealth, PlayerHealth + amount);
        EmitSignal(SignalName.HealthChanged, PlayerHealth);
    }

    public void LoseLife()
    {
        Lives = Mathf.Max(0, Lives - 1);
        EmitSignal(SignalName.LivesChanged, Lives);

        if (Lives <= 0)
        {
            GameOver();
        }
        else
        {
            // Respawn with full health
            PlayerHealth = MaxHealth;
            EmitSignal(SignalName.HealthChanged, PlayerHealth);

            var level = GetTree().CurrentScene;
            if (level is Level currentLevel)
            {
                currentLevel.RespawnPlayer();
            }
        }
    }

    private void GameOver()
    {
        var gameOverScreen = GetTree().CurrentScene
            .GetNodeOrNull<GameOverScreen>("GameOver");

        if (gameOverScreen != null)
        {
            gameOverScreen.Show();
        }
    }

    public void ResetState()
    {
        Score = 0;
        PlayerHealth = MaxHealth;
        Lives = MaxLives;
        EmitSignal(SignalName.HealthChanged, PlayerHealth);
        EmitSignal(SignalName.LivesChanged, Lives);
        EmitSignal(SignalName.ScoreChanged, Score);
    }
}
```

**The death flow is now:** HP reaches 0 → lose a life → if lives remain, respawn with full HP → if no lives remain, game over.

This replaces the old `GameOver()` call in `TakeDamage()`. The player no longer goes directly from "lost all HP" to "game over" — they get another chance if they have lives left. Score is preserved across deaths within a run and only resets on game over.

### Placing the HUD in Levels

Instance the HUD in each level scene:

```
Level01 (Node2D)
├── ...
├── Player (instanced from player.tscn)
└── HUD (instanced from hud.tscn)
```

The HUD's `CanvasLayer` renders on top of everything regardless of where it sits in the scene tree, but placing it last keeps the tree organized — game objects first, UI on top.

**Don't forget** to assign the spritesheet and heart regions in the Inspector on the HUD instance, and drag each digit PNG (`digit_0.png` through `digit_9.png`) into the `DigitTextures` array slots.

### Testing

Run the level. You should see your health display (hearts or heart × number) in the top-left, lives in the bottom-left, and a crystal counter in the top-right. Take damage — hearts should update. Lose all HP — a life should be lost and HP refilled. Collect a crystal — the score should increment. If nothing updates, check that `GameManager` is emitting signals and that the HUD is connected in `_Ready()`.

---

## 17.2 Main Menu

Every game needs a front door. The main menu is the first thing players see — a title, a Play button, maybe a Quit button. Simple, clean, functional.

### Main Menu Scene Structure

```
MainMenu (Control)
├── Background (ColorRect or TextureRect)
├── VBoxContainer
│   ├── Title (Label)
│   ├── Spacer (Control)
│   ├── PlayButton (Button)
│   └── QuitButton (Button)
```

Save as `res://scenes/ui/main_menu.tscn`.

**Why Control as root?** `Control` is the base for all UI nodes. Using it as the root means the entire menu is a UI scene that fills the screen, responds to layout anchors, and works with Godot's UI focus system for keyboard/gamepad navigation.

### Background

**Option A — Solid color:**

Add a `ColorRect`:

```
Layout → Anchors Preset: Full Rect
Color: (0.08, 0.08, 0.15, 1.0)    — dark blue-gray, cave mood
```

**Option B — Image:**

Add a `TextureRect` with a title screen image:

```
Layout → Anchors Preset: Full Rect
Stretch Mode: Keep Aspect Covered
Texture: your_title_bg.png
```

### VBoxContainer — Centering the Menu

```
Layout → Anchors Preset: Center
Layout → Grow Direction Horizontal: Both
Layout → Grow Direction Vertical: Both
Theme Overrides → Constants:
  Separation: 8
```

This centers the container in the screen. All children stack vertically with 8px spacing.

### Pixel Fonts

The HUD uses digit images (individual PNGs) for numbers, but menus use Godot's `Label` and `Button` nodes which need a font. Godot's default font is vector-based and looks out of place next to 18×18 pixel art tiles. Import a `.ttf` pixel font — plenty of free ones on itch.io and Google Fonts ("Press Start 2P", "Pixelify Sans", etc.). Set it per-node via Theme Overrides, or create a `Theme` resource and apply it to the root `Control` so all children inherit it.

8px font size matches the 320×180 viewport scale for body text. 16px works for titles.

### Title Label

```
Text: "Crystal Caverns"
Horizontal Alignment: Center
Theme Overrides → Fonts → Font: your_pixel_font.ttf
Theme Overrides → Font Sizes → Font Size: 16
Theme Overrides → Colors → Font Color: (0.9, 0.85, 0.4)    — warm gold
```

### Spacer

A plain `Control` node with a fixed size creates breathing room between the title and buttons:

```
Custom Minimum Size: (0, 16)
```

### Buttons

**PlayButton:**

```
Text: "Play"
Custom Minimum Size: (80, 20)
Theme Overrides → Fonts → Font: your_pixel_font.ttf
Theme Overrides → Font Sizes → Font Size: 8
```

**QuitButton:**

```
Text: "Quit"
Custom Minimum Size: (80, 20)
Theme Overrides → Fonts → Font: your_pixel_font.ttf
Theme Overrides → Font Sizes → Font Size: 8
```

### Button Focus for Keyboard/Gamepad

Players using a keyboard or controller can't click buttons — they need to navigate with arrow keys or D-pad. Godot's `Control` focus system handles this, but you need to tell it where to start.

Select `PlayButton` and set:

```
Focus → Neighbor Bottom: QuitButton (pick from node list)
Focus → Next: QuitButton
```

Select `QuitButton` and set:

```
Focus → Neighbor Top: PlayButton
Focus → Previous: PlayButton
```

Then in the script, grab focus on the Play button when the menu appears:

```csharp
PlayButton.GrabFocus();
```

Now arrow keys and Tab cycle between buttons. This is essential for gamepad support and good accessibility.

### Main Menu Script

```csharp
using Godot;

public partial class MainMenu : Control
{
    private Button _playButton;
    private Button _quitButton;

    public override void _Ready()
    {
        _playButton = GetNode<Button>("VBoxContainer/PlayButton");
        _quitButton = GetNode<Button>("VBoxContainer/QuitButton");

        _playButton.Pressed += OnPlayPressed;
        _quitButton.Pressed += OnQuitPressed;

        _playButton.GrabFocus();
    }

    private void OnPlayPressed()
    {
        GameManager.Instance.ResetState();
        GetTree().ChangeSceneToFile("res://scenes/levels/level_01.tscn");
    }

    private void OnQuitPressed()
    {
        GetTree().Quit();
    }
}
```

`ResetState()` zeros out score and health before starting a new game. Without it, starting a second playthrough would carry over the previous game's state.

### Setting Main Menu as the Project's Main Scene

In Project Settings → Application → Run:

```
Main Scene: res://scenes/ui/main_menu.tscn
```

Now launching the game shows the menu first, not Level 01 directly.

### App Icon and Boot Splash

Two small details that make the game feel like a real product instead of a Godot project.

**App icon** — the icon that appears in the OS taskbar, window title bar, and desktop shortcut. In Project Settings → Application → Config:

```
Icon: res://art/ui/app_icon.png
```

Use a square image — 256×256 or 512×512 pixels. Godot scales it down for each platform. Your pixel art can be upscaled with nearest-neighbor filtering to keep it crisp (e.g., a 32×32 icon exported at 256×256 with no interpolation).

**Boot splash** — the image displayed while the engine loads, before the main scene appears. In Project Settings → Application → Boot Splash:

```
Image: res://art/ui/boot_splash.png
Fullsize: false
Use Filter: false        — nearest-neighbor, keeps pixel art sharp
Background Color: (0.08, 0.08, 0.15)    — match your game's dark theme
```

The boot splash shows for a fraction of a second on desktop — barely noticeable. On mobile or web exports it's more visible due to longer load times. A simple image works: your game logo centered on a dark background, or even just the title text from your spritesheet scaled up.

If you skip these, Godot uses its default icon (the Godot robot) and a gray splash screen. Functional, but it screams "student project."

---

## 17.3 Pause Menu

The player is mid-jump, a phone rings, they need to stop. Without a pause menu, the game keeps running. Pause is a basic expectation — players will reach for Escape instinctively.

### How Pausing Works in Godot

Godot's pause system is built into the `SceneTree`. Setting `GetTree().Paused = true` stops processing on every node — `_Process`, `_PhysicsProcess`, timers, animations, everything. The game freezes.

But if everything is frozen, how does the pause menu itself work? Through **Process Mode**.

Every node has a `ProcessMode` property that controls its behavior when the tree is paused:

| ProcessMode | Behavior |
| --- | --- |
| `Inherit` | Same as parent (default for all nodes) |
| `Pausable` | Stops when tree is paused |
| `WhenPaused` | **Only** processes when tree is paused |
| `Always` | Processes regardless of pause state |
| `Disabled` | Never processes |

The pause menu needs `ProcessMode = Always` — it must respond to input even while the game is frozen. Everything else inherits `Pausable` behavior by default, so the game stops automatically.

### Input Map

Add a `pause` action in Project Settings → Input Map:

```
pause: Escape key, Start button (gamepad)
```

### Pause Menu Scene Structure

```
PauseMenu (CanvasLayer)
└── PausePanel (PanelContainer)
    └── VBoxContainer
        ├── PausedLabel (Label)
        ├── ResumeButton (Button)
        └── QuitButton (Button)
```

Save as `res://scenes/ui/pause_menu.tscn`.

**Why CanvasLayer again?** Same reason as the HUD — the pause menu must render on top of the game, above the HUD. Set the `Layer` property to 2 (HUD is on layer 1 by default).

### PausePanel Configuration

```
Layout → Anchors Preset: Center
Custom Minimum Size: (120, 80)
```

**PausedLabel:**

```
Text: "Paused"
Horizontal Alignment: Center
Theme Overrides → Font Size: 10
```

**ResumeButton / QuitButton:** Same styling as the main menu buttons. Set up focus neighbors between them.

### Pause Menu Script

```csharp
using Godot;

public partial class PauseMenu : CanvasLayer
{
    private Button _resumeButton;
    private Button _quitButton;

    public override void _Ready()
    {
        ProcessMode = ProcessModeEnum.Always;
        Visible = false;

        _resumeButton = GetNode<Button>(
            "PausePanel/VBoxContainer/ResumeButton");
        _quitButton = GetNode<Button>(
            "PausePanel/VBoxContainer/QuitButton");

        _resumeButton.Pressed += OnResumePressed;
        _quitButton.Pressed += OnQuitPressed;
    }

    public override void _UnhandledInput(InputEvent @event)
    {
        if (@event.IsActionPressed("pause"))
        {
            if (GetTree().Paused)
            {
                Resume();
            }
            else
            {
                Pause();
            }

            GetViewport().SetInputAsHandled();
        }
    }

    private void Pause()
    {
        Visible = true;
        GetTree().Paused = true;
        _resumeButton.GrabFocus();
    }

    private void Resume()
    {
        Visible = false;
        GetTree().Paused = false;
    }

    private void OnResumePressed()
    {
        Resume();
    }

    private void OnQuitPressed()
    {
        Resume();
        GetTree().ChangeSceneToFile("res://scenes/ui/main_menu.tscn");
    }
}
```

**Key decisions:**

**`_UnhandledInput` instead of `_Input`:** `_UnhandledInput` only fires if no other node consumed the event. This prevents the pause action from interfering with gameplay input. If some future UI element (like a text field) uses Escape, it handles it first and the pause menu doesn't fire.

**`GetViewport().SetInputAsHandled()`:** Tells Godot "I handled this event, stop propagating it." Without this, pressing Escape could trigger other `_UnhandledInput` handlers.

**`Resume()` before `ChangeSceneToFile`:** We unpause before changing scenes. If we don't, the new scene (main menu) inherits the paused state and nothing works. A common beginner bug.

**`ProcessMode = ProcessModeEnum.Always`:** Set in code to be explicit, but you could also set it in the Inspector. Either way, this is what lets the pause menu's `_UnhandledInput` and button callbacks fire while the tree is paused.

### Placing the Pause Menu in Levels

Instance it alongside the HUD in each level:

```
Level01 (Node2D)
├── ...
├── Player
├── HUD (instanced from hud.tscn)
└── PauseMenu (instanced from pause_menu.tscn)
```

### Testing

Run a level. Press Escape — the game should freeze and the menu should appear. Press Resume or Escape again — the game resumes. Press Quit — you return to the main menu. Check that enemies stop moving, timers stop, and particles freeze when paused.

---

## 17.4 Game Over and Victory Screens

Two endpoints: the player runs out of health (game over), or the player finishes the last level (victory). Both need a screen that stops gameplay and offers choices.

### Game Over Screen

```
GameOver (CanvasLayer)
└── PanelContainer
    └── VBoxContainer
        ├── GameOverLabel (Label)
        ├── RetryButton (Button)
        └── MenuButton (Button)
```

Save as `res://scenes/ui/game_over.tscn`.

**Layer:** Set to 3 — above both HUD (1) and pause menu (2). Game over takes priority over everything.

```csharp
using Godot;

public partial class GameOverScreen : CanvasLayer
{
    private Button _retryButton;
    private Button _menuButton;

    public override void _Ready()
    {
        ProcessMode = ProcessModeEnum.Always;
        Visible = false;

        _retryButton = GetNode<Button>(
            "PanelContainer/VBoxContainer/RetryButton");
        _menuButton = GetNode<Button>(
            "PanelContainer/VBoxContainer/MenuButton");

        _retryButton.Pressed += OnRetryPressed;
        _menuButton.Pressed += OnMenuPressed;
    }

    public void Show()
    {
        Visible = true;
        GetTree().Paused = true;
        _retryButton.GrabFocus();
    }

    private void OnRetryPressed()
    {
        GetTree().Paused = false;
        GameManager.Instance.ResetState();
        GetTree().ReloadCurrentScene();
    }

    private void OnMenuPressed()
    {
        GetTree().Paused = false;
        GameManager.Instance.ResetState();
        GetTree().ChangeSceneToFile("res://scenes/ui/main_menu.tscn");
    }
}
```

**`GetTree().ReloadCurrentScene()`:** Restarts the current level from scratch — all enemies respawn, all crystals reappear, player returns to spawn. It's the simplest retry implementation and perfectly appropriate for a short platformer.

### Triggering Game Over from GameManager

The `GameOver()` method in `GameManager` (from section 17.1) already handles this — when lives reach 0, it finds the `GameOverScreen` in the current scene and shows it. No additional wiring needed. This is why we instance the game over screen in each level.

### Victory Screen

The victory screen is structurally identical to game over — different text, different actions:

```
Victory (CanvasLayer)
└── PanelContainer
    └── VBoxContainer
        ├── VictoryLabel (Label)
        ├── MenuButton (Button)
```

Save as `res://scenes/ui/victory.tscn`.

```csharp
using Godot;

public partial class VictoryScreen : CanvasLayer
{
    private Button _menuButton;
    private Label _scoreLabel;

    public override void _Ready()
    {
        ProcessMode = ProcessModeEnum.Always;
        Visible = false;

        _menuButton = GetNode<Button>(
            "PanelContainer/VBoxContainer/MenuButton");

        _menuButton.Pressed += OnMenuPressed;
    }

    public void Show()
    {
        Visible = true;
        GetTree().Paused = true;

        // Show final score
        var label = GetNode<Label>(
            "PanelContainer/VBoxContainer/VictoryLabel");
        label.Text = $"You Win!\nCrystals: {GameManager.Instance.Score}";

        _menuButton.GrabFocus();
    }

    private void OnMenuPressed()
    {
        GetTree().Paused = false;
        GameManager.Instance.ResetState();
        GetTree().ChangeSceneToFile("res://scenes/ui/main_menu.tscn");
    }
}
```

### Triggering Victory

In Chapter 15.5, the `ExitDoor` script calls `GetTree().ChangeSceneToFile()` for the next level. When there's no next level (the player completed Level 03), we show the victory screen instead:

```csharp
// In ExitDoor.cs — update StartTransition()

private void StartTransition()
{
    _transitioning = true;

    if (NextLevelPath != "")
    {
        GetTree().ChangeSceneToFile(NextLevelPath);
    }
    else
    {
        // No next level — player wins!
        var victoryScreen = GetTree().CurrentScene
            .GetNodeOrNull<VictoryScreen>("Victory");

        if (victoryScreen != null)
        {
            victoryScreen.Show();
        }
    }
}
```

### Placing Both Screens in Levels

```
Level01 (Node2D)
├── ...
├── Player
├── HUD
├── PauseMenu
├── GameOver (instanced from game_over.tscn)
└── Victory (instanced from victory.tscn)
```

Both screens start hidden (`Visible = false`) and only appear when triggered. They cost nothing until shown.

---

## 17.5 Sound Effects and Music

Sound is the cheapest way to make a game feel polished. A silent game feels broken — even a single jump sound effect transforms the experience. We need two things: an `AudioManager` autoload for global audio control, and `AudioStreamPlayer` nodes for individual sounds.

### Audio Buses

Before writing code, set up the audio bus layout. Open the **Audio** tab at the bottom of the editor (next to Animation, Shader, etc.).

By default there's only the `Master` bus. Add two more:

| Bus | Purpose |
| --- | --- |
| Master | Controls all audio (leave as-is) |
| SFX | Sound effects (jump, collect, stomp, etc.) |
| Music | Background music loops |

Click **Add Bus** twice. Name them `SFX` and `Music`. Both route to `Master` by default — which is what we want. Lowering the Master volume mutes everything; lowering SFX only mutes effects.

Save this layout — it's stored in `res://default_bus_layout.tres` automatically.

### AudioManager Autoload

Create `res://scripts/autoloads/AudioManager.cs`:

```csharp
using Godot;

public partial class AudioManager : Node
{
    public static AudioManager Instance { get; private set; }

    private AudioStreamPlayer _musicPlayer;

    public override void _Ready()
    {
        Instance = this;

        _musicPlayer = new AudioStreamPlayer();
        _musicPlayer.Bus = "Music";
        AddChild(_musicPlayer);
    }

    // --- SFX ---

    public void PlaySFX(AudioStream sound, float volumeDb = 0f)
    {
        var player = new AudioStreamPlayer();
        player.Stream = sound;
        player.Bus = "SFX";
        player.VolumeDb = volumeDb;
        AddChild(player);
        player.Play();

        // Self-destruct after playing
        player.Finished += player.QueueFree;
    }

    // --- Music ---

    public void PlayMusic(AudioStream music, float volumeDb = -10f)
    {
        if (_musicPlayer.Stream == music && _musicPlayer.Playing)
        {
            return; // Already playing this track
        }

        _musicPlayer.Stream = music;
        _musicPlayer.VolumeDb = volumeDb;
        _musicPlayer.Play();
    }

    public void StopMusic()
    {
        _musicPlayer.Stop();
    }

    // --- Volume Control ---

    public void SetSFXVolume(float volumeDb)
    {
        int busIndex = AudioServer.GetBusIndex("SFX");
        AudioServer.SetBusVolumeDb(busIndex, volumeDb);
    }

    public void SetMusicVolume(float volumeDb)
    {
        int busIndex = AudioServer.GetBusIndex("Music");
        AudioServer.SetBusVolumeDb(busIndex, volumeDb);
    }

    public void SetMasterVolume(float volumeDb)
    {
        int busIndex = AudioServer.GetBusIndex("Master");
        AudioServer.SetBusVolumeDb(busIndex, volumeDb);
    }
}
```

Register as autoload: Project Settings → Autoload → add `AudioManager.cs`, name `AudioManager`.

**Design decisions:**

**SFX are fire-and-forget.** `PlaySFX()` creates a temporary `AudioStreamPlayer`, plays the sound, and the `Finished` signal triggers `QueueFree` to clean it up automatically. This means you can fire 10 sounds simultaneously without managing a pool.

**Music is persistent.** A single `AudioStreamPlayer` stays alive and plays one track at a time. Calling `PlayMusic()` with the same track does nothing (early return). Calling it with a different track swaps the stream.

**Volume via AudioServer.** Rather than setting volume on each player individually, we control the bus volume. This affects every player on that bus — past, present, and future.

**`VolumeDb` is in decibels.** 0 dB = full volume. -10 dB ≈ half perceived loudness. -80 dB = effectively silent. Music defaults to -10 dB because music should sit behind sound effects, not compete with them.

### Adding Sounds to the Player

Load sound effects as exported resources and play them at the right moments:

```csharp
// Add to Player.cs

[Export] public AudioStream JumpSound { get; set; }
[Export] public AudioStream LandSound { get; set; }
[Export] public AudioStream HurtSound { get; set; }
```

Play them at the appropriate points:

```csharp
// In HandleJump(), after setting jump velocity:
if (JumpSound != null)
{
    AudioManager.Instance.PlaySFX(JumpSound);
}

// In the landing detection (when !_wasOnFloor transitions to IsOnFloor()):
if (LandSound != null)
{
    AudioManager.Instance.PlaySFX(LandSound, -5f);
}

// In TakeHit():
if (HurtSound != null)
{
    AudioManager.Instance.PlaySFX(HurtSound);
}
```

### Adding Sounds to Game Objects

Same pattern for crystals, enemies, and checkpoints:

```csharp
// Crystal.cs — add to Collect()
[Export] public AudioStream CollectSound { get; set; }

private void Collect()
{
    if (CollectSound != null)
    {
        AudioManager.Instance.PlaySFX(CollectSound);
    }
    // ... rest of collect logic
}
```

```csharp
// PatrolEnemy.cs — add to Die()
[Export] public AudioStream StompSound { get; set; }

private void Die()
{
    if (StompSound != null)
    {
        AudioManager.Instance.PlaySFX(StompSound);
    }
    // ... rest of die logic
}
```

```csharp
// Checkpoint.cs — add to Activate()
[Export] public AudioStream ActivateSound { get; set; }

private void Activate()
{
    if (ActivateSound != null)
    {
        AudioManager.Instance.PlaySFX(ActivateSound);
    }
    // ... rest of activate logic
}
```

**Why `AudioManager.Instance.PlaySFX()` instead of `AudioStreamPlayer2D`?**

`AudioStreamPlayer2D` is positional — the sound gets quieter the further the listener is from the source. That's great for ambient sounds in large worlds, but in a 320×180 viewport platformer, everything on screen is close enough that positional audio adds nothing. Non-positional `AudioStreamPlayer` through the AudioManager is simpler and works perfectly at this scale.

If you later build a larger game with scrolling maps where off-screen events matter, switch to `AudioStreamPlayer2D` on the objects themselves.

### Background Music per Level

Add a music resource to the Level script:

```csharp
// Add to Level.cs (or whatever your level base script is)

[Export] public AudioStream LevelMusic { get; set; }

public override void _Ready()
{
    // ... existing level setup code ...

    if (LevelMusic != null)
    {
        AudioManager.Instance.PlayMusic(LevelMusic);
    }
}
```

Assign a `.ogg` or `.mp3` file to each level's `LevelMusic` slot in the Inspector. The `AudioManager` handles track switching — if Level 01 and Level 02 use the same track, it continues seamlessly. If Level 03 uses a different track, it swaps automatically.

**Audio format notes:**
- **`.wav`** for sound effects — uncompressed, zero decode latency, small files for short sounds.
- **`.ogg`** (Ogg Vorbis) for music — compressed, good quality, Godot streams it without loading the entire file into memory. Godot 4 also supports `.mp3` if you prefer.

### The Minimum Sound Set

From the "done" checklist in Chapter 13, we need at least 3 sound effects. Here's a practical list that covers the essentials:

| Sound | Trigger | Notes |
| --- | --- | --- |
| `jump.wav` | Player jumps | Short, snappy "boing" or "whoosh" |
| `crystal_collect.wav` | Crystal collected | Bright chime or sparkle |
| `player_hurt.wav` | Player takes damage | Dull thud or "ouch" |
| `enemy_stomp.wav` | Enemy stomped | Satisfying squash |
| `checkpoint.wav` | Checkpoint activated | Confirming ding |

Five is better than three. Each one takes 30 seconds to assign in the Inspector once you have the audio files — the return on investment is enormous.

---

## 17.6 Screen Transitions

Scene changes in Godot are instant — one frame you're in Level 01, the next frame you're in Level 02. It works, but it's jarring. A half-second fade to black between levels makes the transition feel intentional.

### Transition Manager Autoload

Like `GameManager` and `AudioManager`, the transition system lives in an autoload so it persists across scene changes. If it lived inside a level scene, it would be destroyed when that scene is freed.

Create `res://scripts/autoloads/TransitionManager.cs` and the scene `res://scenes/ui/transition_manager.tscn`:

```
TransitionManager (CanvasLayer)
└── ColorRect
```

**CanvasLayer configuration:**

```
Layer: 10    — above everything: game, HUD, menus, all of it
```

**ColorRect configuration:**

```
Layout → Anchors Preset: Full Rect
Color: (0, 0, 0, 1)    — solid black
```

### Transition Manager Script

```csharp
using Godot;
using System;

public partial class TransitionManager : CanvasLayer
{
    public static TransitionManager Instance { get; private set; }

    private ColorRect _overlay;
    private bool _transitioning = false;

    public override void _Ready()
    {
        Instance = this;

        _overlay = GetNode<ColorRect>("ColorRect");
        _overlay.Color = new Color(0, 0, 0, 0); // Start fully transparent
    }

    public async void ChangeScene(string scenePath)
    {
        if (_transitioning) return;
        _transitioning = true;

        // Fade to black
        var fadeOut = CreateTween();
        fadeOut.TweenProperty(_overlay, "color:a", 1.0f, 0.3f);
        await ToSignal(fadeOut, Tween.SignalName.Finished);

        // Change the scene
        GetTree().ChangeSceneToFile(scenePath);

        // Wait one frame for the new scene to initialize
        await ToSignal(GetTree(), SceneTree.SignalName.ProcessFrame);

        // Fade from black
        var fadeIn = CreateTween();
        fadeIn.TweenProperty(_overlay, "color:a", 0.0f, 0.3f);
        await ToSignal(fadeIn, Tween.SignalName.Finished);

        _transitioning = false;
    }
}
```

Register the **scene** (not the script) as autoload: Project Settings → Autoload → add `transition_manager.tscn`, name `TransitionManager`.

**Why the scene and not just the script?** The `TransitionManager` needs a `ColorRect` child — it's a visual element, not just logic. Autoloading the scene instantiates the full node tree (CanvasLayer + ColorRect). Autoloading just the script would give you a bare `Node` with no overlay to animate.

**`await ToSignal(GetTree(), SceneTree.SignalName.ProcessFrame)`:** After `ChangeSceneToFile`, the new scene hasn't run its `_Ready()` yet. Waiting one frame ensures the new scene is fully initialized before we start fading in. Without this, there can be a single frame where the old scene is gone but the new one hasn't rendered — a black flash that defeats the purpose of the transition.

**`color:a`:** Tweens the alpha channel of the color property directly. `0.0` = transparent, `1.0` = opaque. We don't need `AnimationPlayer` for something this simple — a tween is two lines.

### Using the Transition Manager

Replace all direct `GetTree().ChangeSceneToFile()` calls with `TransitionManager.Instance.ChangeScene()`:

**ExitDoor.cs:**

```csharp
private void StartTransition()
{
    _transitioning = true;

    if (NextLevelPath != "")
    {
        TransitionManager.Instance.ChangeScene(NextLevelPath);
    }
    else
    {
        var victoryScreen = GetTree().CurrentScene
            .GetNodeOrNull<VictoryScreen>("Victory");
        victoryScreen?.Show();
    }
}
```

**MainMenu.cs:**

```csharp
private void OnPlayPressed()
{
    GameManager.Instance.ResetState();
    TransitionManager.Instance.ChangeScene("res://scenes/levels/level_01.tscn");
}
```

**GameOverScreen.cs:**

```csharp
private void OnRetryPressed()
{
    GetTree().Paused = false;
    GameManager.Instance.ResetState();
    TransitionManager.Instance.ChangeScene(
        GetTree().CurrentScene.SceneFilePath);
}
```

Note: `GetTree().CurrentScene.SceneFilePath` gives us the path of the current scene so we can reload it through the transition manager instead of using `ReloadCurrentScene()`.

**Don't replace the pause menu's quit-to-menu** — that one can stay as a direct `ChangeSceneToFile` since the player expects the pause menu to respond instantly. Adding a fade there feels sluggish.

### Transition Duration

0.3 seconds per fade (0.6 total) is the sweet spot for platformers. Fast enough that impatient players don't notice, slow enough that the transition reads as intentional. If it feels too slow, drop to 0.2. If it feels too fast, try 0.4. Never go above 0.5 — players are in the middle of playing, not watching a movie.

---

## Summary

**HUD (17.1):** `CanvasLayer` with health, lives, and score displays. Two strategies for HP and lives: individual icons (≤ 3 — hearts show full/half/empty, character sprites dim when lost) or icon × number (> 3 — single icon + X + digit images). `AtlasTexture` slices heart sprites from a spritesheet; digits use individual PNGs exported as a `Texture2D[10]` array. Score always uses the icon × number pattern (crystal + X + digits), consistent with the rest of the HUD. A conditional crystal requirement display appears only on levels where the exit door requires a minimum crystal count — hidden by default, shown by the level script when `RequiredCrystals > 0`. `GameManager` gains a lives system — HP reaching 0 costs a life and respawns; lives reaching 0 triggers game over. Signals (`HealthChanged`, `LivesChanged`, `ScoreChanged`) drive all HUD updates reactively.

**Main Menu (17.2):** `Control` scene with title, Play, and Quit buttons. `VBoxContainer` for centered vertical layout. Focus neighbors set for keyboard/gamepad navigation. `GrabFocus()` on the Play button in `_Ready()`. Set as the project's main scene.

**Pause Menu (17.3):** `CanvasLayer` with `ProcessMode = Always` so it works while the tree is paused. Toggles `GetTree().Paused` and its own visibility. `_UnhandledInput` catches Escape without interfering with gameplay. Unpauses before changing scenes to prevent inheriting paused state.

**Game Over and Victory (17.4):** Both are hidden `CanvasLayer` screens that appear when triggered. Game over offers Retry (reload scene) and Menu (return to main menu). Victory shows final score and Menu button. Triggered by `GameManager.GameOver()` and `ExitDoor` when no next level exists.

**Audio (17.5):** `AudioManager` autoload with fire-and-forget SFX (temporary `AudioStreamPlayer` per sound, self-destructs on `Finished`) and persistent music (single player, skips if same track). Three audio buses: Master, SFX, Music. Volume controlled via `AudioServer.SetBusVolumeDb()`. Sounds loaded as `[Export] AudioStream` on each object and played through the AudioManager.

**Screen Transitions (17.6):** `TransitionManager` autoload (scene with `CanvasLayer` + `ColorRect`). Tweens overlay alpha: transparent → black → change scene → wait one frame → black → transparent. 0.3s per fade. Replaces direct `ChangeSceneToFile` calls for smooth level transitions.

---

With this chapter complete, every item on the "done" checklist from Chapter 13 is checked:

1. ~~Player can move, jump, and wall jump~~ — Chapter 14
2. ~~3 levels playable from start to exit~~ — Chapter 15
3. ~~Crystals collected, score displayed~~ — Chapters 15.4 + 17.1
4. ~~Enemy patrols and can be stomped~~ — Chapter 16
5. ~~Spikes and hazards~~ — Chapter 15.2
6. ~~Checkpoints save respawn~~ — Chapter 15.3
7. ~~Health system with HP, lives, and visual feedback~~ — Chapter 17.1
8. ~~Main menu with Play button~~ — Chapter 17.2
9. ~~Pause menu with Resume and Quit~~ — Chapter 17.3
10. ~~Game over screen with Restart~~ — Chapter 17.4
11. ~~At least 3 sound effects~~ — Chapter 17.5
12. ~~Background music on at least one level~~ — Chapter 17.5

**Crystal Caverns is a complete game.** It has a beginning (main menu), a middle (three levels with enemies, hazards, and collectibles), and an end (victory screen). It has sound, music, visual feedback, and smooth transitions. It handles failure (game over) and success (victory) gracefully.

Is it a masterpiece? No — it's a first game. But it's *finished*, and a finished game teaches more than ten abandoned prototypes ever will.
