# Chapter 15: Level Design

---

## 15.1 Building Levels with TileMap

The player can run, jump, wall jump, and do backflips off cliffs. But there's nowhere to do any of that — the game is an empty void. Time to build a world.

We covered TileMap fundamentals in Chapter 11 — TileSet creation, painting, auto-tiling, physics layers, and multiple tile layers. This chapter applies all of that to build real, playable levels for Crystal Caverns.

### Level Scene Structure

Create a new scene for the first level. The root node is `Node2D` — levels don't need physics bodies, they're containers:

```
Level01 (Node2D)
├── FarParallax (Parallax2D)
│   └── Sprite2D
├── MidParallax (Parallax2D)
│   └── Sprite2D
├── NearParallax (Parallax2D)
│   └── Sprite2D
├── Terrain (TileMapLayer — ground, walls, platforms)
├── Decoration (TileMapLayer — non-collidable background decoration)
├── Objects (Node2D)
│   ├── Crystals (Node2D)
│   ├── Checkpoints (Node2D)
│   ├── Spikes (Node2D)
│   └── MovingPlatforms (Node2D)
├── ExitDoor (Area2D)
├── PlayerSpawn (Marker2D)
└── Player (instanced from player.tscn)
```

Save as `res://scenes/levels/level_01.tscn`.

**Why Marker2D for spawn?** It's a position-only node — no visuals, no collision, just a coordinate. When the player respawns (from checkpoints or death), we teleport them to this position. Having it as a node lets you drag it around in the editor instead of hardcoding coordinates.

**Why group objects under containers?** The `Objects` node and its children (`Crystals`, `Checkpoints`, etc.) are organizational. When a level has 30 crystals, 5 checkpoints, and 10 spike strips, grouping them keeps the scene tree manageable. You can collapse the `Crystals` node to hide all 30 children.

### Setting Up the TileSet

If you're using Kenney's Pixel Platformer pack (18×18 tiles), create the TileSet:

1. Select the `Terrain` node.
2. In the Inspector, create a new `TileSet` resource.
3. Set **Tile Size** to 18×18.
4. In the TileSet editor (bottom panel), add an **Atlas Source** and select your tileset image (`art/tileset/cavern_tiles.png`).
5. Set the atlas grid to match your tile size. Godot auto-detects tiles if the image is aligned to the grid.

Now set up physics. In the TileSet editor:

