# Chapter 16: Enemies & AI

---

## 16.1 Basic Enemy Scene (Patrol Left-Right)

A platformer without enemies is a walking simulator. Time to populate Crystal Caverns with things that want to hurt the player.

The simplest enemy archetype is the **patrol enemy** — a creature that walks back and forth between two points, reversing direction when it hits a wall or reaches a ledge. Think Goombas in Mario: no intelligence, no awareness of the player, just a predictable hazard that the player must time around.

### Enemy Scene Structure

Create a new scene with `CharacterBody2D` as the root. Enemies need physics — they walk on floors, collide with walls, and fall off ledges:

```
PatrolEnemy (CharacterBody2D)
├── AnimatedSprite2D
├── CollisionShape2D
├── WallDetector (RayCast2D)
├── FloorDetector (RayCast2D)
├── HurtBox (Area2D)
│   └── CollisionShape2D
├── StompDetector (Area2D)
│   └── CollisionShape2D
└── DeathParticles (GpuParticles2D)
```

Save as `res://scenes/enemies/patrol_enemy.tscn`.

**Why CharacterBody2D and not RigidBody2D?** We want full control over the enemy's movement — constant speed, instant direction reversal, no sliding or bouncing. `CharacterBody2D` with `MoveAndSlide()` gives us that. `RigidBody2D` would require applying forces and fighting the physics engine for predictable behavior.

### CharacterBody2D Configuration

Select the `PatrolEnemy` root node and configure:

```
Motion Mode: Grounded
Floor → Stop on Slope: true
Floor → Max Angle: 45°
```

Same settings we used for the player in Chapter 14.1. The enemy walks on the same terrain and follows the same floor rules.

### Collision Shape

Add a `CapsuleShape2D` or `RectangleShape2D` to the `CollisionShape2D`. Size it to match your enemy sprite — for a slime using Kenney's pack, something like 14×12 pixels works well.

### Collision Layers

In Chapter 15.2 we established the collision layer system:

| Layer | Name |
| --- | --- |
| 1 | Terrain |
| 2 | Player |
| 3 | Enemies |
| 4 | Hazards |
| 5 | Collectibles |
| 6 | Interactables |

Set the `PatrolEnemy` body:

```
Collision Layer: 3 (enemies)
Collision Mask: 1 (terrain)
```

The enemy exists on layer 3 so other things can detect it, and it only collides with terrain (layer 1). It doesn't collide with the player body directly — damage is handled through Area2D overlaps, not physics collisions. This keeps the player from getting stuck on enemies or pushed into walls.

### RayCast2D Detectors

The patrol enemy needs to know two things: "Is there a wall ahead?" and "Is there floor ahead?" Two `RayCast2D` nodes handle this.

**WallDetector:**

```
Target Position: (10, 0)    — points right (patrol direction)
Collision Mask: 1            — terrain only
Enabled: true
```

This ray shoots horizontally in the movement direction. When it collides with terrain, the enemy turns around. We'll flip its `TargetPosition.X` sign when the enemy changes direction.

**FloorDetector:**

```
Target Position: (10, 10)    — points down-right ahead of the enemy
Collision Mask: 1             — terrain only
Enabled: true
```

This ray points diagonally downward in the movement direction. When it *stops* colliding (no floor ahead), the enemy turns around — it won't walk off ledges.

We covered `RayCast2D` fundamentals in Chapter 10.5 — `IsColliding()`, `GetCollider()`, collision masks, and the difference between node-based raycasts and one-off physics queries. The enemy uses node-based raycasts because they need to check every physics frame.

### AnimatedSprite2D Setup

Create a `SpriteFrames` resource with these animations:

| Animation | Frames | FPS | Loop |
| --- | --- | --- | --- |
| walk | 4–6 | 8 | Yes |
| death | 3–4 | 10 | No |

If you're using Kenney's assets, the slime spritesheet has walk frames and a squished frame for death.

### The Patrol Script

```csharp
using Godot;

public partial class PatrolEnemy : CharacterBody2D
{
    [Export] public float MoveSpeed { get; set; } = 40f;
    [Export] public float Gravity { get; set; } = 980f;

    private AnimatedSprite2D _sprite;
    private RayCast2D _wallDetector;
    private RayCast2D _floorDetector;
    private int _direction = 1; // 1 = right, -1 = left

    public override void _Ready()
    {
        _sprite = GetNode<AnimatedSprite2D>("AnimatedSprite2D");
        _wallDetector = GetNode<RayCast2D>("WallDetector");
        _floorDetector = GetNode<RayCast2D>("FloorDetector");
        _sprite.Play("walk");
    }

    public override void _PhysicsProcess(double delta)
    {
        // Apply gravity
        if (!IsOnFloor())
        {
            Velocity = new Vector2(Velocity.X, Velocity.Y + Gravity * (float)delta);
        }

        // Check for wall or ledge
        if (_wallDetector.IsColliding() || !_floorDetector.IsColliding())
        {
            Reverse();
        }

        Velocity = new Vector2(_direction * MoveSpeed, Velocity.Y);
        MoveAndSlide();
    }

    private void Reverse()
    {
        _direction *= -1;
        _sprite.FlipH = _direction < 0;

        // Flip raycast directions
        var wallTarget = _wallDetector.TargetPosition;
        _wallDetector.TargetPosition = new Vector2(-wallTarget.X, wallTarget.Y);

        var floorTarget = _floorDetector.TargetPosition;
        _floorDetector.TargetPosition = new Vector2(-floorTarget.X, floorTarget.Y);
    }
}
```

**Why flip `TargetPosition` instead of rotating the node?** RayCast2D `TargetPosition` is relative to the node's own position. Flipping the X component points the ray in the opposite direction without rotating the collision shape or the sprite. It's simpler and avoids coordinate system surprises.

### Tuning Patrol Speed

40 pixels/second is a good starting point for a slow, predictable enemy. For reference, the player moves at 130 px/s — the enemy is about a third of player speed. This gives the player plenty of time to react, jump over, or stomp.

If your enemy feels too fast or too slow, adjust `MoveSpeed` in the Inspector — it's exported. You can have different speeds per enemy instance: a slow slime in level 01 and a faster one in level 03.

