# Chapter 17: Polishing the Platformer

---

## 17.1 HUD — Health Hearts and Score Display

The player has 3 HP, collects crystals, and can die. But none of that is visible — there's no health bar, no score counter, no feedback. The game works, but it doesn't *communicate*. Time to fix that.

A HUD (Heads-Up Display) is a UI layer that sits on top of the game world and shows the player critical information: how much health they have, how many crystals they've collected, what level they're on. It doesn't scroll with the camera, doesn't interact with physics, and never moves.

### Why CanvasLayer?

The game camera follows the player. If you put UI nodes as children of the level scene, they'll scroll off-screen. `CanvasLayer` solves this — it renders its children on a separate canvas that ignores the camera transform. Layer 1 (or higher) draws on top of the game world.

Think of it like a transparent sheet of glass between you and the TV — the game scrolls behind it, but the HUD stays pinned in place.

### HUD Scene Structure

Create a new scene with `CanvasLayer` as the root:

```
HUD (CanvasLayer)
└── MarginContainer
    ├── HealthContainer (HBoxContainer)
    │   ├── Heart1 (TextureRect)
    │   ├── Heart2 (TextureRect)
    │   └── Heart3 (TextureRect)
    └── ScoreContainer (HBoxContainer)
        ├── CrystalIcon (TextureRect)
        └── ScoreLabel (Label)
```

Save as `res://scenes/ui/hud.tscn`.

### MarginContainer — Keeping UI Off the Edges

The `MarginContainer` pushes all its children inward from the screen edges. Without it, hearts would sit flush against the corner — cramped and hard to read on different screen sizes.

Configure the margins in the Inspector:

```
Layout → Anchors Preset: Full Rect    — fills the entire screen
Theme Overrides → Constants:
  Margin Left:   4
  Margin Top:    4
  Margin Right:  4
  Margin Bottom: 4
```

4 pixels is enough for pixel art at 320×180 resolution. It's subtle but keeps the UI breathing.

### Health Hearts

Each `TextureRect` displays a heart image. We'll swap between `heart_full.png` and `heart_empty.png` based on current health.

**Heart node configuration:**

```
Texture: heart_full.png
Stretch Mode: Keep
Custom Minimum Size: (11, 10)    — match your heart sprite size
```

`Stretch Mode: Keep` prevents the texture from being scaled or distorted by the container. The heart renders at its native pixel size.

**HealthContainer (HBoxContainer):**

```
Layout → Anchors Preset: Top Left
Theme Overrides → Constants:
  Separation: 2    — 2px gap between hearts
```

### Score Display

**CrystalIcon (TextureRect):**

```
Texture: crystal_icon.png
Stretch Mode: Keep
Custom Minimum Size: (10, 10)    — match your crystal icon size
```

**ScoreLabel (Label):**

```
Text: "0"
Horizontal Alignment: Left
```

For pixel art games, you'll want a pixel font. Godot's default font is vector-based and looks out of place next to 18×18 tiles. Import a `.ttf` pixel font (plenty of free ones on itch.io and Google Fonts — "Press Start 2P", "Pixelify Sans", etc.) and set it on the label:

```
Theme Overrides → Fonts → Font: your_pixel_font.ttf
Theme Overrides → Font Sizes → Font Size: 8
```

8px matches the 320×180 viewport scale nicely.

**ScoreContainer (HBoxContainer):**

```
Layout → Anchors Preset: Top Right
Theme Overrides → Constants:
  Separation: 2
```

### HUD Script

```csharp
using Godot;

public partial class HUD : CanvasLayer
{
    private TextureRect[] _hearts;
    private Label _scoreLabel;

    [Export] public Texture2D HeartFull { get; set; }
    [Export] public Texture2D HeartEmpty { get; set; }

    public override void _Ready()
    {
        var healthContainer = GetNode<HBoxContainer>(
            "MarginContainer/HealthContainer");

        _hearts = new TextureRect[healthContainer.GetChildCount()];
        for (int i = 0; i < _hearts.Length; i++)
        {
            _hearts[i] = healthContainer.GetChild<TextureRect>(i);
        }

        _scoreLabel = GetNode<Label>(
            "MarginContainer/ScoreContainer/ScoreLabel");

        // Initial state
        UpdateHealth(GameManager.Instance.PlayerHealth);
        UpdateScore(GameManager.Instance.Score);

        // Listen for changes
        GameManager.Instance.HealthChanged += UpdateHealth;
        GameManager.Instance.ScoreChanged += UpdateScore;
    }

    public override void _ExitTree()
    {
        // Disconnect signals to prevent errors when the scene is freed
        GameManager.Instance.HealthChanged -= UpdateHealth;
        GameManager.Instance.ScoreChanged -= UpdateScore;
    }

    private void UpdateHealth(int currentHealth)
    {
        for (int i = 0; i < _hearts.Length; i++)
        {
            _hearts[i].Texture = i < currentHealth ? HeartFull : HeartEmpty;
        }
    }

    private void UpdateScore(int score)
    {
        _scoreLabel.Text = score.ToString();
    }
}
```