1. Go to the **Physics Layers** section and add a physics layer.
2. Set collision layer to 1 (terrain) and mask to 0 (tiles don't need to detect anything — other bodies detect tiles).
3. Select individual tiles and paint collision shapes on them. Ground tiles, wall tiles, and platform tiles all need collision shapes. Decoration tiles (background rocks, moss, small details) don't.

We covered all of this in Chapter 11, sections 11.2 and 11.5. If the steps feel unfamiliar, revisit those sections.

### Decoration — Background Tiles

The `Decoration` layer uses the same TileSet resource but has **no physics layer**. It's for visual-only tiles — background rocks, distant cave details, moss patches, dripping water sprites.

Set its **Z Index** to -1 so it renders behind the main terrain layer and the player.

This is the two-layer pattern from Chapter 11.6: a collision layer for gameplay and a decoration layer for visuals. You could add a third foreground layer (Z Index = 1) for tiles that render in front of the player — overhanging stalactites, fog wisps — but two layers are enough for now.

### Designing Level 01

Level design is both art and engineering. Here are practical rules for a first level:

**Teach through level geometry, not text.** The first few screens should silently teach the player what they can do:

1. **Flat ground** — the player runs left and right. They discover movement.
2. **A small gap** — the player must jump across. They discover jumping.
3. **A taller wall** — the player can't jump over it but can wall jump up it. They discover wall jumping.
4. **First crystal** — placed in the player's natural path. They discover collectibles.
5. **First hazard** — spikes at the bottom of a gap. They learn that falling isn't always safe.

Each element is introduced in isolation before being combined. Don't put spikes, enemies, and moving platforms in the same area until the player has encountered each one separately.

**Metrics to keep in mind:**

| Metric | Value | Why |
| --- | --- | --- |
| Viewport | 320×180 pixels | What the player sees at once |
| Tile size | 18×18 pixels | Grid unit |
| Tiles visible | ~17 wide × 10 tall | Viewport ÷ tile size |
| Player jump height | ~5 tiles | Based on JumpForce=300, Gravity=980 |
| Player jump distance | ~7 tiles (running) | Horizontal speed during jump arc |
| Max platform gap | 6 tiles | Leave margin — players should feel capable, not barely surviving |
| Min ceiling height | 3 tiles | Enough room to feel comfortable |

These numbers come directly from the physics values in Chapter 14. If you changed `JumpForce` or `Gravity`, test your jump height and distance in-game and adjust level geometry to match.

**Level length:** For a first level, aim for 4–6 screens wide (roughly 70–100 tiles horizontally). Short enough to complete in 2–3 minutes, long enough to feel like a real level. Our design document says 3 levels total — they should get progressively longer and harder.

### Camera Limits

The player's `Camera2D` follows them through the level, but we need to prevent it from showing the void beyond the level edges. In Chapter 12.2, we set camera limits.

For level-specific limits, add a script to the level scene that sets the camera limits on `_Ready()`:

```csharp
using Godot;

public partial class Level : Node2D
{
    [Export] public int CameraLimitLeft { get; set; } = 0;
    [Export] public int CameraLimitTop { get; set; } = 0;
    [Export] public int CameraLimitRight { get; set; } = 1800;
    [Export] public int CameraLimitBottom { get; set; } = 360;

    public override void _Ready()
    {
        var player = GetNode<CharacterBody2D>("Player");
        var camera = player.GetNode<Camera2D>("Camera2D");

        camera.LimitLeft = CameraLimitLeft;
        camera.LimitTop = CameraLimitTop;
        camera.LimitRight = CameraLimitRight;
        camera.LimitBottom = CameraLimitBottom;
    }
}
```

Save as `res://scenes/levels/Level.cs` and attach it to the `Level01` root node.

Export the limits so you can adjust them per-level in the Inspector. A level that's 100 tiles wide at 18px/tile has a right limit of 1800. A level that's 20 tiles tall has a bottom limit of 360. Set these to match your actual level geometry.

### Player Spawn

The `PlayerSpawn` (Marker2D) node marks where the player starts. Instance `player.tscn` as a child of the level scene and position it at the spawn point:

1. Drag `player.tscn` from the FileSystem panel into the Level01 scene tree.
2. Position it near the `PlayerSpawn` marker.

Alternatively, spawn the player from code:

```csharp
public override void _Ready()
{
    // ... camera limit code above ...

    var spawnPoint = GetNode<Marker2D>("PlayerSpawn");
    var player = GetNode<CharacterBody2D>("Player");
    player.GlobalPosition = spawnPoint.GlobalPosition;
}
```

This is cleaner when you need to respawn the player later (checkpoints, death) — you just move them back to a position rather than re-instancing the scene.

---

## 15.2 Platforms, Spikes, and Hazards

A level with only ground tiles is a running track. Hazards create tension — the player needs a reason to care about precision.

### Spikes — Instant Death

Spikes are the simplest hazard: touch them, die. Create a reusable spike scene:

```
Spike (Area2D)
├── Sprite2D
└── CollisionShape2D
```

Save as `res://scenes/objects/spike.tscn`.

The `Area2D` detects overlap with the player. We use an Area2D (not a StaticBody2D) because spikes don't physically block movement — the player passes through them and takes damage.

Configure collision:

```
Collision Layer: 4 (hazards)
Collision Mask:  2 (player)
```

This assumes layer assignments:

| Layer | Name |
| --- | --- |
| 1 | Terrain |
| 2 | Player |
| 3 | Enemies |
| 4 | Hazards |
| 5 | Collectibles |
| 6 | Interactables |

Name your layers in **Project → Project Settings → General → Layer Names → 2D Physics** — it makes the Inspector show names instead of numbers.

The spike script:

```csharp
using Godot;

public partial class Spike : Area2D
{
    public override void _Ready()
    {
        BodyEntered += OnBodyEntered;
    }

    private void OnBodyEntered(Node2D body)
    {
        if (body is Player player)
        {
            GameManager.Instance.TakeDamage(GameManager.Instance.MaxHealth); // Instant death
        }
    }
}
```

Spikes deal damage equal to max health — effectively instant death. We use the GameManager from Chapter 13 instead of hardcoding the death behavior, so the health system (Chapter 17) works automatically when we build it.

**Placing spikes in the level:** Instance `spike.tscn` into the level scene under the `Objects/Spikes` container. Position them at the bottom of pits, along walls, or on ceilings. A row of spikes across a pit bottom is a classic platformer pattern — the player must jump the gap or die.

**Tile-based spikes:** Alternatively, you can use spike tiles in your TileSet instead of separate scenes. Add spike tiles with no collision on the `Terrain` layer, and place an Area2D with a large collision rectangle over the spike region. The advantage of separate scenes is per-spike control (different sizes, rotations, animations). The advantage of tile-based spikes is faster level painting.

### Moving Platforms

Moving platforms add verticality and timing challenges. Create a scene:

```
MovingPlatform (AnimatableBody2D)
├── Sprite2D
└── CollisionShape2D
```

Save as `res://scenes/objects/moving_platform.tscn`.

**Why AnimatableBody2D?** We discussed this in Chapter 9.5 — `AnimatableBody2D` is a `StaticBody2D` that can move. When it moves, it carries the player standing on it. A regular `StaticBody2D` moved by code doesn't push the player — the player slides off. `AnimatableBody2D` handles this correctly.

```csharp
using Godot;

public partial class MovingPlatform : AnimatableBody2D
{
    [Export] public Vector2 TravelDistance { get; set; } = new Vector2(0, -72);
    [Export] public float Speed { get; set; } = 50f;
    [Export] public float PauseDuration { get; set; } = 0.5f;

    private Vector2 _startPosition;
    private Vector2 _endPosition;
    private bool _movingToEnd = true;
    private float _pauseTimer = 0f;

    public override void _Ready()
    {
        _startPosition = GlobalPosition;
        _endPosition = _startPosition + TravelDistance;
    }

    public override void _PhysicsProcess(double delta)
    {
        if (_pauseTimer > 0)
        {
            _pauseTimer -= (float)delta;
            return;
        }

        Vector2 target = _movingToEnd ? _endPosition : _startPosition;
        GlobalPosition = GlobalPosition.MoveToward(target, Speed * (float)delta);

        if (GlobalPosition.IsEqualApprox(target))
        {
            _movingToEnd = !_movingToEnd;
            _pauseTimer = PauseDuration;
        }
    }
}
```

`TravelDistance` is a vector — set it to `(0, -72)` for a platform that moves 4 tiles upward, or `(108, 0)` for one that moves 6 tiles to the right. The platform ping-pongs between start and end positions with a brief pause at each end.

**All values are exported.** Drop a `moving_platform.tscn` instance into a level, set the travel distance and speed in the Inspector, and done. Each instance can have different movement patterns without touching the script.

**Collision layer:** Set the platform to layer 1 (terrain). The player is already configured to collide with layer 1 from Chapter 14.

### Falling Platforms

A variation: platforms that fall when the player stands on them.

```
FallingPlatform (AnimatableBody2D)
├── Sprite2D
├── CollisionShape2D
├── PlayerDetector (Area2D)
│   └── CollisionShape2D
└── ShakeTimer (Timer)
```

```csharp
using Godot;

public partial class FallingPlatform : AnimatableBody2D
{
    [Export] public float ShakeDuration { get; set; } = 0.5f;
    [Export] public float FallSpeed { get; set; } = 200f;
    [Export] public float RespawnDelay { get; set; } = 3.0f;

    private Vector2 _startPosition;
    private bool _shaking = false;
    private bool _falling = false;
    private Timer _shakeTimer;

    public override void _Ready()
    {
        _startPosition = GlobalPosition;
        _shakeTimer = GetNode<Timer>("ShakeTimer");
        _shakeTimer.WaitTime = ShakeDuration;
        _shakeTimer.OneShot = true;
        _shakeTimer.Timeout += OnShakeTimerTimeout;

        var detector = GetNode<Area2D>("PlayerDetector");
        detector.BodyEntered += OnPlayerSteppedOn;
    }

    private void OnPlayerSteppedOn(Node2D body)
    {
        if (body is Player && !_shaking && !_falling)
        {
            _shaking = true;
            _shakeTimer.Start();
        }
    }

    private void OnShakeTimerTimeout()
    {
        _shaking = false;
        _falling = true;
    }

    public override void _PhysicsProcess(double delta)
    {
        if (_shaking)
        {
            // Visual shake — offset position randomly
            Position = _startPosition + new Vector2(
                (float)GD.RandRange(-1.0, 1.0), 0
            );
        }
        else if (_falling)
        {
            GlobalPosition += new Vector2(0, FallSpeed * (float)delta);

            // Reset after falling off screen
            if (GlobalPosition.Y > _startPosition.Y + 400)
            {
                _falling = false;
                GlobalPosition = _startPosition;
            }
        }
    }
}
```

The `PlayerDetector` Area2D extends slightly above the platform's top edge — it detects when the player lands on the platform, not when they touch it from the side. Set its collision shape to a thin rectangle covering just the top surface.

The sequence: player lands → platform shakes for 0.5 seconds (warning) → platform falls → after falling 400 pixels below start, it silently resets. The player sees the shake and learns to move quickly.

---

## 15.3 Checkpoints and Respawn

Without checkpoints, death means restarting the entire level. That's punishing — especially in longer levels. Checkpoints save progress within a level.

### Checkpoint Scene

```
Checkpoint (Area2D)
├── AnimatedSprite2D
└── CollisionShape2D
```

Save as `res://scenes/objects/checkpoint.tscn`.

The checkpoint has two visual states: inactive (flag down or unlit) and active (flag up or glowing). Use `AnimatedSprite2D` with two animations:

| Animation | Frames | Loop |
| --- | --- | --- |
| `inactive` | 1 frame | No |
| `active` | 1–4 frames (waving flag / glowing) | Yes |

```csharp
using Godot;

public partial class Checkpoint : Area2D
{
    [Signal] public delegate void CheckpointActivatedEventHandler(Vector2 position);

    private AnimatedSprite2D _sprite;
    private bool _isActive = false;

    public override void _Ready()
    {
        _sprite = GetNode<AnimatedSprite2D>("AnimatedSprite2D");
        _sprite.Play("inactive");
        BodyEntered += OnBodyEntered;
    }

    private void OnBodyEntered(Node2D body)
    {
        if (body is Player && !_isActive)
        {
            Activate();
        }
    }

    private void Activate()
    {
        _isActive = true;
        _sprite.Play("active");
        EmitSignal(SignalName.CheckpointActivated, GlobalPosition);
    }
}
```

Collision layers:

```
Layer: 6 (interactables)
Mask:  2 (player)
```

The checkpoint emits a signal with its position. The level script listens for this and stores the respawn point.

### Respawn System

The level script manages respawn. Add these to `Level.cs`:

```csharp
using Godot;

public partial class Level : Node2D
{
    [Export] public int CameraLimitLeft { get; set; } = 0;
    [Export] public int CameraLimitTop { get; set; } = 0;
    [Export] public int CameraLimitRight { get; set; } = 1800;
    [Export] public int CameraLimitBottom { get; set; } = 360;

    private Vector2 _respawnPosition;
    private CharacterBody2D _player;

    public override void _Ready()
    {
        _player = GetNode<CharacterBody2D>("Player");
        var camera = _player.GetNode<Camera2D>("Camera2D");

        camera.LimitLeft = CameraLimitLeft;
        camera.LimitTop = CameraLimitTop;
        camera.LimitRight = CameraLimitRight;
        camera.LimitBottom = CameraLimitBottom;

        var spawnPoint = GetNode<Marker2D>("PlayerSpawn");
        _player.GlobalPosition = spawnPoint.GlobalPosition;
        _respawnPosition = spawnPoint.GlobalPosition;

        // Connect all checkpoint signals
        foreach (var checkpoint in GetTree().GetNodesInGroup("checkpoints"))
        {
            if (checkpoint is Checkpoint cp)
            {
                cp.CheckpointActivated += OnCheckpointActivated;
            }
        }
    }

    private void OnCheckpointActivated(Vector2 position)
    {
        _respawnPosition = position;
    }

    public void RespawnPlayer()
    {
        _player.GlobalPosition = _respawnPosition;
        _player.Velocity = Vector2.Zero;
    }
}
```

For the group connection to work, add each `Checkpoint` instance to a group called `checkpoints`. Select the checkpoint node in the editor → Node panel → Groups tab → type `checkpoints` → click Add. Alternatively, add it from code in `Checkpoint._Ready()`:

```csharp
AddToGroup("checkpoints");
```

### Triggering Respawn

When should the player respawn? Two cases:

1. **Death** — health reaches 0 (handled by `GameManager.TakeDamage()`, which calls `GameOver()`). For now, we'll make death trigger a respawn instead of a game over screen — we'll add the proper game over screen in Chapter 17.

2. **Falling off the map** — the player falls below the level geometry into the void.

For case 2, add a kill zone below the level:

```
Level01 (Node2D)
├── ... (existing children)
└── KillZone (Area2D)
    └── CollisionShape2D
```

The `KillZone` is a long, thin rectangle stretching across the entire bottom of the level, positioned below the lowest visible terrain:

```csharp
using Godot;

public partial class KillZone : Area2D
{
    public override void _Ready()
    {
        BodyEntered += OnBodyEntered;
    }

    private void OnBodyEntered(Node2D body)
    {
        if (body is Player)
        {
            GameManager.Instance.TakeDamage(GameManager.Instance.MaxHealth);
        }
    }
}
```

Same as spikes — deals max damage for instant death. The `GameManager` then handles the respawn logic (which we'll connect in Chapter 17).

For now, add a temporary respawn call to `GameManager.GameOver()`:

```csharp
private void GameOver()
{
    GD.Print("Game Over!");
    // Temporary: respawn instead of showing game over screen
    ResetState();
    var level = ((SceneTree)Engine.GetMainLoop()).CurrentScene;
    if (level is Level currentLevel)
    {
        currentLevel.RespawnPlayer();
    }
}
```

This is placeholder code — Chapter 17 replaces it with a proper game over screen. But it lets us test the full death/respawn loop right now.

### Deactivating Old Checkpoints

When the player activates a new checkpoint, should the old one deactivate? In Crystal Caverns, yes — only the most recent checkpoint matters. Update the level script:

```csharp
private void OnCheckpointActivated(Vector2 position)
{
    _respawnPosition = position;

    // Deactivate all other checkpoints visually (optional)
    foreach (var node in GetTree().GetNodesInGroup("checkpoints"))
    {
        if (node is Checkpoint cp && cp.GlobalPosition != position)
        {
            // Checkpoints stay visually active but only the last one is the respawn point
            // No need to deactivate — the _respawnPosition variable handles it
        }
    }
}
```

Actually, the simplest approach: don't deactivate old checkpoints. They stay visually active (the flag stays up), but `_respawnPosition` only stores the latest one. Players understand intuitively that the last checkpoint touched is the active one.

---

## 15.4 Collectibles (Crystals)

Crystals are the core collectible in Crystal Caverns — scattered through each level for the player to find. They're the primary score mechanic.

### Crystal Scene

```
Crystal (Area2D)
├── AnimatedSprite2D
└── CollisionShape2D
```

Save as `res://scenes/objects/crystal.tscn`.

The crystal should look alive. Use `AnimatedSprite2D` with a short looping animation — 4 to 6 frames of the crystal rotating or glowing. If your asset pack doesn't have animated crystals, a single frame works too — we'll add a floating motion in code.

| Animation | Frames | FPS | Loop |
| --- | --- | --- | --- |
| `spin` | 4–6 frames | 8 | Yes |
| `collect` | 3–4 frames (flash/burst) | 12 | No |

The `collect` animation plays when the player picks up the crystal — a quick visual pop before the crystal disappears. If your art doesn't include a collect animation, skip it; the crystal will just vanish, which is fine.

Collision layers:

```
Layer: 5 (collectibles)
Mask:  2 (player)
```

### Crystal Script

```csharp
using Godot;

public partial class Crystal : Area2D
{
    [Export] public int Value { get; set; } = 1;

    private AnimatedSprite2D _sprite;
    private bool _collected = false;
    private Vector2 _startPosition;

    public override void _Ready()
    {
        _sprite = GetNode<AnimatedSprite2D>("AnimatedSprite2D");
        _sprite.Play("spin");
        _startPosition = Position;
        BodyEntered += OnBodyEntered;
    }

    public override void _Process(double delta)
    {
        if (!_collected)
        {
            // Gentle floating motion
            Position = _startPosition + new Vector2(
                0, Mathf.Sin((float)Time.GetTicksMsec() / 300f) * 2f
            );
        }
    }

    private void OnBodyEntered(Node2D body)
    {
        if (body is Player && !_collected)
        {
            Collect();
        }
    }

    private void Collect()
    {
        _collected = true;
        GameManager.Instance.AddScore(Value);

        // Play collect animation if it exists, then remove
        if (_sprite.SpriteFrames.HasAnimation("collect"))
        {
            _sprite.Play("collect");
            _sprite.AnimationFinished += () => QueueFree();
        }
        else
        {
            QueueFree();
        }

        // Disable collision immediately so it can't be collected twice
        var collisionShape = GetNode<CollisionShape2D>("CollisionShape2D");
        collisionShape.SetDeferred("disabled", true);
    }
}
```

Key details:

**Floating motion.** `Mathf.Sin()` with time creates a smooth up-and-down bob. The amplitude (2 pixels) is subtle. This runs in `_Process` (visual, not physics) and only while the crystal exists.

**`SetDeferred("disabled", true)`** — you can't disable a collision shape during a physics callback. Godot will error. `SetDeferred` queues the change to happen at the end of the frame.

**`_collected` flag** — prevents double collection. Without this, if two physics frames overlap the same crystal, `AddScore` runs twice.

**`QueueFree()`** — removes the crystal from the scene tree at the end of the frame. If there's a collect animation, we wait for it to finish first.

### Placing Crystals

Instance `crystal.tscn` into the level under `Objects/Crystals`. Place them:

- **Along the main path** — reward the player for forward progress.
- **Above platforms** — guide the player to jump to the right spot. Crystals act as breadcrumbs.
- **In hard-to-reach spots** — reward exploration and skilled movement. A crystal on a ledge that requires a wall jump teaches the player to wall jump.
- **In hidden areas** — behind fake walls, under falling platforms, in dead ends. Reward curiosity.

A good rule: place 10–15 crystals per level. Enough to feel rewarding, not so many that they lose meaning.

### Crystal Counter (Preview)

The GameManager already tracks score via `AddScore()`. We'll display it on screen in Chapter 17 when we build the HUD. For now, `GD.Print($"Score: {Score}")` in the GameManager confirms crystals are being counted.

---

## 15.5 Level Transitions and Doors

Our design document says 3 levels. The player needs a way to move from one to the next.

### Exit Door Scene

```
ExitDoor (Area2D)
├── AnimatedSprite2D
└── CollisionShape2D
```

Save as `res://scenes/objects/exit_door.tscn`.

The door has two states: locked (closed) and unlocked (open). For simplicity, we'll make it always unlocked — the player just walks to it and the level ends. If you want to require collecting all crystals first, we'll add that variant below.

| Animation | Frames | Loop |
| --- | --- | --- |
| `closed` | 1 frame | No |
| `open` | 1 frame (or 3–4 frame opening) | No |

```csharp
using Godot;

public partial class ExitDoor : Area2D
{
    [Export] public string NextLevelPath { get; set; } = "";
    [Export] public int RequiredCrystals { get; set; } = 0;

    private AnimatedSprite2D _sprite;
    private bool _transitioning = false;

    public override void _Ready()
    {
        _sprite = GetNode<AnimatedSprite2D>("AnimatedSprite2D");
        BodyEntered += OnBodyEntered;

        if (RequiredCrystals > 0)
        {
            _sprite.Play("closed");
        }
        else
        {
            _sprite.Play("open");
        }
    }

    private void OnBodyEntered(Node2D body)
    {
        if (body is Player && !_transitioning)
        {
            if (GameManager.Instance.Score >= RequiredCrystals)
            {
                StartTransition();
            }
        }
    }

    private void StartTransition()
    {
        _transitioning = true;

        if (NextLevelPath != "")
        {
            GetTree().ChangeSceneToFile(NextLevelPath);
        }
        else
        {
            GD.Print("No next level set — you win!");
            // Chapter 17 will add a victory screen here
        }
    }
}
```

Collision layers:

```
Layer: 6 (interactables)
Mask:  2 (player)
```

**`NextLevelPath`** is exported — set it in the Inspector for each door instance. For example:
- Level 01 door: `res://scenes/levels/level_02.tscn`
- Level 02 door: `res://scenes/levels/level_03.tscn`
- Level 03 door: empty string (game complete)

**`RequiredCrystals`** — set to 0 for an always-open door, or to a number (e.g., 5) to lock the door until the player has collected enough crystals. When locked, the door shows the `closed` animation.

### Door Polish

For a better transition, add a brief delay with the door opening before changing scenes:

```csharp
private async void StartTransition()
{
    _transitioning = true;
    _sprite.Play("open");

    // Wait for open animation if it has one
    if (_sprite.SpriteFrames.GetFrameCount("open") > 1)
    {
        await ToSignal(_sprite, AnimatedSprite2D.SignalName.AnimationFinished);
    }

    // Brief pause before scene change
    await ToSignal(GetTree().CreateTimer(0.5), SceneTreeTimer.SignalName.Timeout);

    if (NextLevelPath != "")
    {
        GetTree().ChangeSceneToFile(NextLevelPath);
    }
}
```

`ToSignal` is C#'s await-compatible way to wait for a Godot signal. `GetTree().CreateTimer(0.5)` creates a one-shot timer that fires after 0.5 seconds. Together, they create a short cinematic beat: door opens → brief pause → next level loads.

### Level State Reset

When changing levels, `GameManager` persists across scenes (it's an autoload). Score carries over. Health carries over. This is correct — the player's progress should survive level transitions.

However, within a level, respawning should not reset the score. The player already collected those crystals — taking them away on death feels punishing. Our current code handles this correctly: `ResetState()` resets score and health to defaults, but we only call it on game over, not on checkpoint respawn.

### Building Levels 02 and 03

Duplicate `level_01.tscn` as a starting point for each new level:

1. Right-click `level_01.tscn` in FileSystem → **Duplicate**.
2. Rename to `level_02.tscn`.
3. Open it and modify: rearrange tiles, add more hazards, change crystal placement, adjust camera limits.
4. Repeat for `level_03.tscn`.

Each level should introduce or escalate something:

| Level | New Elements | Difficulty |
| --- | --- | --- |
| Level 01 | Ground, gaps, crystals, spikes, 1 checkpoint | Easy — teaches basics |
| Level 02 | Moving platforms, falling platforms, wall jump sections, 2 checkpoints | Medium — combines mechanics |
| Level 03 | Tight platforming, more hazards, crystal requirements for door, 3 checkpoints | Hard — tests mastery |

Don't forget to update `NextLevelPath` on each level's exit door and set the main scene (**Project Settings → Application → Run → Main Scene**) to `level_01.tscn` or to a main menu scene (Chapter 17).

---

## 15.6 Parallax Background Layers

A static background makes a level feel like a box. Parallax layers — backgrounds that scroll at different speeds — create depth and atmosphere. We covered the theory in Chapter 12.7. Here's the practical application for Crystal Caverns.

### Parallax2D — Quick Recap

In Chapter 12.7 we learned that `Parallax2D` is the modern parallax node (introduced in Godot 4.3), replacing the deprecated `ParallaxBackground`/`ParallaxLayer` system. Each `Parallax2D` is a standalone `Node2D` — no wrapper node needed. One node per layer, each with its own scroll speed.

### The Parallax Setup

We already have the node structure in our level scene:

```text
FarParallax (Parallax2D)
└── Sprite2D
MidParallax (Parallax2D)
└── Sprite2D
NearParallax (Parallax2D)
└── Sprite2D
```

These are direct children of the level root, placed above the `Terrain` and `Decoration` nodes in the scene tree so they render behind everything else (nodes higher in the tree render first, which means behind).

Each layer needs a background image assigned to its `Sprite2D` child. Use the cavern background images from your asset pack:

- `art/backgrounds/cavern_bg_far.png` — distant cave wall, dark tones
- `art/backgrounds/cavern_bg_mid.png` — mid-ground rock formations
- `art/backgrounds/cavern_bg_near.png` — near stalactites, lighter tones

**Important:** The child sprite's top-left corner must align with the origin of the `Parallax2D` node. If you center the sprite at `(0, 0)` instead, the repeat loop breaks — you'll see gaps and misaligned seams. We covered this pitfall in Chapter 12.7.

### Configuring Each Layer

**FarParallax (Parallax2D):**

```text
Scroll Scale:  (0.1, 0.1)
Repeat Size:   (320, 0)
```

Scrolls at 10% of camera speed — very slow, very distant. `Repeat Size` tiles the content horizontally so it loops seamlessly as the camera pans. Set the X value to match your background image width (or the viewport width if the image is at least that wide). Y = 0 means no vertical repeat.

**MidParallax (Parallax2D):**

```text
Scroll Scale:  (0.3, 0.2)
Repeat Size:   (320, 0)
```

Scrolls at 30% horizontally, 20% vertically. Faster than the far layer but still clearly behind the terrain.

**NearParallax (Parallax2D):**

```text
Scroll Scale:  (0.6, 0.4)
Repeat Size:   (320, 0)
```

Scrolls at 60% — close to the action. This layer can have more detail: stalactites, crystal clusters, moss.

### Background Image Sizing

Each background image should be at least as wide and tall as the viewport (320×180). If smaller, the repeat will have visible seams. If larger, that's fine — it gives more visual variety before the image repeats.

For pixel art, make sure the background images are authored at the same pixel density as your tiles. A background painted at 1280×720 will look blurry when rendered in a 320×180 viewport with nearest-neighbor filtering. Paint or scale backgrounds to match the native resolution.

### Parallax Without Art

If you don't have parallax background art yet, you can fake depth with colored rectangles:

1. Add `ColorRect` nodes as children of each `Parallax2D` instead of `Sprite2D`.
2. Set sizes to cover the viewport.
3. Use increasingly lighter shades of blue-gray from far to near: `#1a1a2e`, `#2a2a3e`, `#3a3a4e`.

This creates a simple depth illusion that works surprisingly well. Replace with real art later.

---

## Summary

**Building levels (15.1):** Level scene with `Node2D` root, two TileMapLayers — `Terrain` (collision) and `Decoration` (visual-only), organized object containers, Marker2D for spawn, instanced player. Camera limits set per-level via exported values. Design levels to teach mechanics through geometry — introduce elements in isolation before combining them.

**Hazards (15.2):** Spikes as Area2D with instant-death damage. Moving platforms with `AnimatableBody2D` that ping-pong between two points. Falling platforms that shake before dropping. All scenes reusable with exported parameters.

**Checkpoints and respawn (15.3):** Checkpoint Area2D with active/inactive visual states, emits signal on activation. Level script stores latest respawn position. Kill zone below the level catches falling players. Group-based signal connection for clean checkpoint management.

**Collectibles (15.4):** Crystal Area2D with floating animation, collect feedback, and score integration via GameManager. Collision disabled with `SetDeferred` during pickup. Placement guides the player through the level.

**Level transitions (15.5):** Exit door Area2D with exported next-level path. Optional crystal requirement to lock the door. `ChangeSceneToFile()` for level transitions. Score and health persist across levels via GameManager autoload.

**Parallax backgrounds (15.6):** Three `Parallax2D` nodes (one per layer) with decreasing `Scroll Scale` for depth. `Repeat Size` for seamless horizontal tiling. Background images sized to match the native viewport resolution. Sprite origin aligned to top-left for correct repeat behavior.

---

**Next up: Chapter 16 — Enemies & AI.** We'll create patrol enemies that walk back and forth, implement the stomp mechanic for defeating them, add chasing AI with raycasts, build enemy spawners, and design a basic boss fight.