### Placing Patrol Enemies in Levels

Instance `patrol_enemy.tscn` into your level scene under an `Enemies` container node:

```
Level01 (Node2D)
├── ...
├── Objects (Node2D)
│   ├── Crystals (Node2D)
│   ├── ...
│   └── Enemies (Node2D)
│       ├── PatrolEnemy
│       └── PatrolEnemy2
```

Position each enemy on a platform. The `FloorDetector` raycast keeps them from walking off edges, so they'll patrol the length of whatever platform you place them on. No waypoints, no path configuration — just drop them and they work.

---

## 16.2 Enemy-Player Interaction (Damage, Stomp)

The patrol enemy walks back and forth, but it's harmless. The player can walk straight through it. Time to make it dangerous — and killable.

The interaction model is the classic Mario contract:

- **Touch the enemy from the side or below → player takes damage**
- **Land on the enemy from above → enemy dies**

This requires two Area2D nodes on the enemy: a `HurtBox` that damages the player, and a `StompDetector` that detects when the player lands on top.

### HurtBox — Dealing Damage to the Player

The `HurtBox` is an Area2D that covers the enemy's body. When the player enters it, the player takes damage.

**HurtBox configuration:**

```
Collision Layer: 4 (hazards)
Collision Mask: 2 (player)
```

The shape should roughly match the enemy's visual body but can be slightly smaller for fairness — the same "generous hitbox" principle from Chapter 14.1.

Add the signal connection and damage logic to `PatrolEnemy.cs`:

```csharp
private Area2D _hurtBox;

public override void _Ready()
{
    _sprite = GetNode<AnimatedSprite2D>("AnimatedSprite2D");
    _wallDetector = GetNode<RayCast2D>("WallDetector");
    _floorDetector = GetNode<RayCast2D>("FloorDetector");
    _hurtBox = GetNode<Area2D>("HurtBox");
    _sprite.Play("walk");

    _hurtBox.BodyEntered += OnHurtBoxBodyEntered;
}

private void OnHurtBoxBodyEntered(Node2D body)
{
    if (body is Player)
    {
        GameManager.Instance.TakeDamage(1);
    }
}
```

### StompDetector — Getting Stomped by the Player

The `StompDetector` is a separate Area2D positioned at the **top** of the enemy. It's a thin, wide shape — think of it as the enemy's "head." When the player's body overlaps this zone *while falling*, the enemy dies.

**StompDetector configuration:**

```
Collision Layer: 0 (nothing — it doesn't need to be detected)
Collision Mask: 2 (player)
```

**Shape placement:** A thin rectangle on top of the enemy collision shape. For a 14×12 enemy, something like 12×4 pixels positioned at the very top. The stomp zone must be above the hurtbox — if the player enters the stomp zone, they shouldn't also trigger damage.

### Why Two Separate Areas?

You might wonder: "Can't I use one Area2D and check if the player is above or below?" You can, but it's fragile. Checking relative Y positions breaks when the player approaches at an angle, when sprites have asymmetric shapes, or when the player is moving horizontally while slightly above. Two dedicated zones with clear shapes give reliable, predictable results — the same hitbox/hurtbox pattern we designed in the Chapter 13.2 folder structure.

### The Stomp Logic

```csharp
private Area2D _stompDetector;
private bool _isDead = false;

public override void _Ready()
{
    // ... existing code ...
    _stompDetector = GetNode<Area2D>("StompDetector");
    _stompDetector.BodyEntered += OnStompDetectorBodyEntered;
}

private void OnStompDetectorBodyEntered(Node2D body)
{
    if (body is Player player && !_isDead)
    {
        // Only count as stomp if player is falling
        if (player.Velocity.Y > 0)
        {
            Die();
            // Bounce the player upward
            player.Velocity = new Vector2(player.Velocity.X, -200f);
        }
    }
}
```

**Why check `Velocity.Y > 0`?** The player must be moving downward (falling) for a stomp to count. Without this check, a player jumping upward through the stomp zone would also kill the enemy — that doesn't feel right.

**Why bounce the player?** After stomping an enemy, the player gets a small upward boost. This serves two purposes: it confirms the stomp happened (feedback) and it gives the player time to land safely instead of falling into where the enemy was. The -200 value is less than the full jump force (-300) — a half-bounce, not a full jump.

### Preventing Stomp-and-Damage Simultaneously

There's a race condition: the player lands on the enemy, and both the `StompDetector` and `HurtBox` fire in the same frame. The player stomps the enemy *and* takes damage. That feels terrible.

Fix it by checking `_isDead` in the hurtbox handler:

```csharp
private void OnHurtBoxBodyEntered(Node2D body)
{
    if (body is Player && !_isDead)
    {
        GameManager.Instance.TakeDamage(1);
    }
}
```

And making sure `Die()` sets `_isDead = true` *before* anything else:

```csharp
private void Die()
{
    _isDead = true;

    // Disable all collision
    _hurtBox.GetNode<CollisionShape2D>("CollisionShape2D").SetDeferred("disabled", true);
    _stompDetector.GetNode<CollisionShape2D>("CollisionShape2D").SetDeferred("disabled", true);

    // Stop movement
    Velocity = Vector2.Zero;
    MoveSpeed = 0;

    // Play death animation
    _sprite.Play("death");

    // Emit particles
    var particles = GetNode<GpuParticles2D>("DeathParticles");
    particles.Emitting = true;

    // Remove after animation
    _sprite.AnimationFinished += () => QueueFree();
}
```

**Why `SetDeferred`?** We can't disable collision shapes during a physics callback — Godot will error. `SetDeferred` queues the change for the next frame, which is safe. We used this same pattern for crystal collection in Chapter 15.4.

### Exposing the Bounce Force

The player bounce after a stomp is hardcoded to -200. That works, but to keep things configurable:

```csharp
[Export] public float StompBounceForce { get; set; } = 200f;
```

Then in the stomp handler:

```csharp
player.Velocity = new Vector2(player.Velocity.X, -StompBounceForce);
```

### Sound Effects

Add an `AudioStreamPlayer2D` to the enemy scene for the stomp sound:

