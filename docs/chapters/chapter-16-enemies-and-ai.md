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

A boss fight is a capstone encounter — a test of everything the player has learned. For Crystal Caverns, we'll build a boss for the end of level 03: a larger enemy that charges, slams into walls, and summons reinforcements each time it's hit.

### The Boss Design

| Element | Description |
| --- | --- |
| Name | Cave Guardian |
| Size | 2–3× larger than regular enemies |
| Health | 5 hits |
| Attack | Charge — rushes toward the player |
| Vulnerability | Stunned for 2 seconds after charge hits a wall |
| Defeat condition | Stomp 5 times during stun windows |
| Escalation | Each stomp spawns a patrol enemy in the arena |

**The core loop:** The boss charges toward the player. Player jumps over the charge. Boss slams into a wall and is stunned. Player stomps the boss during the stun window. The boss takes 1 damage and **spawns a patrol enemy** in the arena. The boss recovers and charges again — but now there's a patrol enemy walking around too.

**Why this escalation and not a difficulty scale?** Faster charges or shorter cooldowns are *numbers getting bigger* — a mechanical difficulty lever. Summoning minions is *the arena changing* — a tangible consequence the player sees. After 5 stomps, the arena has 5 patrol enemies plus the boss. The player must manage both threats: time their stomps on the boss *and* avoid the patrols wandering underfoot. Same challenge curve, but readable and dramatic.

It also reuses the patrol enemy from 16.1 — the player already learned how it behaves, so no new rules to teach. The boss fight becomes a synthesis of everything in the chapter: stomping, timing, reading patrol patterns, and managing multiple threats at once.

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
├── MinionSpawnLeft (Marker2D)
├── MinionSpawnRight (Marker2D)
├── StunTimer (Timer)
├── AttackCooldown (Timer)
├── InvulnerableCycleTimer (Timer)
├── InvulnerableDurationTimer (Timer)
└── HealthBar (TextureProgressBar)
```

Save as `res://scenes/enemies/cave_guardian.tscn`.

The `ShockwaveSpawn` marker is where the ground pound shockwaves originate. The two `MinionSpawn` markers are where patrol enemies appear — place one on each side of the arena so minions can spawn left, right, or both depending on the context (single stomp vs. invulnerable phase).

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
        Invulnerable,
        Defeated
    }

    [Export] public int MaxHealth { get; set; } = 5;
    [Export] public float ChargeSpeed { get; set; } = 200f;
    [Export] public float Gravity { get; set; } = 980f;
    [Export] public float StunDuration { get; set; } = 2.0f;
    [Export] public float AttackCooldownTime { get; set; } = 1.5f;
    [Export] public float InvulnerableInterval { get; set; } = 60f;
    [Export] public float InvulnerableDuration { get; set; } = 2f;
    [Export] public PackedScene MinionScene { get; set; }

    private BossState _state = BossState.Idle;
    private BossState _previousState = BossState.Idle;
    private int _currentHealth;
    private AnimatedSprite2D _sprite;
    private Area2D _hurtBox;
    private Area2D _stompDetector;
    private Marker2D _minionSpawnLeft;
    private Marker2D _minionSpawnRight;
    private Timer _stunTimer;
    private Timer _attackCooldown;
    private Timer _invulnerableCycleTimer;
    private Timer _invulnerableDurationTimer;
    private TextureProgressBar _healthBar;
    private Player _player;
    private int _direction = -1;

    public override void _Ready()
    {
        _currentHealth = MaxHealth;
        _sprite = GetNode<AnimatedSprite2D>("AnimatedSprite2D");
        _hurtBox = GetNode<Area2D>("HurtBox");
        _stompDetector = GetNode<Area2D>("StompDetector");
        _minionSpawnLeft = GetNode<Marker2D>("MinionSpawnLeft");
        _minionSpawnRight = GetNode<Marker2D>("MinionSpawnRight");
        _stunTimer = GetNode<Timer>("StunTimer");
        _attackCooldown = GetNode<Timer>("AttackCooldown");
        _invulnerableCycleTimer = GetNode<Timer>("InvulnerableCycleTimer");
        _invulnerableDurationTimer = GetNode<Timer>("InvulnerableDurationTimer");
        _healthBar = GetNode<TextureProgressBar>("HealthBar");

        _stunTimer.WaitTime = StunDuration;
        _stunTimer.OneShot = true;
        _stunTimer.Timeout += OnStunTimerTimeout;

        _attackCooldown.WaitTime = AttackCooldownTime;
        _attackCooldown.OneShot = true;
        _attackCooldown.Timeout += OnAttackCooldownTimeout;

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

        // Find the player in the scene
        _player = GetTree().GetFirstNodeInGroup("player") as Player;
    }
}
```

**Finding the player:** The boss needs a reference to the player for targeting. Using groups is cleaner than `GetNode` with a hardcoded path — add the player to a `"player"` group (in Player's `_Ready`: `AddToGroup("player")`), and the boss finds it at runtime regardless of scene tree structure.

**The `MinionScene` export:** Drag `patrol_enemy.tscn` into this slot in the Inspector. The boss doesn't hardcode the minion type — you could swap in a chaser enemy for a harder variant without touching code.

**The two invulnerability timers:** `InvulnerableCycleTimer` is a repeating 60-second clock — every minute, it fires and triggers the invulnerable phase. `InvulnerableDurationTimer` is a one-shot that runs while the boss is invulnerable, and fires once to return to normal state after 2 seconds. Two timers because they serve two different purposes: one schedules the event, one measures the event's length.

**Don't forget to add the two new Timer nodes** to the boss scene tree (`InvulnerableCycleTimer` and `InvulnerableDurationTimer`) alongside `StunTimer` and `AttackCooldown`.

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
        case BossState.Invulnerable:
            ProcessInvulnerable();
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

private void OnAttackCooldownTimeout() { /* no-op; polled in ProcessIdle */ }

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

The boss gets more aggressive as health decreases. At full health, it mostly charges. At 1 HP, ground pounds dominate. This creates natural escalation without explicit phase transitions — *on top of* the minion accumulation from stomps and the periodic invulnerable phases from the 1-minute timer. Three escalation vectors stacking.

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
            player.TakeHit(1, GlobalPosition);
        }
    }
}
```

