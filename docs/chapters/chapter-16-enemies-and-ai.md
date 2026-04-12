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
└── StompDetector (Area2D)
    └── CollisionShape2D
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

Add a `CapsuleShape2D` or `RectangleShape2D` to the `CollisionShape2D`. Size it to match your enemy sprite — for a slime using Kenney's Pixel Platformer pack (24×24 character sprites), something like 20×16 pixels works well. Slightly smaller than the visual for fairness.

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
Target Position: (20, 15)    — points down-right ahead of the enemy
Collision Mask: 1             — terrain only
Enabled: true
```

This ray points diagonally downward in the movement direction. When it *stops* colliding (no floor ahead), the enemy turns around — it won't walk off ledges.

**Why (20, 15)?** The ray starts at the enemy's origin (center of the 24×24 sprite). X = 20 looks far enough ahead to catch ledge edges before the enemy walks off. Y = 15 extends past the bottom of the collision shape (~12px below origin) to reliably reach the floor tile beneath. Too short and the ray misses the floor → the enemy thinks there's a ledge and reverses every frame.

We covered `RayCast2D` fundamentals in Chapter 10.5 — `IsColliding()`, `GetCollider()`, collision masks, and the difference between node-based raycasts and one-off physics queries. The enemy uses node-based raycasts because they need to check every physics frame.

### AnimatedSprite2D Setup

Create a `SpriteFrames` resource with these animations:

| Animation | Frames | FPS | Loop |
| --- | --- | --- | --- |
| walk | 2 | 8 | Yes |
| stomped | 1 | 10 | No |

Kenney's Pixel Platformer pack includes 24×24 enemy sprites: a 2-frame walk cycle and a single squished "stomped" frame. That's all you need — the walk loop handles patrol, and the stomped frame plays once on death before the enemy is freed.

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

        // Check for wall or ledge — only when grounded.
        // Without the IsOnFloor() guard, raycasts fire while the enemy
        // is still falling after spawn (floor detector sees nothing →
        // Reverse() every frame → enemy shakes in place).
        if (IsOnFloor() && (_wallDetector.IsColliding() || !_floorDetector.IsColliding()))
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

**Shape placement:** A thin rectangle on top of the enemy collision shape. For a 20×16 enemy collision, something like 18×4 pixels positioned at the very top. The stomp zone must be above the hurtbox — if the player enters the stomp zone, they shouldn't also trigger damage.

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
    _sprite.Play("stomped");

    // Remove after a short delay (stomped is a single frame, no AnimationFinished)
    var timer = GetTree().CreateTimer(0.4);
    timer.Timeout += QueueFree;
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

If you want the sound to finish playing after the enemy is freed, parent the `AudioStreamPlayer2D` to the level instead, or use `AudioServer` — but for a short stomp sound effect, it's fine. `QueueFree()` happens after a 0.4-second delay showing the stomped sprite, and the sound is shorter than that.

### Damage Feedback on the Player

Right now, touching an enemy calls `GameManager.Instance.TakeDamage(1)` and... nothing visible happens. The player's health decreases but there's no visual feedback. Time to fix that — when the player takes a hit, we want three things to happen: play the hurt animation, knock the player back, and grant invincibility frames.

### Hurt Animation Setup

Add a `hurt` animation to the player's `SpriteFrames` resource:

| Animation | Frames | FPS | Loop |
| --- | --- | --- | --- |
| hurt | 1 | 10 | No |

This is the single hurt sprite from Kenney's pack. It plays once and holds on that frame.

### The TakeHit Method

Add to your `Player.cs`:

```csharp
private bool _isInvincible = false;
private float _invincibilityTimer = 0f;
private const float InvincibilityDuration = 1.5f;
private bool _isHurt = false;
private float _hurtTimer = 0f;
private const float HurtDuration = 0.5f;

[Export] public float KnockbackHorizontal { get; set; } = 100f;
[Export] public float KnockbackVertical { get; set; } = 150f;

public void TakeHit(int damage, Vector2 enemyPosition)
{
    if (_isInvincible) return;

    GameManager.Instance.TakeDamage(damage);

    // Knockback — push away from the enemy and slightly upward
    float knockbackDirection = Mathf.Sign(GlobalPosition.X - enemyPosition.X);
    if (knockbackDirection == 0) knockbackDirection = 1; // Default to right if directly on top
    Velocity = new Vector2(knockbackDirection * KnockbackHorizontal, -KnockbackVertical);

    // Hurt state — locks out movement input briefly
    _isHurt = true;
    _hurtTimer = HurtDuration;
    _sprite.Play("hurt");

    // Invincibility frames
    _isInvincible = true;
    _invincibilityTimer = InvincibilityDuration;
    BlinkSprite();
}
```

**Why pass `enemyPosition`?** The knockback direction depends on *where* the hit came from. The player gets pushed away from the enemy — if the enemy is to the left, the player flies right. Without this, you'd have to guess which way to push, and guessing wrong sends the player *into* the enemy.

### Hurt State in the Physics Loop

During the hurt window, the player can't control movement — the knockback plays out uninterrupted. After `HurtDuration` (0.5 seconds), control returns:

```csharp
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

    if (_isHurt)
    {
        _hurtTimer -= (float)delta;
        if (_hurtTimer <= 0)
        {
            _isHurt = false;
        }

        // During hurt: apply gravity and move, but ignore input
        ApplyGravity((float)delta);
        MoveAndSlide();
        return; // Skip all input handling
    }

    // ... rest of physics process (movement, jump, etc.)
}
```

The `return` is key — it skips `HandleMovement()`, `HandleJump()`, and `UpdateAnimation()` entirely. The player is at the mercy of physics for half a second. Gravity still applies (so they arc naturally), but they can't run, jump, or change direction mid-knockback.

### Update the Animation Method

The hurt animation should override all other animations while active:

```csharp
private void UpdateAnimation()
{
    if (_isHurt)
    {
        _sprite.Play("hurt");
        return;
    }

    // ... existing animation logic (airborne → moving → idle)
}
```

### Sprite Blinking During Invincibility

After the hurt animation ends (0.5s), the player regains control but is still invincible for another second. During this window, the sprite blinks to communicate "you can't be hit right now":

```csharp
private async void BlinkSprite()
{
    while (_isInvincible)
    {
        _sprite.Modulate = new Color(1, 1, 1, 0.3f);
        await ToSignal(GetTree().CreateTimer(0.1), SceneTreeTimer.SignalName.Timeout);
        _sprite.Modulate = new Color(1, 1, 1, 1.0f);
        await ToSignal(GetTree().CreateTimer(0.1), SceneTreeTimer.SignalName.Timeout);
    }
    _sprite.Modulate = new Color(1, 1, 1, 1.0f);
}
```

The blink alternates between 30% and 100% opacity every 0.1 seconds. It runs for the full 1.5-second invincibility window — including the 0.5 seconds of hurt stun. The player sees: hurt sprite + blinking → regain control + still blinking → blinking stops.

### Update the Enemy HurtBox

Now update the enemy's hurtbox to call `TakeHit` with the enemy's position:

```csharp
private void OnHurtBoxBodyEntered(Node2D body)
{
    if (body is Player player && !_isDead)
    {
        player.TakeHit(1, GlobalPosition);
    }
}
```

### The Full Sequence

Here's what the player experiences when touching an enemy:

1. **Frame 0:** HurtBox detects player → `TakeHit(1, enemyPos)` fires
2. **Frame 0:** Health decreases, velocity set to knockback, hurt animation plays, blinking starts
3. **Frames 1–30 (0.5s):** Player flies backward in an arc, no input accepted, hurt sprite showing, blinking
4. **Frame 30:** `_isHurt` expires, player regains full control, normal animations resume, still blinking
5. **Frame 90 (1.5s):** `_isInvincible` expires, blinking stops, player is fully vulnerable again

The knockback values (100 horizontal, 150 vertical) are starting points. If the player barely moves, increase them. If they fly off the screen, decrease them. They're exported, so you can tune per-project in the Inspector without touching code.

### Applying the Same Treatment to Hazards

Right now, enemies feel polished — knockback, hurt animation, i-frames. But spikes from Chapter 15.2 still kill the player with a silent `TakeDamage(MaxHealth)` call. No animation, no knockback, just instant health = 0. Spikes are still meant to be lethal (that's the design from Chapter 13.1), but the death moment should *feel* like something happened — the player flies back, the hurt sprite plays, and then the death registers.

The fix is to route spikes through `TakeHit` too, just with full health as the damage value:

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
            player.TakeHit(GameManager.Instance.MaxHealth, GlobalPosition);
        }
    }
}
```