```
PatrolEnemy (CharacterBody2D)
├── ...
└── StompSound (AudioStreamPlayer2D)
```

Play it in `Die()`:

```csharp
var stompSound = GetNode<AudioStreamPlayer2D>("StompSound");
stompSound.Play();
```

If you want the sound to finish playing after the enemy is freed, parent the `AudioStreamPlayer2D` to the level instead, or use `AudioServer` — but for a short stomp sound effect, it's fine. `QueueFree()` happens after the death animation, and the sound is shorter than the animation.

### Damage Feedback on the Player

Right now, touching an enemy calls `GameManager.Instance.TakeDamage(1)` and... nothing visible happens. The player's health decreases but there's no visual feedback. We'll build the full HUD and damage flash in Chapter 17, but for now, add invincibility frames to prevent the player from taking damage every single frame while overlapping an enemy.

Add to your `Player.cs`:

```csharp
private bool _isInvincible = false;
private float _invincibilityTimer = 0f;
private const float InvincibilityDuration = 1.5f;

public void TakeHit(int damage)
{
    if (_isInvincible) return;

    GameManager.Instance.TakeDamage(damage);
    _isInvincible = true;
    _invincibilityTimer = InvincibilityDuration;

    // Visual feedback — flash the sprite
    BlinkSprite();
}

private async void BlinkSprite()
{
    var sprite = GetNode<AnimatedSprite2D>("AnimatedSprite2D");
    while (_isInvincible)
    {
        sprite.Modulate = new Color(1, 1, 1, 0.3f);
        await ToSignal(GetTree().CreateTimer(0.1), SceneTreeTimer.SignalName.Timeout);
        sprite.Modulate = new Color(1, 1, 1, 1.0f);
        await ToSignal(GetTree().CreateTimer(0.1), SceneTreeTimer.SignalName.Timeout);
    }
    sprite.Modulate = new Color(1, 1, 1, 1.0f);
}

public override void _PhysicsProcess(double delta)
{
    if (_isInvincible)
    {
        _invincibilityTimer -= (float)delta;
        if (_invincibilityTimer <= 0)
        {
            _isInvincible = false;
        }
    }

    // ... rest of physics process
}
```

Now update the enemy's hurtbox to call `TakeHit` instead of `TakeDamage` directly:

```csharp
private void OnHurtBoxBodyEntered(Node2D body)
{
    if (body is Player player && !_isDead)
    {
        player.TakeHit(1);
    }
}
```

The sprite blinks rapidly (alternating between 30% and 100% opacity) for 1.5 seconds. During this window, additional hits are ignored. This is the same invincibility frame pattern used by nearly every platformer — it prevents a single enemy from draining all three health points in a fraction of a second.

---

## 16.3 Chasing AI with Raycasts

Patrol enemies are predictable — the player memorizes their pattern and jumps over them. Chasing enemies add tension. They ignore the player until they spot them, then pursue.

### Detection with RayCast2D

Add a `PlayerDetector` raycast to the enemy scene:

```
ChaserEnemy (CharacterBody2D)
├── AnimatedSprite2D
├── CollisionShape2D
├── WallDetector (RayCast2D)
├── FloorDetector (RayCast2D)
├── PlayerDetector (RayCast2D)
├── HurtBox (Area2D)
│   └── CollisionShape2D
├── StompDetector (Area2D)
│   └── CollisionShape2D
├── DetectionZone (Area2D)
│   └── CollisionShape2D
└── DeathParticles (GpuParticles2D)
```

Save as `res://scenes/enemies/chaser_enemy.tscn`.

The detection system uses two mechanisms:

1. **DetectionZone (Area2D)** — a large circular area that checks if the player is *nearby*
2. **PlayerDetector (RayCast2D)** — a ray aimed at the player that checks for *line of sight*

Both must be true for the enemy to chase: the player must be within range *and* the ray must reach them without hitting terrain first. This prevents the enemy from "seeing through walls."

### DetectionZone Configuration

```
Collision Layer: 0 (nothing)
Collision Mask: 2 (player)
```

Use a `CircleShape2D` with a radius of about 80–100 pixels. That's roughly 5–6 tiles of awareness — enough to feel threatening without being omniscient.

### PlayerDetector RayCast2D

```
Target Position: (0, 0)     — we'll set this dynamically in code
Collision Mask: 1, 2         — terrain and player
Enabled: true
```

The ray aims at the player's position every frame. If it hits terrain first, the enemy doesn't have line of sight. If it hits the player (or nothing is blocking), the enemy gives chase.

### Enemy States

A chasing enemy has behavior that changes based on context. The simplest way to manage this is an enum-based state machine:

```csharp
using Godot;

public partial class ChaserEnemy : CharacterBody2D
{
    private enum State
    {
        Patrol,
        Chase,
        Return
    }

    [Export] public float PatrolSpeed { get; set; } = 40f;
    [Export] public float ChaseSpeed { get; set; } = 80f;
    [Export] public float Gravity { get; set; } = 980f;
    [Export] public float DetectionRadius { get; set; } = 100f;

    private State _currentState = State.Patrol;
    private AnimatedSprite2D _sprite;
    private RayCast2D _wallDetector;
    private RayCast2D _floorDetector;
    private RayCast2D _playerDetector;
    private Area2D _detectionZone;
    private Area2D _hurtBox;
    private Area2D _stompDetector;
    private int _direction = 1;
    private bool _isDead = false;
    private Player _targetPlayer = null;
    private Vector2 _homePosition;

    public override void _Ready()
    {
        _sprite = GetNode<AnimatedSprite2D>("AnimatedSprite2D");
        _wallDetector = GetNode<RayCast2D>("WallDetector");
        _floorDetector = GetNode<RayCast2D>("FloorDetector");
        _playerDetector = GetNode<RayCast2D>("PlayerDetector");
        _detectionZone = GetNode<Area2D>("DetectionZone");
        _hurtBox = GetNode<Area2D>("HurtBox");
        _stompDetector = GetNode<Area2D>("StompDetector");
        _homePosition = GlobalPosition;

        _detectionZone.BodyEntered += OnDetectionZoneBodyEntered;
        _detectionZone.BodyExited += OnDetectionZoneBodyExited;
        _hurtBox.BodyEntered += OnHurtBoxBodyEntered;
        _stompDetector.BodyEntered += OnStompDetectorBodyEntered;

        _sprite.Play("walk");
    }

    private void OnDetectionZoneBodyEntered(Node2D body)
    {
        if (body is Player player)
        {
            _targetPlayer = player;
        }
    }

    private void OnDetectionZoneBodyExited(Node2D body)
    {
        if (body is Player)
        {
            _targetPlayer = null;
        }
    }

    public override void _PhysicsProcess(double delta)
    {
        if (_isDead) return;

        // Apply gravity
        if (!IsOnFloor())
        {
            Velocity = new Vector2(Velocity.X, Velocity.Y + Gravity * (float)delta);
        }

        switch (_currentState)
        {
            case State.Patrol:
                ProcessPatrol();
                break;
            case State.Chase:
                ProcessChase();
                break;
            case State.Return:
                ProcessReturn();
                break;
        }

        MoveAndSlide();
        UpdateAnimation();
    }
}
```