The shockwave expands horizontally from the impact point. The player must jump over it. It auto-destroys when reaching max width.

**Note:** Setting collision layers in code uses zero-indexed bit positions: `1 << 3` means bit 3 (layer 4), `1 << 1` means bit 1 (layer 2). Alternatively, set these in the Inspector on the shockwave scene — that's less error-prone.

### Stomping the Boss

The stomp only works during the stun window. On a successful stomp: damage the boss, bounce the player, and **spawn a patrol enemy** as reinforcement.

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
        return;
    }

    // Summon a patrol enemy as reinforcement
    SpawnMinion(_minionSpawnLeft.GlobalPosition);

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
```

Each hit makes the boss faster (+20 px/s charge, -0.2s cooldown, minimum 0.5s) *and* adds a patrol enemy to the arena. The fight escalates on two axes at once: the boss itself gets more dangerous, and the arena gets more crowded.

**Why spawn only from the left marker on stomps?** We reserve the right marker for the invulnerable phase (next section), which spawns from both sides. This creates a subtle visual language: left-side spawns are routine reinforcements, both-side spawns are the panic moment.

### Spawning Minions

```csharp
private void SpawnMinion(Vector2 position)
{
    if (MinionScene == null) return;

    var minion = MinionScene.Instantiate<Node2D>();
    minion.GlobalPosition = position;

    // Spawn effect: scale from zero with a bouncy pop
    minion.Scale = Vector2.Zero;
    var tween = CreateTween();
    tween.TweenProperty(minion, "scale", Vector2.One, 0.3f)
        .SetEase(Tween.EaseType.Out)
        .SetTrans(Tween.TransitionType.Back);

    GetParent().AddChild(minion);
}
```

**Parenting:** `GetParent().AddChild(minion)` adds the minion as a sibling of the boss, under the same `Enemies` container. This keeps the scene tree clean and matches the placement convention for hand-placed enemies.

**Spawn animation:** `Tween.TransitionType.Back` creates a slight overshoot — the minion scales up past 1.0 then settles back. It's a bouncy pop-in that visually announces "a new enemy just appeared" so the player notices instead of being surprised by a minion that walked in from offscreen.

### The Invulnerable Phase — The Panic Moment

Every 60 seconds of fight time, the boss becomes **invulnerable for 2 seconds and spawns 2 minions** from both sides of the arena. This is the panic moment — the player can't damage the boss during this window, so they have to focus on dodging the boss *and* managing the new minions *and* timing the next stomp for when invulnerability ends.

The cycle is independent of the stomp loop. It fires on a real-time clock, regardless of how much progress the player has made. Take too long on the fight → deal with multiple invulnerable phases.

```csharp
private void OnInvulnerableCycleTimeout()
{
    // Don't trigger during stun or if already invulnerable/defeated
    if (_state == BossState.Stunned
        || _state == BossState.Invulnerable
        || _state == BossState.Defeated)
    {
        return;
    }

    StartInvulnerablePhase();
}