Now when the player touches a spike: health drops to 0 (triggering game over), the player gets knocked away from the spike, and the hurt sprite plays during the knockback. Same visual treatment as taking enemy damage, but lethal.

**Why `MaxHealth` and not a hardcoded number?** If you ever change the player's max health (e.g., add a heart upgrade), spikes still kill in one touch. The damage scales with whatever the cap is.

**Why pass `GlobalPosition`?** Same reason as enemies: the knockback direction is calculated relative to the hit source. A floor spike pushes the player up and away. A wall spike pushes them sideways. The player visibly recoils from whatever hurt them.

### What About the Kill Zone?

The `KillZone` from Chapter 15.3 (the Area2D below the level that catches falling players) should **stay** as a silent instant death. Knocking the player back from a kill zone would push them further down into the void — there's nothing to recoil from. Falling off the world is a clean reset, not a damage event.

Leave `KillZone.cs` as it was — direct `TakeDamage(MaxHealth)` call, no `TakeHit`.

The rule of thumb: **lethal hazards that exist *in* the level should use `TakeHit`** (spikes, lava surfaces, crushers). **Boundary failures stay silent** (kill zones, falling off the world).

---

## 16.3 Chasing AI — The Cave Bat

Patrol enemies are predictable — the player memorizes their pattern and jumps over them. Chasing enemies add tension. They ignore the player until they spot them, then pursue.

For Crystal Caverns, the chaser is a **Cave Bat** — a flying enemy that hovers in dark corners of the cave, waits silently, and swoops toward the player when detected. Flight changes the rules of engagement: the bat isn't bound to the floor, so the player can't out-jump it the way they can a patrol enemy. They have to hide behind walls or run.

### Bat-Specific Design

The bat has three sprite frames from Kenney's pack: **wings up**, **wings straight**, and **wings down**. Played in sequence, they form a natural flapping animation. There's **no stomped sprite** — the bat isn't meant to squish. Instead, when stomped, we apply a soft diagonal knockback, blink the sprite, and `QueueFree` after a short delay. The visual reads as "the bat is dazed and tumbles away."

| Element | Description |
| --- | --- |
| Movement | Flying — no gravity while alive |
| Sprite frames | 3 — wings up, wings straight, wings down |
| Animation | `fly` (3-frame loop at 10 FPS) |
| Stomp behavior | Soft diagonal knockback + blink + free (no squish sprite) |
| Detection | Same as any chaser: proximity + line of sight |
| Terrain collision | **None** — the bat ignores all tiles and passes through walls, ceilings, and platforms |

### Scene Tree

The bat's scene is simpler than a ground chaser — no wall or floor detection needed, because the bat passes through terrain entirely:

```
CaveBat (CharacterBody2D)
├── AnimatedSprite2D
├── CollisionShape2D
├── PlayerDetector (RayCast2D)
├── HurtBox (Area2D)
│   └── CollisionShape2D
├── StompDetector (Area2D)
│   └── CollisionShape2D
└── DetectionZone (Area2D)
    └── CollisionShape2D
```

Save as `res://scenes/enemies/cave_bat.tscn`.

### Making the Bat Phase Through Terrain

This is the key change that makes the bat work as a flying enemy without restructuring your tileset. Configure the `CaveBat` root `CharacterBody2D`:

```
Collision Layer: 3 (enemies)
Collision Mask: 0 (nothing)
```

**Layer 3** means other things can still detect the bat — the player's stomp detector on layer 2 can see it, and anything filtering for enemies can find it in queries.

**Mask 0** means the bat collides with *nothing*. No terrain, no other enemies, no walls, no one-way platforms. `MoveAndSlide()` still updates the bat's position using its velocity, but there's nothing to slide against — it phases straight through every tile in the level.

The `HurtBox`, `StompDetector`, and `DetectionZone` keep their normal masks (layer 2 for player detection). The phase-through only applies to the physics body, not the damage zones. The bat can hurt the player through a one-way platform, through a wall, through anywhere its hurtbox overlaps the player.

**Why no `WallDetector` or `FloorDetector`?** Both raycasts existed to *react* to terrain — reverse at walls, stop at ledges. A bat that ignores terrain has nothing to react to. The raycasts would fire against tiles that the bat is about to fly straight through, which is pointless. We drop both nodes from the scene tree.