### Patrol State

Same behavior as the basic patrol enemy — walk, check for walls and ledges, reverse:

```csharp
private void ProcessPatrol()
{
    // Check for wall or ledge
    if (_wallDetector.IsColliding() || !_floorDetector.IsColliding())
    {
        ReverseDirection();
    }

    Velocity = new Vector2(_direction * PatrolSpeed, Velocity.Y);

    // Transition: player detected with line of sight?
    if (_targetPlayer != null && HasLineOfSight())
    {
        _currentState = State.Chase;
    }
}
```

### Chase State

Move toward the player at chase speed. Stop chasing if the player leaves detection range or line of sight is lost:

```csharp
private void ProcessChase()
{
    if (_targetPlayer == null || !HasLineOfSight())
    {
        _currentState = State.Return;
        return;
    }

    // Move toward player
    float directionToPlayer = Mathf.Sign(_targetPlayer.GlobalPosition.X - GlobalPosition.X);
    _direction = (int)directionToPlayer;
    _sprite.FlipH = _direction < 0;

    // Update raycast directions to match movement
    UpdateRaycastDirections();

    // Don't walk off ledges even while chasing
    if (!_floorDetector.IsColliding())
    {
        Velocity = new Vector2(0, Velocity.Y);
        _currentState = State.Return;
        return;
    }

    Velocity = new Vector2(_direction * ChaseSpeed, Velocity.Y);
}
```

**Why stop at ledges during chase?** A chasing enemy that walks off a cliff to reach the player looks stupid. It also removes the player's ability to use the environment — luring an enemy to a ledge should be a valid strategy, not a free kill. If you want flying or jumping enemies later, those would be different scene types with different rules.

### Return State

After losing the player, the enemy walks back toward its starting position and resumes patrolling:

```csharp
private void ProcessReturn()
{
    float distanceToHome = _homePosition.X - GlobalPosition.X;

    if (Mathf.Abs(distanceToHome) < 5f)
    {
        // Close enough to home — resume patrol
        _currentState = State.Patrol;
        return;
    }

    _direction = (int)Mathf.Sign(distanceToHome);
    _sprite.FlipH = _direction < 0;
    UpdateRaycastDirections();

    Velocity = new Vector2(_direction * PatrolSpeed, Velocity.Y);

    // If player re-enters detection, chase again
    if (_targetPlayer != null && HasLineOfSight())
    {
        _currentState = State.Chase;
    }
}
```

### Line of Sight Check

```csharp
private bool HasLineOfSight()
{
    if (_targetPlayer == null) return false;

    // Aim the raycast at the player
    _playerDetector.TargetPosition = _targetPlayer.GlobalPosition - GlobalPosition;
    _playerDetector.ForceRaycastUpdate();

    if (!_playerDetector.IsColliding()) return true; // Nothing blocking

    // Something is blocking — is it the player?
    var collider = _playerDetector.GetCollider();
    return collider == _targetPlayer;
}
```

`ForceRaycastUpdate()` recalculates the ray immediately instead of waiting for the next physics frame. We need fresh data because we just changed `TargetPosition` — without the forced update, we'd be checking stale collision data from the previous frame's ray direction.

### Helper Methods

```csharp
private void ReverseDirection()
{
    _direction *= -1;
    _sprite.FlipH = _direction < 0;
    UpdateRaycastDirections();
}

private void UpdateRaycastDirections()
{
    _wallDetector.TargetPosition = new Vector2(_direction * Mathf.Abs(_wallDetector.TargetPosition.X), _wallDetector.TargetPosition.Y);
    _floorDetector.TargetPosition = new Vector2(_direction * Mathf.Abs(_floorDetector.TargetPosition.X), _floorDetector.TargetPosition.Y);
}
```

### Animation Updates

```csharp
private void UpdateAnimation()
{
    if (_isDead) return;

    if (_currentState == State.Chase)
    {
        _sprite.Play("walk");
        _sprite.SpeedScale = 1.5f; // Faster animation when chasing
    }
    else
    {
        _sprite.Play("walk");
        _sprite.SpeedScale = 1.0f;
    }
}
```

Using `SpeedScale` to speed up the walk animation during chase is a cheap trick that communicates "this enemy is now faster" without needing separate chase animation frames. If you have chase-specific sprites, use a separate animation name instead.

### Damage and Stomping

The hurtbox and stomp logic is identical to the patrol enemy from section 16.2. Copy the same `OnHurtBoxBodyEntered`, `OnStompDetectorBodyEntered`, and `Die()` methods — or better yet, we'll extract a shared base class later in this section.

```csharp
private void OnHurtBoxBodyEntered(Node2D body)
{
    if (body is Player player && !_isDead)
    {
        player.TakeHit(1);
    }
}

private void OnStompDetectorBodyEntered(Node2D body)
{
    if (body is Player player && !_isDead)
    {
        if (player.Velocity.Y > 0)
        {
            Die();
            player.Velocity = new Vector2(player.Velocity.X, -200f);
        }
    }
}

private void Die()
{
    _isDead = true;
    _hurtBox.GetNode<CollisionShape2D>("CollisionShape2D").SetDeferred("disabled", true);
    _stompDetector.GetNode<CollisionShape2D>("CollisionShape2D").SetDeferred("disabled", true);
    Velocity = Vector2.Zero;
    _sprite.Play("death");
    var particles = GetNode<GpuParticles2D>("DeathParticles");
    particles.Emitting = true;
    _sprite.AnimationFinished += () => QueueFree();
}
```