**Why exported textures?** Instead of hardcoding paths like `GD.Load<Texture2D>("res://art/ui/heart_full.png")`, we export the textures and assign them in the Inspector. This means you can swap art without touching code — drag a different heart sprite and it just works.

### Updating GameManager with Signals

The HUD needs to know when health or score changes. Right now, `GameManager` modifies values silently. We need signals:

```csharp
// Add to GameManager.cs

[Signal]
public delegate void HealthChangedEventHandler(int currentHealth);

[Signal]
public delegate void ScoreChangedEventHandler(int score);
```

Then emit them when values change:

```csharp
public void TakeDamage(int amount)
{
    PlayerHealth = Mathf.Max(0, PlayerHealth - amount);
    EmitSignal(SignalName.HealthChanged, PlayerHealth);

    if (PlayerHealth <= 0)
    {
        GameOver();
    }
}

public void Heal(int amount)
{
    PlayerHealth = Mathf.Min(MaxHealth, PlayerHealth + amount);
    EmitSignal(SignalName.HealthChanged, PlayerHealth);
}

public void AddScore(int amount)
{
    Score += amount;
    EmitSignal(SignalName.ScoreChanged, Score);
}
```

Now any node can subscribe to `HealthChanged` or `ScoreChanged` — the HUD is just one listener. If you later add a health bar on a boss or a score popup, they subscribe to the same signals.

### Placing the HUD in Levels

Instance the HUD in each level scene:

```
Level01 (Node2D)
├── ...
├── Player (instanced from player.tscn)
└── HUD (instanced from hud.tscn)
```

The HUD's `CanvasLayer` renders on top of everything regardless of where it sits in the scene tree, but placing it last keeps the tree organized — game objects first, UI on top.

**Don't forget** to assign `heart_full.png` and `heart_empty.png` to the exported texture slots on the HUD instance in the Inspector.

### Testing

Run the level. You should see hearts in the top-left and a crystal counter in the top-right. Take damage — hearts should empty. Collect a crystal — the score should increment. If nothing updates, check that `GameManager` is emitting signals and that the HUD is connected in `_Ready()`.

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

Update `GameManager.GameOver()`:

```csharp
private void GameOver()
{
    // Find the game over screen in the current scene tree
    var gameOverScreen = GetTree().CurrentScene
        .GetNodeOrNull<GameOverScreen>("GameOver");

    if (gameOverScreen != null)
    {
        gameOverScreen.Show();
    }
    else
    {
        GD.PrintErr("GameOver screen not found in current scene!");
    }
}
```

The `GameManager` looks for a `GameOverScreen` node in the current level scene. This is why we instance it in each level.

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

**HUD (17.1):** `CanvasLayer` with `TextureRect` hearts and a `Label` for score. Connects to `GameManager` signals (`HealthChanged`, `ScoreChanged`) for reactive updates. Hearts swap between full and empty textures. Instanced in each level scene.

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
7. ~~Health system with 3 HP and visual feedback~~ — Chapter 17.1
8. ~~Main menu with Play button~~ — Chapter 17.2
9. ~~Pause menu with Resume and Quit~~ — Chapter 17.3
10. ~~Game over screen with Restart~~ — Chapter 17.4
11. ~~At least 3 sound effects~~ — Chapter 17.5
12. ~~Background music on at least one level~~ — Chapter 17.5

**Crystal Caverns is a complete game.** It has a beginning (main menu), a middle (three levels with enemies, hazards, and collectibles), and an end (victory screen). It has sound, music, visual feedback, and smooth transitions. It handles failure (game over) and success (victory) gracefully.

Is it a masterpiece? No — it's a first game. But it's *finished*, and a finished game teaches more than ten abandoned prototypes ever will.