private void StartInvulnerablePhase()
{
    _previousState = _state;
    _state = BossState.Invulnerable;
    Velocity = new Vector2(0, Velocity.Y);

    // Spawn minions from both sides simultaneously
    SpawnMinion(_minionSpawnLeft.GlobalPosition);
    SpawnMinion(_minionSpawnRight.GlobalPosition);

    // Visual: shielded blue tint + slow pulse
    _sprite.Modulate = new Color(0.6f, 0.8f, 1.3f);
    _sprite.Play("idle");

    _invulnerableDurationTimer.Start();
}

private void ProcessInvulnerable()
{
    Velocity = new Vector2(0, Velocity.Y);

    // Pulsing alpha for shield effect
    float pulse = 0.7f + 0.3f * Mathf.Sin((float)Time.GetTicksMsec() / 100f);
    _sprite.Modulate = new Color(0.6f * pulse, 0.8f * pulse, 1.3f * pulse);
}

private void OnInvulnerableDurationTimeout()
{
    _sprite.Modulate = Colors.White;
    _state = BossState.Idle;
    _attackCooldown.Start();
}
```

### The Invulnerability Check

The `OnStompDetectorBodyEntered` only damages the boss during `BossState.Stunned`. Since `Invulnerable` is a separate state, stomps are automatically ignored — the stomp zone still detects the player and bounces them, but `TakeDamage()` never gets called.

Wait, actually — re-read the stomp handler:

```csharp
if (body is Player player && _state == BossState.Stunned)
```

This check only allows damage when stunned, which means invulnerability is already enforced by design. But we should still bounce the player off the boss during invulnerability so they don't take damage from the hurtbox. Update the handler:

```csharp
private void OnStompDetectorBodyEntered(Node2D body)
{
    if (body is not Player player) return;
    if (player.Velocity.Y <= 0) return;

    if (_state == BossState.Stunned)
    {
        TakeDamage();
        player.Velocity = new Vector2(player.Velocity.X, -250f);
    }
    else if (_state == BossState.Invulnerable)
    {
        // Bounce off — no damage dealt, no damage taken
        player.Velocity = new Vector2(player.Velocity.X, -180f);
    }
}
```

Now the player can safely land on the boss during invulnerability and bounce off. The bounce is slightly weaker (-180 vs -250) to communicate "this didn't work" through feel. We also need to disable the hurtbox during invulnerability so the player doesn't take damage from a friendly bounce:

```csharp
private void StartInvulnerablePhase()
{
    _previousState = _state;
    _state = BossState.Invulnerable;
    Velocity = new Vector2(0, Velocity.Y);

    // Disable the hurtbox so the player can safely bounce off
    _hurtBox.GetNode<CollisionShape2D>("CollisionShape2D").SetDeferred("disabled", true);

    // Spawn minions from both sides simultaneously
    SpawnMinion(_minionSpawnLeft.GlobalPosition);
    SpawnMinion(_minionSpawnRight.GlobalPosition);

    // Visual: shielded blue tint + slow pulse
    _sprite.Modulate = new Color(0.6f, 0.8f, 1.3f);
    _sprite.Play("idle");

    _invulnerableDurationTimer.Start();
}