### Visual Feedback for Detection

An optional touch: change the enemy's appearance when it spots the player. A simple color shift works:

```csharp
// In ProcessChase, at the start:
_sprite.Modulate = new Color(1.2f, 0.8f, 0.8f); // Slight red tint

// In ProcessPatrol and ProcessReturn:
_sprite.Modulate = Colors.White;
```

This signals to the player that the enemy is aware of them. Subtle, but it creates a moment of tension — "it sees me."

---

## 16.4 Enemy Spawners

Placing enemies by hand works for a few, but some levels need enemies that reappear after being defeated, or waves of enemies that spawn during a challenge room. A spawner handles this.

### Spawner Scene

```
EnemySpawner (Node2D)
├── SpawnTimer (Timer)
└── SpawnMarker (Marker2D)
```

Save as `res://scenes/enemies/enemy_spawner.tscn`.

The spawner is invisible — no sprite, no collision. It just instantiates enemy scenes at a position on a timer.

### Spawner Script

```csharp
using Godot;

public partial class EnemySpawner : Node2D
{
    [Export] public PackedScene EnemyScene { get; set; }
    [Export] public int MaxEnemies { get; set; } = 3;
    [Export] public float SpawnInterval { get; set; } = 5.0f;
    [Export] public bool SpawnOnReady { get; set; } = true;

    private Timer _spawnTimer;
    private Marker2D _spawnMarker;
    private int _aliveCount = 0;

    public override void _Ready()
    {
        _spawnTimer = GetNode<Timer>("SpawnTimer");
        _spawnMarker = GetNode<Marker2D>("SpawnMarker");

        _spawnTimer.WaitTime = SpawnInterval;
        _spawnTimer.Timeout += OnSpawnTimerTimeout;
        _spawnTimer.Start();

        if (SpawnOnReady)
        {
            SpawnEnemy();
        }
    }

    private void OnSpawnTimerTimeout()
    {
        if (_aliveCount < MaxEnemies)
        {
            SpawnEnemy();
        }
    }

    private void SpawnEnemy()
    {
        if (EnemyScene == null) return;

        var enemy = EnemyScene.Instantiate<Node2D>();
        enemy.GlobalPosition = _spawnMarker.GlobalPosition;

        // Track when the enemy dies
        enemy.TreeExiting += () => _aliveCount--;

        GetParent().AddChild(enemy);
        _aliveCount++;
    }
}
```

### How It Works

1. **`EnemyScene`** — drag any enemy `.tscn` into this export in the Inspector. The spawner doesn't care what type of enemy it creates — patrol, chaser, or anything else. It just instantiates whatever `PackedScene` you assign.

2. **`MaxEnemies`** — the spawner won't create more than this many living enemies at once. If all 3 are alive, the timer fires but nothing happens. When one dies, the next timer tick spawns a replacement.

3. **`TreeExiting` signal** — every `Node` emits this signal when it's about to be removed from the scene tree (including `QueueFree()`). We connect to it to decrement the alive count. No custom signal needed on the enemy — it works with any node that gets freed.

4. **`GetParent().AddChild(enemy)`** — the enemy is added as a sibling of the spawner, not a child of it. This keeps the spawner's subtree clean and ensures the enemy lives in the same container node as hand-placed enemies.

### Using the Spawner

In the level scene, add spawners wherever you want enemies to respawn:

```
Level02 (Node2D)
├── ...
├── Objects (Node2D)
│   ├── ...
│   └── Enemies (Node2D)
│       ├── PatrolEnemy          (hand-placed, one-time)
│       ├── EnemySpawner         (respawns patrol enemies)
│       └── EnemySpawner2        (respawns chaser enemies)
```

Select each `EnemySpawner`, and in the Inspector, drag the appropriate `.tscn` file into the `EnemyScene` property. Set `MaxEnemies` and `SpawnInterval` per instance.

### Spawn Animations

A bare instantiation looks jarring — the enemy just pops into existence. A simple spawn effect:

```csharp
private void SpawnEnemy()
{
    if (EnemyScene == null) return;

    var enemy = EnemyScene.Instantiate<Node2D>();
    enemy.GlobalPosition = _spawnMarker.GlobalPosition;
    enemy.TreeExiting += () => _aliveCount--;

    // Spawn effect: scale from zero
    enemy.Scale = Vector2.Zero;
    var tween = CreateTween();
    tween.TweenProperty(enemy, "scale", Vector2.One, 0.3f)
        .SetEase(Tween.EaseType.Out)
        .SetTrans(Tween.TransitionType.Back);

    GetParent().AddChild(enemy);
    _aliveCount++;
}
```

`Tween.TransitionType.Back` creates a slight overshoot — the enemy scales up to slightly larger than normal, then settles to 1.0. It's a bouncy pop-in that feels natural for a game character appearing.

### One-Shot Spawner Variant

Not every spawner should loop. A triggered spawner activates once when the player enters an area — useful for ambush rooms or surprise encounters:

```csharp
[Export] public bool OneShot { get; set; } = false;
[Export] public int WaveSize { get; set; } = 1;

private bool _triggered = false;

public void Trigger()
{
    if (_triggered && OneShot) return;
    _triggered = true;

    for (int i = 0; i < WaveSize; i++)
    {
        SpawnEnemy();
    }
}
```

Connect this to a trigger Area2D in the level:

```csharp
// In the level script or on a trigger zone
private void OnAmbushZoneBodyEntered(Node2D body)
{
    if (body is Player)
    {
        var spawner = GetNode<EnemySpawner>("Enemies/AmbushSpawner");
        spawner.Trigger();
    }
}
```

When the player walks into the ambush zone, the spawner creates a wave of enemies. If `OneShot` is true, it only fires once — walking through the zone again does nothing.

---

## 16.5 Boss Fight Basics