**Isn't flying through walls a bug?** In many games, yes. In platformers with bats specifically, no — it's a genre convention. Castlevania's Medusa Heads, Hollow Knight's Vengeflies, Super Metroid's flying enemies — all phase through terrain. The design reads as "this enemy is ethereal / supernatural / too small to block" rather than "the collision is broken." The player learns the rule quickly: walls don't save you from bats, only distance does. That tension is the whole point of having a flying chaser in a platformer.

**Important: place bats thoughtfully.** Because the bat ignores terrain, it can follow the player *anywhere* — including areas where the player has no room to maneuver. Don't place a bat's home position inside a wall (it'll spawn embedded in geometry) or in a dead-end where the player has no escape route. See the placement tips at the end of this section.

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

### Bat States

The bat has three behavioral states: **Idle** (hovering at its home position), **Chase** (flying toward the player), and **Return** (flying back home after losing sight). An enum-based state machine keeps it clean:

```csharp
using Godot;

public partial class CaveBat : CharacterBody2D
{
    private enum State
    {
        Idle,
        Chase,
        Return,
        Dying
    }

    [Export] public float ChaseSpeed { get; set; } = 90f;
    [Export] public float ReturnSpeed { get; set; } = 60f;
    [Export] public float HoverAmplitude { get; set; } = 3f;
    [Export] public float HoverFrequency { get; set; } = 2f;

    private State _currentState = State.Idle;
    private AnimatedSprite2D _sprite;
    private RayCast2D _playerDetector;
    private Area2D _detectionZone;
    private Area2D _hurtBox;
    private Area2D _stompDetector;
    private bool _isDead = false;
    private Player _targetPlayer = null;
    private Vector2 _homePosition;

    public override void _Ready()
    {
        _sprite = GetNode<AnimatedSprite2D>("AnimatedSprite2D");
        _playerDetector = GetNode<RayCast2D>("PlayerDetector");
        _detectionZone = GetNode<Area2D>("DetectionZone");
        _hurtBox = GetNode<Area2D>("HurtBox");
        _stompDetector = GetNode<Area2D>("StompDetector");
        _homePosition = GlobalPosition;

        _detectionZone.BodyEntered += OnDetectionZoneBodyEntered;
        _detectionZone.BodyExited += OnDetectionZoneBodyExited;
        _hurtBox.BodyEntered += OnHurtBoxBodyEntered;
        _stompDetector.BodyEntered += OnStompDetectorBodyEntered;

        _sprite.Play("fly");
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
        if (_isDead)
        {
            // When dying, gravity pulls the bat down
            Velocity = new Vector2(Velocity.X, Velocity.Y + 980f * (float)delta);
            MoveAndSlide();
            return;
        }

        switch (_currentState)
        {
            case State.Idle:
                ProcessIdle((float)delta);
                break;
            case State.Chase:
                ProcessChase();
                break;
            case State.Return:
                ProcessReturn();
                break;
        }

        MoveAndSlide();
    }
}
```

**Why gravity only applies when dying?** A living bat flies — gravity is off. A dead bat falls — gravity turns on. Using `_isDead` as the switch means the bat has zero-gravity behavior during normal play and natural falling behavior during its death animation. Same `_PhysicsProcess` method, different physics model depending on state.

### Idle State — Hovering

Unlike the patrol enemy that walks back and forth, the bat hovers in place at its spawn point. It doesn't move horizontally, just bobs up and down gently:

```csharp
private void ProcessIdle(float delta)
{
    // Bob up and down using a sine wave
    float yOffset = Mathf.Sin((float)Time.GetTicksMsec() / 1000f * HoverFrequency) * HoverAmplitude;
    GlobalPosition = new Vector2(_homePosition.X, _homePosition.Y + yOffset);
    Velocity = Vector2.Zero;

    // Transition: player detected with line of sight?
    if (_targetPlayer != null && HasLineOfSight())
    {
        _currentState = State.Chase;
    }
}
```

The sine wave takes `Time.GetTicksMsec()` (milliseconds since game start), scales by `HoverFrequency` (cycles per second), and multiplies by `HoverAmplitude` (how many pixels up/down). Default values — 2 Hz, 3 pixels — give a subtle 6-pixel vertical bob that reads as "alive but resting."

We directly set `GlobalPosition` instead of using velocity because the hover is a fixed pattern relative to the home position, not a physics simulation. Using velocity would accumulate drift over time.

### Chase State — Flying Toward the Player

The bat flies in a straight line toward the player. Because it's a flying enemy, movement is a 2D vector — it can travel diagonally, up, down, or sideways:

```csharp
private void ProcessChase()
{
    if (_targetPlayer == null || !HasLineOfSight())
    {
        _currentState = State.Return;
        return;
    }

    // Direction vector from bat to player
    Vector2 toPlayer = (_targetPlayer.GlobalPosition - GlobalPosition).Normalized();
    _sprite.FlipH = toPlayer.X < 0;

    Velocity = toPlayer * ChaseSpeed;
}
```

**Why normalize the direction vector?** `Normalized()` scales the vector to length 1, preserving direction but discarding magnitude. Multiplying by `ChaseSpeed` then gives consistent speed regardless of how far away the player is. Without normalization, a distant player would cause the bat to fly at 500+ px/s while a nearby player would cause it to crawl.

**No wall check needed.** Because the bat ignores terrain (mask 0), there's nothing to avoid — it flies in a straight line toward the player, through any tiles in the way. The `HasLineOfSight()` check above uses a separate raycast that *does* collide with terrain (to break the chase when a wall gets between bat and player), but the movement itself is unobstructed.

**Why does line of sight still matter if the bat can fly through walls?** Two reasons. First, it gives the player a way to break the chase — running behind a wall makes the bat return home, creating a legitimate escape strategy instead of an inevitable death spiral. Second, it's more interesting behavior than "the bat always knows where you are" — the bat feels like a creature with senses rather than an omniscient tracker.

### Return State — Flying Home

When the bat loses the player (out of range or line of sight blocked), it flies back to its hover position:

```csharp
private void ProcessReturn()
{
    Vector2 toHome = _homePosition - GlobalPosition;

    if (toHome.Length() < 5f)
    {
        // Close enough to home — resume hovering
        GlobalPosition = _homePosition;
        _currentState = State.Idle;
        return;
    }

    Vector2 direction = toHome.Normalized();
    _sprite.FlipH = direction.X < 0;
    Velocity = direction * ReturnSpeed;

    // If player re-enters detection, chase again
    if (_targetPlayer != null && HasLineOfSight())
    {
        _currentState = State.Chase;
    }
}
```

Return speed (60 px/s) is slower than chase speed (90 px/s). The bat doesn't panic about going home — it gives the player a grace period to escape. If the player re-enters detection mid-return, the chase resumes immediately.

### Line of Sight Check

The line of sight check is identical to a ground chaser — aim the ray at the player, force an update, check what it hit:

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

### Damage, Stomping, and the Dying Animation

The hurtbox logic is identical to other enemies:

```csharp
private void OnHurtBoxBodyEntered(Node2D body)
{
    if (body is Player player && !_isDead)
    {
        player.TakeHit(1, GlobalPosition);
    }
}
```

The stomp handler is where the bat is different. There's no stomped sprite, so instead of snapping to a squish frame, we **kick the bat away with a soft diagonal knockback, blink it, and free it after a short delay**:

```csharp
private void OnStompDetectorBodyEntered(Node2D body)
{
    if (body is Player player && !_isDead)
    {
        if (player.Velocity.Y > 0)
        {
            Die(player.GlobalPosition);
            player.Velocity = new Vector2(player.Velocity.X, -200f);
        }
    }
}

private async void Die(Vector2 stompSourcePosition)
{
    _isDead = true;
    _currentState = State.Dying;

    // Disable all the hit zones so the dying bat can't damage the player
    // or be stomped again
    _hurtBox.GetNode<CollisionShape2D>("CollisionShape2D").SetDeferred("disabled", true);
    _stompDetector.GetNode<CollisionShape2D>("CollisionShape2D").SetDeferred("disabled", true);

    // Soft diagonal knockback — away from the stomp source, slightly upward
    float knockbackDirection = Mathf.Sign(GlobalPosition.X - stompSourcePosition.X);
    if (knockbackDirection == 0) knockbackDirection = 1;
    Velocity = new Vector2(knockbackDirection * 80f, -120f);

    // Blink for 0.8 seconds while the bat tumbles away.
    // Alpha 0 (fully invisible) makes the blink very obvious.
    for (int i = 0; i < 8; i++)
    {
        _sprite.Modulate = new Color(1, 1, 1, 0f);
        await ToSignal(GetTree().CreateTimer(0.05), SceneTreeTimer.SignalName.Timeout);
        _sprite.Modulate = new Color(1, 1, 1, 1f);
        await ToSignal(GetTree().CreateTimer(0.05), SceneTreeTimer.SignalName.Timeout);
    }

    QueueFree();
}
```

**Why diagonal knockback?** Straight-up would make the bat float in the air before falling — looks static. Straight-horizontal would slide it along the floor after gravity pulls it down — looks like a skid. Diagonal (X = 80, Y = -120) throws the bat up and to the side, then gravity takes over. The result: a tumbling arc that reads as "the bat got smacked and is falling."

**Why 80 horizontal and 120 vertical?** 120 upward is enough to clear the player's head without flying offscreen. 80 horizontal is subtle — the bat doesn't launch across the room, it just gets knocked aside. These are soft values compared to the player's knockback (100 horizontal, 150 vertical) — the bat recoils less dramatically than the player does, emphasizing that the player is the stronger one.

**Why `async void` and `await`?** We need to pause between blinks without blocking the main thread. `await ToSignal(GetTree().CreateTimer(0.05), ...)` yields until a short timer fires, then resumes. The method marker `async void` lets us use `await` in a Godot callback. While the blink loop runs, the bat's `_PhysicsProcess` keeps firing — the gravity-when-dying branch of our physics code pulls it downward naturally during the blink.

**Why disable the hit zones immediately?** During the 0.6-second blink-and-fall, the bat is visually still in the air. Without `SetDeferred("disabled", true)`, the hurtbox would continue damaging the player if they ran underneath the falling bat. Disabling both the hurtbox and stomp detector at the start of `Die()` ensures the bat becomes a harmless ragdoll the moment it's hit.

### Animation

The bat only has one animation — `fly` — with its three sprite frames. There's no chase-specific animation, so we can speed up the wings during chase to signal "this thing is moving faster":

```csharp
private void UpdateAnimation()
{
    if (_isDead) return;

    _sprite.Play("fly");
    _sprite.SpeedScale = _currentState == State.Chase ? 1.8f : 1.0f;
}
```

Call it at the end of `_PhysicsProcess`:

```csharp
public override void _PhysicsProcess(double delta)
{
    // ... existing state handling ...

    MoveAndSlide();
    UpdateAnimation();
}
```

Faster wing flapping during chase reads as "aggressive, excited." Slower flapping during idle/return reads as "calm, patrolling." Same three sprites, two different emotional states, all from one parameter.

### Visual Feedback for Detection

An optional touch: tint the bat red when it spots the player:

```csharp
// In ProcessChase, at the start:
_sprite.Modulate = new Color(1.2f, 0.8f, 0.8f); // Slight red tint

// In ProcessIdle and ProcessReturn:
_sprite.Modulate = Colors.White;
```

This signals to the player that the bat is aware of them. Subtle, but it creates a moment of tension — "it sees me."

### Placement Tips

The bat shines in vertical spaces where a patrol enemy would be useless:

- **High ceilings** — hovers up top, forces the player to jump through its patrol arc
- **Dark corners** — tucked into nooks, ambushes the player from above
- **Open pits** — above gaps, the player must commit to a jump while dodging the bat mid-air
- **Near crystals** — guarding a collectible forces the player to choose between safety and greed

Avoid placing bats in tight corridors where the player has no room to maneuver. Flying enemies need open space to feel fair.

### Duplicating vs. Instancing — A Critical Distinction

When you want multiple bats in a level, **do not use `Ctrl+D` to duplicate the node**. Save the bat as its own scene and instance it instead. This applies to all reusable enemies, but it's especially easy to get wrong with Area2D-heavy scenes like the bat.

**The problem with duplication.** When you `Ctrl+D` a node in the editor, Godot copies the node tree but **shares sub-resources by reference**. The `CircleShape2D` on the `DetectionZone`, the `SpriteFrames` resource on the `AnimatedSprite2D`, the physics shapes on the `HurtBox` and `StompDetector` — all of these point to the same underlying resources across every duplicate. With multiple Area2D nodes sharing the same collision shapes, signal dispatch can behave unpredictably. A common symptom: only the first bat detects the player, and the others never react. Kill the first one and the rest stay frozen forever.

**The solution: instance the scene.** A scene instance is a completely independent copy — its own nodes, its own resource references, its own signal connections. Each bat processes collisions and signals on its own, unaware of the others.

**Steps to instance a bat:**

1. If the bat isn't already a scene, select its root node in the level, right-click → **Save Branch as Scene** → save as `res://scenes/enemies/cave_bat.tscn`. This converts the in-level node into a proper scene with a single source of truth.
2. Delete any `Ctrl+D` duplicates from your level — they're broken.
3. Select your `Enemies` container node in the level.
4. Click the **chain-link icon** at the top of the Scene dock (shortcut: **Ctrl+Shift+A**) to instantiate a child scene.
5. Pick `cave_bat.tscn`, move the new instance to the desired position.
6. Repeat for each bat.

**How to tell them apart visually.** An instanced scene shows with a small clapperboard/film icon next to its name in the Scene dock. A duplicated node doesn't. If you see multiple bats without the icon, they're duplicates — delete them and instance fresh copies.

**This rule applies to every enemy in this chapter** — patrol enemies, cave bats, jumping blocks, the cave guardian. Any reusable scene should be saved as its own `.tscn` and instanced per-level. We touched on scene instancing back in Chapter 3.4; this is the situation it was built for.

---

## 16.4 Jumping Block — An Unkillable Hazard

Not every enemy needs to die. Some exist to be *avoided*. Level 03 introduces a new hazard: the **Jumping Block** — an angry cube that sits in gaps at the bottom of the level, periodically launching upward. The player must jump *over* the gap while timing their arc to miss the block mid-jump.

This enemy teaches a different skill than the patrol and chaser: not combat, but **timing**. You can't stomp it, can't outrun it, can't kill it. You read its rhythm and commit to your jump in the safe window.

### The Design

| Element | Description |
| --- | --- |
| Behavior | Sits still at the bottom, periodically jumps straight up |
| Rhythm | Fixed timer (predictable — the player can learn it) |
| Sprites | Two frames — `down` (worried/surprised) and `up` (angry) |
| Killable? | No — stomping does nothing. Touch = damage, always |
| Placement | In gaps between platforms, at the bottom of the player's jump arc |

**Why timer-based instead of reactive?** A reactive block (jumps when the player is near) would feel unpredictable and frustrating. A fixed rhythm lets the player learn the pattern and master the level — the same philosophy as the patrol enemy's predictable path. This is a platformer, not a horror game.

### Scene Structure

```
JumpingBlock (Node2D)
├── AnimatedSprite2D
├── HurtBox (Area2D)
│   └── CollisionShape2D
└── JumpTimer (Timer)
```

Save as `res://scenes/enemies/jumping_block.tscn`.

**Why Node2D and not CharacterBody2D?** The jumping block doesn't need physics. It doesn't collide with walls or fall with gravity — its movement is a pure tween, up and down. Using `Node2D` keeps the scene lightweight and avoids wrestling the physics engine for predictable motion.

### Sprites

Create a `SpriteFrames` resource with two one-frame animations:

| Animation | Frames | FPS | Loop |
| --- | --- | --- | --- |
| down | 1 | 10 | No |
| up | 1 | 10 | No |

The `down` frame is the worried/surprised face (mouth open, eyes wide — "oh no, here I go"). The `up` frame is the angry face (eyebrows down, teeth bared — "rawr"). Both sprites come from Kenney's Pixel Platformer pack's character set.

### HurtBox Configuration

The hurtbox covers the block's visible body. It's always active — there's no "dead" state.

```
Collision Layer: 4 (hazards)
Collision Mask: 2 (player)
```

Size the `CollisionShape2D` to match the sprite. For a 24×24 block, a 22×22 rectangle works — slightly smaller than the visual for fairness.

### JumpTimer Configuration

```
Wait Time: 2.0
One Shot: false
Autostart: true
```

Every 2 seconds, the block starts a jump cycle. That's long enough for the player to see the pattern and time their approach.

### The Script

```csharp
using Godot;

public partial class JumpingBlock : Node2D
{
    [Export] public float JumpHeight { get; set; } = 60f;
    [Export] public float RiseDuration { get; set; } = 0.4f;
    [Export] public float HangDuration { get; set; } = 0.2f;
    [Export] public float FallDuration { get; set; } = 0.4f;

    private AnimatedSprite2D _sprite;
    private Area2D _hurtBox;
    private Timer _jumpTimer;
    private Vector2 _restPosition;
    private bool _isJumping = false;

    public override void _Ready()
    {
        _sprite = GetNode<AnimatedSprite2D>("AnimatedSprite2D");
        _hurtBox = GetNode<Area2D>("HurtBox");
        _jumpTimer = GetNode<Timer>("JumpTimer");

        _restPosition = Position;
        _sprite.Play("down");

        _jumpTimer.Timeout += OnJumpTimerTimeout;
        _hurtBox.BodyEntered += OnHurtBoxBodyEntered;
    }

    private void OnJumpTimerTimeout()
    {
        if (!_isJumping)
        {
            StartJump();
        }
    }

    private void StartJump()
    {
        _isJumping = true;
        _sprite.Play("up");

        var peakPosition = _restPosition + new Vector2(0, -JumpHeight);

        var tween = CreateTween();
        // Rise
        tween.TweenProperty(this, "position", peakPosition, RiseDuration)
            .SetEase(Tween.EaseType.Out)
            .SetTrans(Tween.TransitionType.Quad);
        // Hang at the top
        tween.TweenInterval(HangDuration);
        // Fall back down
        tween.TweenProperty(this, "position", _restPosition, FallDuration)
            .SetEase(Tween.EaseType.In)
            .SetTrans(Tween.TransitionType.Quad);
        // Swap back to the down sprite
        tween.TweenCallback(Callable.From(() =>
        {
            _sprite.Play("down");
            _isJumping = false;
        }));
    }

    private void OnHurtBoxBodyEntered(Node2D body)
    {
        if (body is Player player)
        {
            player.TakeHit(1, GlobalPosition);
        }
    }
}
```

### How the Tween Chain Works

We build a sequential tween with four steps:

1. **Rise (0.4s)** — ease-out quadratic: fast at the start, slows near the peak. Mimics a real jump's deceleration under gravity.
2. **Hang (0.2s)** — `TweenInterval` pauses the sequence for a fixed duration. This is the danger window at the peak where the block lingers, giving it weight.
3. **Fall (0.4s)** — ease-in quadratic: slow at the start, fast at the bottom. Mirrors the rise, creating a symmetric arc.
4. **Callback** — `TweenCallback` with `Callable.From(...)` runs a lambda after the sequence completes. We switch the sprite back to `down` and clear the `_isJumping` flag so the next timer tick can start another cycle.

Total cycle: 1.0 seconds of movement + 1.0 seconds of rest (from the 2.0s timer minus the 1.0s jump). The block spends half its time vulnerable-looking at the bottom and half its time dangerous in the air.

### Why the Sprite Swap?

The two-sprite trick is pure visual storytelling. The player doesn't read a status bar or a debug log to know what the block is about to do — they *see* it:

- **Face calm at the bottom** → safe to walk over (but still dangerous to touch!)
- **Face angry at the top** → it's actively attacking, reading its own arc

The "worried" down face adds personality — the block is sad about having to jump, or maybe afraid of heights. It's a touch of character that makes the enemy memorable instead of mechanical.

**Gotcha:** the hurtbox is active in *both* states. Even though the down sprite looks harmless, touching the block at rest still hurts the player — the face is a vibe, not a hitbox indicator. Make sure your level design never forces the player to land on top of a resting block.

### Placement in Level 03

The jumping block is for gaps — vertical shafts or pits between platforms where the player must commit to a jump. Place one or two blocks at the bottom:

```
[Platform A]          [Platform B]
     ↓                      ↑
         ↓              ↑
             [ Block ]
```

The player jumps from A to B. The block sits in the gap. If the player mistimes their jump, they either land on the block (hit) or get struck by it mid-air (hit). If they time it right — jumping while the block is at rest and landing before it peaks — they're safe.

For extra challenge, place two blocks in a row with slightly offset timers. The player must navigate the rhythm of both.

### Tuning the Rhythm

The default timer (2 seconds) is generous — players have plenty of time to read the pattern. For level 03, you can tighten it per-instance in the Inspector:

- **First gap:** 2.5s timer — teaches the player the mechanic
- **Second gap:** 2.0s timer — standard difficulty
- **Final gap:** 1.5s timer — tight, requires reading the rhythm carefully

All four timing properties (`JumpHeight`, `RiseDuration`, `HangDuration`, `FallDuration`) are exported, so each block can have its own personality. A taller block jumps higher. A faster block is harder to read. Mix and match.

### Instancing in the Level

Drop the block into the level under the `Enemies` container:

```
Level03 (Node2D)
├── ...
├── Objects (Node2D)
│   ├── ...
│   └── Enemies (Node2D)
│       ├── PatrolEnemy
│       ├── JumpingBlock          ← in the first gap
│       ├── JumpingBlock2         ← in the second gap
│       └── JumpingBlock3         ← in the final gap
```

Position each block at the bottom of its gap. Adjust the `JumpHeight` so the peak of its arc reaches the threat zone of the player's jump — high enough to hit, not so high that it clips through the platforms above.

---

## 16.5 Boss Fight — The Cave Guardian

A boss fight is a capstone encounter — a test of everything the player has learned. For Crystal Caverns, we'll build a boss for the end of level 03. The design is deliberately simple: **a bigger patrol enemy with 5 HP that summons reinforcements.** The boss walks back and forth between walls (same behavior as the patrol enemy from 16.1), and each time the player stomps it, a new patrol enemy spawns in the arena. Every 60 seconds, the boss becomes briefly invulnerable and spawns 2 more minions. The fight escalates through accumulated minions, not through complex attack patterns.

### The Boss Design

| Element | Description |
| --- | --- |
| Name | Cave Guardian |
| Size | 2–3× larger than regular enemies |
| Health | 5 stomps to defeat |
| Movement | Walks left-right like a patrol enemy (reverses on walls) |
| Damage | Touching its body hurts the player (same as patrol enemy) |
| Stomp | Player jumps on its head → boss takes 1 damage + spawns a patrol enemy |
| Timer | Every 60 seconds, boss becomes briefly invulnerable and spawns 2 patrol enemies |
| Defeat | At 0 HP → death animation → `QueueFree()` |

**The core loop:** The boss walks back and forth between walls — the same behavior as a patrol enemy, just bigger and with more health. The player jumps on the boss's head to deal 1 damage. Each stomp spawns a new patrol enemy in the arena. The boss keeps walking. The arena gets more crowded. Five stomps and the boss dies.

**The timer:** Every 60 seconds, the boss becomes briefly invulnerable (blue tint, can't be stomped) and spawns 2 more patrol enemies. This punishes slow play — the longer the fight takes, the more enemies pile up.

**Why this works as a final boss:** It reuses the patrol enemy from 16.1 — the player already learned how patrols behave, so no new rules to teach. The difficulty comes from accumulation, not new mechanics. After 3 stomps, there are 3 extra enemies walking around. After 4 stomps, 4 enemies. The arena turns into a traffic jam. The player must dodge patrols while timing their next jump onto the boss's head. Simple rules, emergent difficulty.

### Boss Scene Structure

The boss scene is similar to a patrol enemy, plus a health bar, spawn markers, and timers:

```
CaveGuardian (CharacterBody2D)
├── AnimatedSprite2D
├── CollisionShape2D
├── WallDetector (RayCast2D)
├── FloorDetector (RayCast2D)
├── HurtBox (Area2D)
│   └── CollisionShape2D
├── StompDetector (Area2D)
│   └── CollisionShape2D
├── MinionSpawnLeft (Marker2D)
├── MinionSpawnRight (Marker2D)
├── InvulnerableCycleTimer (Timer)
├── InvulnerableDurationTimer (Timer)
└── HealthBar (TextureProgressBar)
```

Save as `res://scenes/enemies/cave_guardian.tscn`.

**This is the same structure as the patrol enemy from 16.1**, plus: two `Marker2D` nodes for minion spawn positions (one on each side of the arena), two `Timer` nodes for the invulnerable phase, and a `TextureProgressBar` for the health bar. If you already built the patrol enemy, this scene should feel familiar.

The `WallDetector` and `FloorDetector` raycasts work exactly like the patrol enemy's — same configuration, same target positions. The boss reverses direction on walls and ledges using the same logic.

### Collision Configuration

Same as the patrol enemy from 16.1:

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

### Boss Animations

The boss uses the **same two sprite frames** as the patrol enemy: a 2-frame `walk` cycle and a 1-frame `stomped` sprite. No new art needed.

Create a `SpriteFrames` resource on the boss's `AnimatedSprite2D` with these animations:

| Animation | Frames | FPS | Loop |
| --- | --- | --- | --- |
| walk | 2 | 8 | Yes |
| stomped | 1 | 10 | No |

Use the same frames from Kenney's pack. Scale the boss up 2-3× via the `AnimatedSprite2D`'s `Scale` property in the Inspector so it looks bigger than regular enemies. Don't upscale the source images — let Godot's nearest-neighbor filtering keep the pixels crisp.

The boss uses `walk` while alive and `stomped` when defeated. The `Modulate` color and `SpeedScale` do the rest of the visual storytelling:

| State | Sprite | Visual treatment |
| --- | --- | --- |
| **Walking** | `walk` | Normal speed, normal color |
| **Hurt** | `walk` | Red flash for 0.3s |
| **Invulnerable** | `stomped` | Pulsing blue tint |
| **Defeated** | `stomped` | Red flash × 5, then shrink to zero |

### The Boss Script

The full script. Read through it — every method is short, and the comments explain each piece:


```csharp
using Godot;

public partial class CaveGuardian : CharacterBody2D
{
    [Export] public int MaxHealth { get; set; } = 5;
    [Export] public float MoveSpeed { get; set; } = 60f;
    [Export] public float Gravity { get; set; } = 980f;
    [Export] public float InvulnerableInterval { get; set; } = 60f;
    [Export] public float InvulnerableDuration { get; set; } = 2f;
    [Export] public PackedScene MinionScene { get; set; }

    private int _currentHealth;
    private AnimatedSprite2D _sprite;
    private Area2D _hurtBox;
    private Area2D _stompDetector;
    private RayCast2D _wallDetector;
    private RayCast2D _floorDetector;
    private Marker2D _minionSpawnLeft;
    private Marker2D _minionSpawnRight;
    private Timer _invulnerableCycleTimer;
    private Timer _invulnerableDurationTimer;
    private TextureProgressBar _healthBar;
    private int _direction = 1;
    private bool _isDead = false;
    private bool _isInvulnerable = false;

    public override void _Ready()
    {
        _currentHealth = MaxHealth;
        _sprite = GetNode<AnimatedSprite2D>("AnimatedSprite2D");
        _hurtBox = GetNode<Area2D>("HurtBox");
        _stompDetector = GetNode<Area2D>("StompDetector");
        _wallDetector = GetNode<RayCast2D>("WallDetector");
        _floorDetector = GetNode<RayCast2D>("FloorDetector");
        _minionSpawnLeft = GetNode<Marker2D>("MinionSpawnLeft");
        _minionSpawnRight = GetNode<Marker2D>("MinionSpawnRight");
        _invulnerableCycleTimer = GetNode<Timer>("InvulnerableCycleTimer");
        _invulnerableDurationTimer = GetNode<Timer>("InvulnerableDurationTimer");
        _healthBar = GetNode<TextureProgressBar>("HealthBar");

        _invulnerableCycleTimer.WaitTime = InvulnerableInterval;
        _invulnerableCycleTimer.OneShot = false;
        _invulnerableCycleTimer.Timeout += OnInvulnerableCycleTimeout;
        _invulnerableCycleTimer.Start();

        _invulnerableDurationTimer.WaitTime = InvulnerableDuration;
        _invulnerableDurationTimer.OneShot = true;
        _invulnerableDurationTimer.Timeout += OnInvulnerableDurationTimeout;

        _hurtBox.BodyEntered += OnHurtBoxBodyEntered;
        _stompDetector.BodyEntered += OnStompDetectorBodyEntered;

        _healthBar.MaxValue = MaxHealth;
        _healthBar.Value = MaxHealth;

        _sprite.Play("walk");
    }

    public override void _PhysicsProcess(double delta)
    {
        if (_isDead) return;

        // Apply gravity
        if (!IsOnFloor())
        {
            Velocity = new Vector2(Velocity.X, Velocity.Y + Gravity * (float)delta);
        }

        // Reverse on wall or ledge — same logic as the patrol enemy
        if (IsOnFloor() && (_wallDetector.IsColliding() || !_floorDetector.IsColliding()))
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

        var wallTarget = _wallDetector.TargetPosition;
        _wallDetector.TargetPosition = new Vector2(-wallTarget.X, wallTarget.Y);

        var floorTarget = _floorDetector.TargetPosition;
        _floorDetector.TargetPosition = new Vector2(-floorTarget.X, floorTarget.Y);
    }

    // --- Damage ---

    private void OnHurtBoxBodyEntered(Node2D body)
    {
        if (body is not Player player) return;

        // If the player is moving vertically (jumping, falling, or bouncing
        // off a stomp), they're not running into the boss — don't damage them.
        if (Mathf.Abs(player.Velocity.Y) > 50f) return;

        if (_isDead || _isInvulnerable) return;

        player.TakeHit(1, GlobalPosition);
    }

    private void OnStompDetectorBodyEntered(Node2D body)
    {
        if (body is not Player player) return;
        if (player.Velocity.Y <= 0) return;

        if (_isInvulnerable)
        {
            // Bounce off — can't damage the boss right now
            player.Velocity = new Vector2(player.Velocity.X, -180f);
            return;
        }

        if (!_isDead)
        {
            TakeDamage();
            player.Velocity = new Vector2(player.Velocity.X, -250f);
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
            Die();
            return;
        }

        // Spawn a patrol enemy as reinforcement
        SpawnMinion(_minionSpawnLeft.GlobalPosition);
    }

    // --- Minion Spawning ---

    private void SpawnMinion(Vector2 position)
    {
        if (MinionScene == null) return;

        var minion = MinionScene.Instantiate<Node2D>();
        minion.GlobalPosition = position;

        GetParent().CallDeferred(Node.MethodName.AddChild, minion);
    }

    // --- Invulnerable Phase (every 60 seconds) ---

    private void OnInvulnerableCycleTimeout()
    {
        if (_isDead || _isInvulnerable) return;

        _isInvulnerable = true;

        // Disable hurtbox so player can safely bounce off
        _hurtBox.GetNode<CollisionShape2D>("CollisionShape2D")
            .SetDeferred("disabled", true);

        // Spawn 2 minions, one from each side
        SpawnMinion(_minionSpawnLeft.GlobalPosition);
        SpawnMinion(_minionSpawnRight.GlobalPosition);

        // Visual: blue tint on stomped sprite
        _sprite.Play("stomped");
        _sprite.Modulate = new Color(0.6f, 0.8f, 1.3f);

        _invulnerableDurationTimer.Start();
    }

    private void OnInvulnerableDurationTimeout()
    {
        _isInvulnerable = false;

        // Re-enable hurtbox
        _hurtBox.GetNode<CollisionShape2D>("CollisionShape2D")
            .SetDeferred("disabled", false);

        // Back to normal
        _sprite.Play("walk");
        _sprite.Modulate = Colors.White;
    }

    // --- Death ---

    private async void Die()
    {
        _isDead = true;

        // Disable all collision
        _hurtBox.GetNode<CollisionShape2D>("CollisionShape2D")
            .SetDeferred("disabled", true);
        _stompDetector.GetNode<CollisionShape2D>("CollisionShape2D")
            .SetDeferred("disabled", true);
        _healthBar.Visible = false;
        Velocity = Vector2.Zero;

        // Flash red 5 times
        _sprite.Play("stomped");
        for (int i = 0; i < 5; i++)
        {
            _sprite.Modulate = new Color(1, 0.3f, 0.3f);
            await ToSignal(GetTree().CreateTimer(0.15),
                SceneTreeTimer.SignalName.Timeout);
            _sprite.Modulate = Colors.White;
            await ToSignal(GetTree().CreateTimer(0.15),
                SceneTreeTimer.SignalName.Timeout);
        }

        // Shrink to nothing
        var tween = CreateTween();
        tween.TweenProperty(this, "scale", Vector2.Zero, 0.5f)
            .SetEase(Tween.EaseType.In)
            .SetTrans(Tween.TransitionType.Back);
        await ToSignal(tween, Tween.SignalName.Finished);

        QueueFree();
    }
}
```

**How the script compares to the patrol enemy from 16.1:**

The movement code (`_PhysicsProcess`, `Reverse`) is **identical** to the patrol enemy. Same gravity, same wall detection, same floor detection, same direction flipping. If you understood 16.1, you understand the boss's movement.

The new parts are:

- **`TakeDamage()`** — decrements HP, flashes red, spawns a minion. When HP reaches 0, calls `Die()`.
- **`SpawnMinion()`** — instantiates a patrol enemy at a marker position using `CallDeferred` (safe for physics callbacks).
- **Invulnerable cycle** — two timers: `InvulnerableCycleTimer` fires every 60 seconds, `InvulnerableDurationTimer` ends the phase after 2 seconds. During the phase, the hurtbox is disabled, the boss shows a blue-tinted `stomped` sprite, and 2 minions spawn from both sides.
- **`Die()`** — flashes red 5 times, shrinks to zero with a tween, then `QueueFree()`.

### Health Bar

The `TextureProgressBar` sits above the boss. Configure it in the Inspector:

```
Size: (40, 6)
Position: (-20, -30)     — centered above the boss, adjust to your sprite size
Min Value: 0
Max Value: 5              — matches MaxHealth (set in code via _Ready)
Value: 5
```

For the textures, use simple colored rectangles:

- **Under texture:** dark gray bar (the background)
- **Progress texture:** red or green bar (current health)

The health bar moves with the boss automatically since it's a child node.

### Placing the Boss in the Level

Place the boss in a flat area of your level with walls on both sides (so the boss walks between them). The boss will patrol like a normal enemy — no special arena setup needed beyond two walls.

Instance the boss in your level under the `Enemies` container:

```
Level03 (Node2D)
├── ...
└── Enemies (Node2D)
    ├── ...
    └── CaveGuardian (instanced from cave_guardian.tscn)
```

In the Inspector on the `CaveGuardian` instance, assign `patrol_enemy.tscn` to the **Minion Scene** slot. Without this, the boss won't spawn minions (it fails silently with a null check).

Position the two `MinionSpawnLeft` and `MinionSpawnRight` markers on the left and right side of the boss's patrol area. That's where minions will appear.

### Boss Fight Summary

The complete interaction:

1. Boss walks left-right between walls, like a patrol enemy but bigger
2. Player jumps on the boss's head → boss takes 1 damage → a patrol enemy spawns on the left
3. Boss keeps walking, now with a minion in the arena
4. Repeat — each stomp adds another minion
5. **Every 60 seconds:** boss turns blue, becomes untouchable for 2 seconds, spawns 2 more minions (left + right)
6. After 5 stomps → death animation → boss disappears

The fight escalates through accumulated enemies, not through complex boss mechanics. A beginner can build this because it's a patrol enemy with HP and minion spawning — no state machines, no charge attacks, no wall-normal math.

---

## Summary

**Patrol enemies (16.1):** `CharacterBody2D` with two RayCast2D detectors — one for walls ahead, one for floor ahead. Reverses direction on wall collision or ledge detection. Walk animation, configurable speed, placed per-instance in the level.

**Damage and stomping (16.2):** Two Area2D zones — `HurtBox` damages the player on side contact, `StompDetector` kills the enemy when the player lands from above (positive Y velocity). `SetDeferred` disables collision during the stomped state. Invincibility frames on the player prevent multi-hit damage. Sprite blinking provides visual feedback during invincibility.

**Chasing AI — the Cave Bat (16.3):** Flying `CharacterBody2D` with gravity disabled while alive and **collision mask set to 0** so it phases through all terrain (walls, ceilings, one-way platforms). Enum-based state machine: Idle (sine-wave hover at home position), Chase (direct flight toward player), Return (slower flight home), Dying (gravity on, tumble + blink). `DetectionZone` (Area2D) checks proximity, `PlayerDetector` (RayCast2D) checks line of sight — line of sight still matters even though the bat ignores terrain, because hiding behind a wall breaks the chase and lets the player escape. Three-frame `fly` animation with speed-scaled wings (1.8× during chase). No stomped sprite — death applies soft diagonal knockback, blinks the sprite for 0.6s while gravity pulls the bat down, then frees it. Genre convention: ethereal flying enemies in platformers (Castlevania Medusa Heads, Hollow Knight Vengeflies) traditionally ignore terrain.

**Jumping block (16.4):** Unkillable timed hazard placed in gaps. `Node2D` with a tween chain — rise, hang, fall, callback — on a 2-second timer. Two-sprite visual language: `down` (worried) at rest, `up` (angry) mid-jump. Always-active hurtbox teaches timing instead of combat. Placement in gaps forces committed jumps.

**Boss fight (16.5):** `CaveGuardian` — a larger patrol enemy with 5 HP and a health bar. Walks left-right between walls using the same movement logic as the patrol enemy (RayCast2D wall/floor detection). Each stomp deals 1 damage and spawns a patrol enemy as reinforcement. Every 60 seconds, the boss becomes briefly invulnerable (blue tint, hurtbox disabled) and spawns 2 more minions from both sides of the arena. Difficulty escalates through accumulated minions, not through complex attack patterns. `TextureProgressBar` health bar. Death animation flashes red and shrinks to zero.

---

**Next up: Chapter 17 — Polishing the Platformer.** We'll build the HUD (health hearts, score display), create menus (main menu, pause, game over), add sound effects and music, implement screen transitions, and add the final layer of game feel that ties everything together.