private void OnInvulnerableDurationTimeout()
{
    // Re-enable hurtbox
    _hurtBox.GetNode<CollisionShape2D>("CollisionShape2D").SetDeferred("disabled", false);

    _sprite.Modulate = Colors.White;
    _state = BossState.Idle;
    _attackCooldown.Start();
}
```

### Reading the Blue Shield

The blue pulsing tint during invulnerability is a visual language the player learns after one or two fight attempts:

- **White sprite** → normal, dodge the attacks
- **Red flash** → just took damage, stomp landed
- **Stunned + sprite offset shaking** → vulnerability window, go for the stomp
- **Pulsing blue tint** → invulnerable, don't bother stomping, deal with the minions

No text popup, no UI indicator. The game teaches through color and motion.

### Why These Three Escalation Layers Work Together

The fight now has three independent escalation vectors:

1. **Health-based attack scaling** — the boss charges faster and ground pounds more often as HP drops. Rewards aggressive play (finish faster → less scaling), punishes slow play.
2. **Minion accumulation per stomp** — each hit adds a permanent patrol enemy to the arena. Rewards efficiency (fewer stomps → fewer surviving minions), punishes missed opportunities.
3. **Timed invulnerable phases** — every 60 seconds, the boss becomes untouchable and spawns 2 more minions. Rewards speed (finish in under 60s → never see this phase), punishes stalling.

The three vectors don't compete — they reinforce each other. All three reward the player for ending the fight quickly. A skilled player might finish before the first invulnerable phase even fires. A struggling player accumulates minions, slower charges become faster, and panic phases add more minions on top. The difficulty curve adjusts to the player's performance without scripted phase transitions.

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

1. Player enters arena → gate closes → 60-second invulnerable cycle starts
2. Boss idles, faces the player
3. Boss charges OR ground pounds (more ground pounds as HP drops)
4. Player dodges the attack, waits for the opening
5. Boss slams into a wall → stunned for 2 seconds
6. Player stomps during stun → boss takes 1 damage → patrol enemy spawns on the left
7. Boss recovers, charges/pounds become faster, arena now has a new minion
8. **Every 60 seconds:** boss glows blue, becomes untouchable, spawns 2 more minions from both sides → player survives for 2 seconds → normal fight resumes
9. At 0 HP → defeat animation → exit gate opens

Five stomps to win. Each stomp scales the boss's attacks *and* adds a permanent minion. Every minute adds 2 more minions during a panic phase. The player must master jumping (from Chapter 14), stomping timing (from 16.2), reading patrol patterns (from 16.1), and threat prioritization (all of the above at once). The boss is a final exam for the whole chapter.

---

## Summary

**Patrol enemies (16.1):** `CharacterBody2D` with two RayCast2D detectors — one for walls ahead, one for floor ahead. Reverses direction on wall collision or ledge detection. Walk animation, configurable speed, placed per-instance in the level.

**Damage and stomping (16.2):** Two Area2D zones — `HurtBox` damages the player on side contact, `StompDetector` kills the enemy when the player lands from above (positive Y velocity). `SetDeferred` disables collision during the stomped state. Invincibility frames on the player prevent multi-hit damage. Sprite blinking provides visual feedback during invincibility.

**Chasing AI — the Cave Bat (16.3):** Flying `CharacterBody2D` with gravity disabled while alive and **collision mask set to 0** so it phases through all terrain (walls, ceilings, one-way platforms). Enum-based state machine: Idle (sine-wave hover at home position), Chase (direct flight toward player), Return (slower flight home), Dying (gravity on, tumble + blink). `DetectionZone` (Area2D) checks proximity, `PlayerDetector` (RayCast2D) checks line of sight — line of sight still matters even though the bat ignores terrain, because hiding behind a wall breaks the chase and lets the player escape. Three-frame `fly` animation with speed-scaled wings (1.8× during chase). No stomped sprite — death applies soft diagonal knockback, blinks the sprite for 0.6s while gravity pulls the bat down, then frees it. Genre convention: ethereal flying enemies in platformers (Castlevania Medusa Heads, Hollow Knight Vengeflies) traditionally ignore terrain.

**Jumping block (16.4):** Unkillable timed hazard placed in gaps. `Node2D` with a tween chain — rise, hang, fall, callback — on a 2-second timer. Two-sprite visual language: `down` (worried) at rest, `up` (angry) mid-jump. Always-active hurtbox teaches timing instead of combat. Placement in gaps forces committed jumps.

**Boss fight (16.5):** `CaveGuardian` with charge and ground pound attacks. Stunned after hitting a wall during charge — that's the stomp window. Three independent escalation layers: (1) health-based attack scaling (faster charges, more ground pounds at low HP), (2) minion accumulation — each stomp spawns a patrol enemy, (3) timed invulnerable phases — every 60 seconds the boss glows blue, becomes untouchable for 2 seconds, and spawns 2 minions from both sides of the arena. Shockwave Area2D expands horizontally on ground pound. `TextureProgressBar` health bar. Arena gates close on entry, open on defeat.

---

**Next up: Chapter 17 — Polishing the Platformer.** We'll build the HUD (health hearts, score display), create menus (main menu, pause, game over), add sound effects and music, implement screen transitions, and add the final layer of game feel that ties everything together.