A boss fight is a capstone encounter — a test of everything the player has learned. For Crystal Caverns, we'll build a basic boss for the end of level 03: a larger enemy with a health bar, distinct attack phases, and a vulnerability window.

### Boss Design

Keep the scope manageable. This is Chapter 16, not a boss fight masterclass. The design:

| Element | Description |
| --- | --- |
| Name | Cave Guardian |
| Size | 2–3× larger than regular enemies |
| Health | 5 hits |
| Attack 1 | Charge — rushes toward the player |
| Attack 2 | Ground pound — jumps and creates shockwaves |
| Vulnerability | Stunned for 2 seconds after charge hits a wall |
| Defeat | Stomp during stun window (5 times) |

The boss alternates between charging and ground pounding. After a charge, it slams into a wall and becomes stunned — that's the player's window to jump on its head. After taking a hit, it enters the next phase (faster charges, more shockwaves).

### Boss Scene Structure

```
CaveGuardian (CharacterBody2D)
├── AnimatedSprite2D
├── CollisionShape2D
├── HurtBox (Area2D)
│   └── CollisionShape2D
├── StompDetector (Area2D)
│   └── CollisionShape2D
├── ShockwaveSpawn (Marker2D)
├── StunTimer (Timer)
├── AttackCooldown (Timer)
└── HealthBar (TextureProgressBar)
```

Save as `res://scenes/enemies/cave_guardian.tscn`.

### Collision Configuration

```
CaveGuardian body:
  Collision Layer: 3 (enemies)
  Collision Mask: 1 (terrain)

HurtBox:
  Collision Layer: 4 (hazards)
  Collision Mask: 2 (player)

StompDetector:
  Collision Layer: 0
  Collision Mask: 2 (player)
```

Same pattern as regular enemies. The boss is just bigger.

### Boss State Machine

The boss has more states than a patrol enemy. An enum keeps it organized:

```csharp
using Godot;

public partial class CaveGuardian : CharacterBody2D
{
    private enum BossState
    {
        Idle,
        Charge,
        GroundPound,
        Stunned,
        Defeated
    }

    [Export] public int MaxHealth { get; set; } = 5;
    [Export] public float ChargeSpeed { get; set; } = 200f;
    [Export] public float Gravity { get; set; } = 980f;
    [Export] public float StunDuration { get; set; } = 2.0f;
    [Export] public float AttackCooldownTime { get; set; } = 1.5f;

    private BossState _state = BossState.Idle;
    private int _currentHealth;
    private AnimatedSprite2D _sprite;
    private Area2D _hurtBox;
    private Area2D _stompDetector;
    private Timer _stunTimer;
    private Timer _attackCooldown;
    private TextureProgressBar _healthBar;
    private Player _player;
    private int _direction = -1;

    public override void _Ready()
    {
        _currentHealth = MaxHealth;
        _sprite = GetNode<AnimatedSprite2D>("AnimatedSprite2D");
        _hurtBox = GetNode<Area2D>("HurtBox");
        _stompDetector = GetNode<Area2D>("StompDetector");
        _stunTimer = GetNode<Timer>("StunTimer");
        _attackCooldown = GetNode<Timer>("AttackCooldown");
        _healthBar = GetNode<TextureProgressBar>("HealthBar");

        _stunTimer.WaitTime = StunDuration;
        _stunTimer.OneShot = true;
        _stunTimer.Timeout += OnStunTimerTimeout;

        _attackCooldown.WaitTime = AttackCooldownTime;
        _attackCooldown.OneShot = true;
        _attackCooldown.Timeout += OnAttackCooldownTimeout;

        _hurtBox.BodyEntered += OnHurtBoxBodyEntered;
        _stompDetector.BodyEntered += OnStompDetectorBodyEntered;

        _healthBar.MaxValue = MaxHealth;
        _healthBar.Value = MaxHealth;

        // Find the player in the scene
        _player = GetTree().GetFirstNodeInGroup("player") as Player;
    }
}
```

**Finding the player:** The boss needs a reference to the player for targeting. Using groups is cleaner than `GetNode` with a hardcoded path — add the player to a `"player"` group (in Player's `_Ready`: `AddToGroup("player")`), and the boss finds it at runtime regardless of scene tree structure.

### The Physics Loop

```csharp
public override void _PhysicsProcess(double delta)
{
    if (_state == BossState.Defeated) return;

    if (!IsOnFloor())
    {
        Velocity = new Vector2(Velocity.X, Velocity.Y + Gravity * (float)delta);
    }

    switch (_state)
    {
        case BossState.Idle:
            ProcessIdle();
            break;
        case BossState.Charge:
            ProcessCharge();
            break;
        case BossState.GroundPound:
            ProcessGroundPound((float)delta);
            break;
        case BossState.Stunned:
            ProcessStunned();
            break;
    }

    MoveAndSlide();
}
```

### Idle State — Choosing an Attack

```csharp
private void ProcessIdle()
{
    Velocity = new Vector2(0, Velocity.Y);
    _sprite.Play("idle");

    // Face the player
    if (_player != null)
    {
        _direction = _player.GlobalPosition.X < GlobalPosition.X ? -1 : 1;
        _sprite.FlipH = _direction < 0;
    }

    // Wait for attack cooldown to finish
    if (_attackCooldown.IsStopped())
    {
        ChooseAttack();
    }
}

private void ChooseAttack()
{
    // Alternate attacks, more ground pounds at low health
    float groundPoundChance = 1.0f - ((float)_currentHealth / MaxHealth);

    if (GD.Randf() < groundPoundChance)
    {
        StartGroundPound();
    }
    else
    {
        StartCharge();
    }
}
```

The boss gets more aggressive as health decreases. At full health, it mostly charges. At 1 HP, ground pounds dominate. This creates natural escalation without explicit phase transitions.

### Charge Attack

```csharp
private void StartCharge()
{
    _state = BossState.Charge;
    _sprite.Play("charge");

    // Face the player before charging
    if (_player != null)
    {
        _direction = _player.GlobalPosition.X < GlobalPosition.X ? -1 : 1;
        _sprite.FlipH = _direction < 0;
    }
}

private void ProcessCharge()
{
    Velocity = new Vector2(_direction * ChargeSpeed, Velocity.Y);

    // Hit a wall? Become stunned
    if (IsOnWall())
    {
        StartStun();
    }
}
```

The charge is simple: lock direction, move fast, stop when hitting a wall. The player's job is to dodge (jump over) and wait for the wall impact.

### Stun State — The Vulnerability Window

```csharp
private void StartStun()
{
    _state = BossState.Stunned;
    Velocity = Vector2.Zero;
    _sprite.Play("stunned");
    _stunTimer.Start();

    // Screen shake for impact
    var camera = GetTree().GetFirstNodeInGroup("player")?.GetNode<Camera2D>("Camera2D");
    if (camera != null)
    {
        camera.Offset = new Vector2(
            (float)GD.RandRange(-2.0, 2.0),
            (float)GD.RandRange(-2.0, 2.0)
        );
    }
}

private void ProcessStunned()
{
    Velocity = new Vector2(0, Velocity.Y);

    // Visual: shake in place
    _sprite.Offset = new Vector2((float)GD.RandRange(-1.0, 1.0), 0);
}

private void OnStunTimerTimeout()
{
    _sprite.Offset = Vector2.Zero;
    _state = BossState.Idle;
    _attackCooldown.Start();
}
```

During the stun window, the boss shakes in place (tiny random offset on the sprite). The `StompDetector` is always active, but stomping only deals damage during the stun — we'll add that check next.

### Ground Pound Attack

```csharp
private float _groundPoundStartY;
private bool _isRising = false;

private void StartGroundPound()
{
    _state = BossState.GroundPound;
    _isRising = true;
    _groundPoundStartY = GlobalPosition.Y;
    Velocity = new Vector2(0, -250f); // Jump up
    _sprite.Play("jump");
}

private void ProcessGroundPound(float delta)
{
    if (_isRising)
    {
        // Move toward player horizontally while rising
        if (_player != null)
        {
            float targetX = _player.GlobalPosition.X;
            float moveX = Mathf.MoveToward(GlobalPosition.X, targetX, 100f * delta);
            GlobalPosition = new Vector2(moveX, GlobalPosition.Y);
        }

        // Start falling when upward velocity runs out
        if (Velocity.Y >= 0)
        {
            _isRising = false;
            Velocity = new Vector2(0, 400f); // Fast drop
            _sprite.Play("ground_pound");
        }
    }
    else
    {
        // Falling — did we hit the ground?
        if (IsOnFloor())
        {
            OnGroundPoundLand();
        }
    }
}

private void OnGroundPoundLand()
{
    // Screen shake
    var camera = GetTree().GetFirstNodeInGroup("player")?.GetNode<Camera2D>("Camera2D");
    if (camera != null)
    {
        camera.Offset = new Vector2(
            (float)GD.RandRange(-3.0, 3.0),
            (float)GD.RandRange(-3.0, 3.0)
        );
    }

    SpawnShockwave();

    _state = BossState.Idle;
    _attackCooldown.Start();
    _sprite.Play("idle");
}
```

The ground pound has three phases: rise (jump up while drifting toward the player's X position), fall (straight down, fast), and land (shockwave + screen shake). The player must avoid the landing spot and the shockwave.

### Shockwave

The shockwave is a simple Area2D that expands outward from the impact point:

```csharp
[Export] public PackedScene ShockwaveScene { get; set; }

private void SpawnShockwave()
{
    if (ShockwaveScene == null) return;

    var shockwave = ShockwaveScene.Instantiate<Node2D>();
    shockwave.GlobalPosition = GetNode<Marker2D>("ShockwaveSpawn").GlobalPosition;
    GetParent().AddChild(shockwave);
}
```

Create a separate shockwave scene:

```
Shockwave (Area2D)
├── CollisionShape2D (RectangleShape2D)
└── AnimatedSprite2D
```

Save as `res://scenes/enemies/shockwave.tscn`.

```csharp
using Godot;

public partial class Shockwave : Area2D
{
    [Export] public float ExpandSpeed { get; set; } = 300f;
    [Export] public float MaxWidth { get; set; } = 150f;

    private CollisionShape2D _shape;
    private float _currentWidth = 0f;

    public override void _Ready()
    {
        _shape = GetNode<CollisionShape2D>("CollisionShape2D");
        BodyEntered += OnBodyEntered;

        // Collision setup
        CollisionLayer = 1 << 3; // Layer 4 (hazards) — zero-indexed bit
        CollisionMask = 1 << 1;  // Layer 2 (player) — zero-indexed bit
    }

    public override void _Process(double delta)
    {
        _currentWidth += ExpandSpeed * (float)delta;

        if (_currentWidth >= MaxWidth)
        {
            QueueFree();
            return;
        }

        // Expand the collision shape
        var rect = _shape.Shape as RectangleShape2D;
        if (rect != null)
        {
            rect.Size = new Vector2(_currentWidth, 10);
        }
    }

    private void OnBodyEntered(Node2D body)
    {
        if (body is Player player)
        {
            player.TakeHit(1);
        }
    }
}
```

The shockwave expands horizontally from the impact point. The player must jump over it. It auto-destroys when reaching max width.

**Note:** Setting collision layers in code uses zero-indexed bit positions: `1 << 3` means bit 3 (layer 4), `1 << 1` means bit 1 (layer 2). Alternatively, set these in the Inspector on the shockwave scene — that's less error-prone.

### Stomping the Boss

The stomp only works during the stun window:

```csharp
private void OnStompDetectorBodyEntered(Node2D body)
{
    if (body is Player player && _state == BossState.Stunned)
    {
        if (player.Velocity.Y > 0)
        {
            TakeDamage();
            player.Velocity = new Vector2(player.Velocity.X, -250f);
        }
    }
}

private void TakeDamage()
{
    _currentHealth--;
    _healthBar.Value = _currentHealth;

    // Flash red
    _sprite.Modulate = new Color(1, 0.3f, 0.3f);
    var tween = CreateTween();
    tween.TweenProperty(_sprite, "modulate", Colors.White, 0.3f);

    if (_currentHealth <= 0)
    {
        Defeat();
    }
    else
    {
        // Increase difficulty: faster charges
        ChargeSpeed += 20f;
        AttackCooldownTime = Mathf.Max(0.5f, AttackCooldownTime - 0.2f);
        _attackCooldown.WaitTime = AttackCooldownTime;

        // Exit stun immediately after being hit
        _stunTimer.Stop();
        _sprite.Offset = Vector2.Zero;
        _state = BossState.Idle;
        _attackCooldown.Start();
    }
}
```

Each hit makes the boss faster — charge speed increases by 20 px/s and the cooldown between attacks shrinks by 0.2 seconds (minimum 0.5s). The fight naturally escalates without needing discrete "phase 2" logic.

### Defeat

```csharp
private async void Defeat()
{
    _state = BossState.Defeated;
    Velocity = Vector2.Zero;

    // Disable collision
    _hurtBox.GetNode<CollisionShape2D>("CollisionShape2D").SetDeferred("disabled", true);
    _stompDetector.GetNode<CollisionShape2D>("CollisionShape2D").SetDeferred("disabled", true);
    _healthBar.Visible = false;

    // Death animation — flash and shrink
    _sprite.Play("stunned");
    for (int i = 0; i < 5; i++)
    {
        _sprite.Modulate = new Color(1, 0.3f, 0.3f);
        await ToSignal(GetTree().CreateTimer(0.15), SceneTreeTimer.SignalName.Timeout);
        _sprite.Modulate = Colors.White;
        await ToSignal(GetTree().CreateTimer(0.15), SceneTreeTimer.SignalName.Timeout);
    }

    var tween = CreateTween();
    tween.TweenProperty(this, "scale", Vector2.Zero, 0.5f)
        .SetEase(Tween.EaseType.In)
        .SetTrans(Tween.TransitionType.Back);
    await ToSignal(tween, Tween.SignalName.Finished);

    QueueFree();
}
```

The defeat sequence: flash red 5 times, shrink to nothing, then free. It's dramatic enough to feel like a real boss kill without requiring custom animation frames.

### Health Bar Setup

The `TextureProgressBar` sits above the boss sprite. Configure it:

```
Size: (40, 6)
Position: (-20, -30)     — centered above the boss, adjust to your sprite size
Min Value: 0
Max Value: 5              — matches MaxHealth (set in code)
Value: 5
```

For the textures, you can use simple colored rectangles:
- **Under texture:** dark gray bar (the background)
- **Progress texture:** red or green bar (current health)

Or use `StyleBoxFlat` resources for a code-free approach: set `ProgressBar` custom theme overrides with a red `fill` style and dark `background` style.

The health bar moves with the boss automatically since it's a child node. No extra code needed for positioning.

### Boss Arena

The boss fight needs a contained arena. In the level scene:

1. Place the `CaveGuardian` in a flat area with walls on both sides.
2. Add a trigger Area2D at the arena entrance.
3. When the player enters, close the entrance with an `AnimatableBody2D` or `StaticBody2D` that slides into place.
4. When the boss is defeated, open the path forward.

```csharp
// In the level script
private void OnBossArenaEntered(Node2D body)
{
    if (body is Player)
    {
        // Close the arena entrance
        var gate = GetNode<AnimatableBody2D>("BossArena/EntranceGate");
        var tween = CreateTween();
        tween.TweenProperty(gate, "position:y",
            gate.Position.Y - 36, 0.5f); // Slide gate down

        // Connect to boss defeat
        var boss = GetNode<CaveGuardian>("BossArena/CaveGuardian");
        boss.TreeExiting += OnBossDefeated;
    }
}

private void OnBossDefeated()
{
    // Open the exit
    var exitGate = GetNode<AnimatableBody2D>("BossArena/ExitGate");
    var tween = CreateTween();
    tween.TweenProperty(exitGate, "position:y",
        exitGate.Position.Y + 36, 0.5f);
}
```

The arena entrance closes behind the player (no running away), and the exit opens after the boss dies. Simple containment that makes the fight feel like an event.

### Boss Fight Summary

The complete interaction loop:

1. Player enters arena → gate closes
2. Boss idles, faces the player
3. Boss charges toward the player → player jumps over
4. Boss hits the wall → stunned for 2 seconds
5. Player stomps the boss during stun window → boss takes 1 damage
6. Boss recovers, now slightly faster
7. Repeat with increasing charge speed and more ground pounds
8. At 0 HP → defeat animation → exit gate opens

Five stomps to win. Each stomp makes the next cycle harder. The player needs to master jumping (from Chapter 14) and reading enemy patterns (learned from patrol enemies earlier in this chapter).

---

## Summary

**Patrol enemies (16.1):** `CharacterBody2D` with two RayCast2D detectors — one for walls ahead, one for floor ahead. Reverses direction on wall collision or ledge detection. Walk animation, configurable speed, placed per-instance in the level.

**Damage and stomping (16.2):** Two Area2D zones — `HurtBox` damages the player on side contact, `StompDetector` kills the enemy when the player lands from above (positive Y velocity). `SetDeferred` disables collision during death. Invincibility frames on the player prevent multi-hit damage. Sprite blinking provides visual feedback during invincibility.

**Chasing AI (16.3):** Enum-based state machine with Patrol, Chase, and Return states. `DetectionZone` (Area2D) checks proximity, `PlayerDetector` (RayCast2D) checks line of sight. Both must be true to chase. Enemy won't walk off ledges while chasing. Returns to home position when line of sight is lost.

**Enemy spawners (16.4):** `Node2D` with `PackedScene` export — instantiates any enemy type on a timer. `MaxEnemies` cap prevents flooding. `TreeExiting` signal tracks alive count without custom enemy code. Tween scale-in for spawn animation. One-shot variant for triggered ambush rooms.

**Boss fight (16.5):** `CaveGuardian` with charge and ground pound attacks. Stunned after hitting a wall during charge — that's the stomp window. Health scales difficulty: faster charges and shorter cooldowns as HP drops. Shockwave Area2D expands horizontally on ground pound. `TextureProgressBar` health bar. Arena gates close on entry, open on defeat.

---

**Next up: Chapter 17 — Polishing the Platformer.** We'll build the HUD (health hearts, score display), create menus (main menu, pause, game over), add sound effects and music, implement screen transitions, and add the final layer of game feel that ties everything together.
