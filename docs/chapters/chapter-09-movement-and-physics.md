# Chapter 9: Movement & Physics (2D)

---

## 9.1 Moving a Node with Code (Position, Velocity)

Your character has sprites, animations, and responds to input. But so far, movement has been a bit hand-wavy — we set `Velocity` and called `MoveAndSlide()` without fully understanding what's happening under the hood. In this chapter, we'll build that understanding from the ground up.

### The Simplest Movement: Changing Position Directly

Every `Node2D` has a `Position` property — a `Vector2` that determines where the node sits in its parent's coordinate space. You can move a node by changing its position:

```csharp
public override void _Process(double delta)
{
    Position += new Vector2(100 * (float)delta, 0);  // move right at 100 pixels/sec
}
```

This works, but it has a critical problem: **the node walks through everything**. There's no collision detection — walls, floors, enemies, nothing stops it. It's just teleporting to a new position every frame.

### What Is Delta?

The `delta` parameter is the time elapsed since the last frame, in seconds. At 60 FPS, delta is roughly `0.0167`. At 30 FPS, it's roughly `0.033`.

Multiplying movement by delta makes it **frame-rate independent**:

```csharp
// Without delta: moves 5 pixels per FRAME
// At 60 FPS = 300 px/sec, at 30 FPS = 150 px/sec — inconsistent!
Position += new Vector2(5, 0);

// With delta: moves 300 pixels per SECOND regardless of frame rate
Position += new Vector2(300 * (float)delta, 0);
```

**Always multiply movement by delta.** If you don't, your game runs differently on different hardware.

### Position vs Velocity

There are two fundamental approaches to movement:

**Position-based** — you directly set where the node is:

```csharp
Position += direction * speed * (float)delta;
```

Simple, predictable, no physics. Good for UI elements, menu cursors, or simple prototypes.

**Velocity-based** — you set how fast the node is moving, and something else applies that velocity:

```csharp
Velocity = direction * speed;
MoveAndSlide();
```

This is how physics-aware movement works. `MoveAndSlide()` takes the velocity, moves the body, and handles collisions automatically. We'll dig into this in section 9.3.

### Global vs Local Position

`Position` is relative to the parent node. `GlobalPosition` is the position in world space.

```csharp
// If the parent is at (100, 50):
Position = new Vector2(10, 0);        // node is at (110, 50) in the world
GlobalPosition = new Vector2(10, 0);  // node is at (10, 0) in the world
```

For movement, use `Position` when moving relative to a parent (a weapon bobbing on a character) and `GlobalPosition` when you need world-space coordinates (spawning a bullet at an exact world position).

---

## 9.2 CharacterBody2D — The Player Controller

`CharacterBody2D` is Godot's go-to node for player characters, enemies, NPCs — anything that moves and collides but isn't driven by physics simulation. You control it directly through code.

### Why Not Just Node2D?

A plain `Node2D` can move, but it doesn't know about collisions. You'd have to write your own collision detection — checking overlaps, resolving penetration, handling slopes. That's a lot of work, and Godot already does it for you.

`CharacterBody2D` gives you:

- **Built-in collision detection** — it won't walk through walls.
- **`MoveAndSlide()`** — a single method that moves, collides, and slides along surfaces.
- **Floor/wall/ceiling detection** — it knows if it's on the ground, touching a wall, or hitting a ceiling.
- **Slope handling** — configurable behavior on inclines.

### Setting Up a CharacterBody2D

The minimum setup:

```
Player (CharacterBody2D)
├── Sprite2D (or AnimatedSprite2D)
└── CollisionShape2D
```

The `CollisionShape2D` defines the physical boundary of the character. Without it, the CharacterBody2D has no shape and can't collide with anything.

Common shapes for characters:

- **RectangleShape2D** — simple box. Good for blocky characters or pixel art.
- **CapsuleShape2D** — rounded rectangle. The standard for most characters — it slides smoothly along surfaces and doesn't catch on edges.
- **CircleShape2D** — perfect circle. Good for balls or round characters.

**Tip:** Make the collision shape slightly smaller than the sprite. Players expect to *barely* squeeze through gaps — a generous hitbox feels fair. A hitbox that's too precise feels punishing.

### Key Properties

In the Inspector, CharacterBody2D has a section called **Motion Mode** and several important properties:

**Motion Mode:**

- **Grounded** — the default. Designed for platformers with gravity. Distinguishes between floor, wall, and ceiling collisions.
- **Floating** — for top-down games with no gravity. All surfaces are treated equally.

**Floor Settings (Grounded mode):**

- **Max Floor Angle** — the steepest slope the character considers "floor" (default 45°). Steeper slopes become walls.
- **Snap Length** — helps the character stick to the floor when walking down slopes. Without it, the character briefly becomes airborne at the crest of slopes.
- **Stop On Slope** — if `true`, the character doesn't slide down slopes when standing still.

**Wall Settings:**

- **Slide On Ceiling** — whether the character slides along ceilings when it hits them. In most platformers, you want this `true` so hitting a ceiling corner doesn't stop horizontal movement.

For a top-down game, set Motion Mode to **Floating** and you can ignore all the floor/wall/ceiling settings — they only apply to Grounded mode.

### The Basic Script

```csharp
public partial class Player : CharacterBody2D
{
    [Export] public float Speed = 300f;

    public override void _PhysicsProcess(double delta)
    {
        Vector2 direction = Input.GetVector("move_left", "move_right", "move_up", "move_down");
        Velocity = direction * Speed;
        MoveAndSlide();
    }
}
```

That's a complete top-down controller. Three lines in `_PhysicsProcess` — direction, velocity, move.

### Why `_PhysicsProcess` and Not `_Process`?

`_PhysicsProcess()` runs at a fixed rate (default 60 times per second), regardless of rendering speed. `_Process()` runs once per rendered frame, which varies.

Physics (collision detection, `MoveAndSlide()`) should always run in `_PhysicsProcess()` because:

- **Deterministic** — the same input produces the same result, regardless of frame rate.
- **Stable** — physics calculations need consistent time steps. Variable frame rates cause jitter and missed collisions.

Visual-only updates (camera smoothing, UI animations) can go in `_Process()`.

---

## 9.3 `MoveAndSlide()` — Collision-Aware Movement

`MoveAndSlide()` is the core of CharacterBody2D movement. It does a lot in one call.

### What It Does

1. Takes the current `Velocity` value.
2. Moves the body by `Velocity * delta` (delta is applied internally — you don't multiply it yourself).
3. If it hits something, it **slides** along the collision surface instead of stopping dead.
4. Updates `Velocity` to reflect the slide (the component into the wall is removed).
5. Returns `true` if any collision occurred.

### Why "Slide"?

Imagine walking diagonally into a wall. Without sliding, you'd stop completely — even though you're also pressing a direction parallel to the wall. Sliding removes the velocity component that goes *into* the wall and preserves the component that goes *along* it.

```
Without sliding:          With sliding:
    ↗ → STOP              ↗ → slides along wall →
    |  wall                |  wall
```

This is what makes movement feel natural. Players expect to slide along walls when walking into them at an angle.

### Collision Information After `MoveAndSlide()`

After calling `MoveAndSlide()`, you can query what happened:

```csharp
MoveAndSlide();

// How many collisions occurred this frame?
int collisionCount = GetSlideCollisionCount();

// Get details about each collision
for (int i = 0; i < collisionCount; i++)
{
    KinematicCollision2D collision = GetSlideCollision(i);
    GD.Print($"Collided with: {collision.GetCollider().Name}");
    GD.Print($"At position: {collision.GetPosition()}");
    GD.Print($"Surface normal: {collision.GetNormal()}");
}
```

### Floor, Wall, and Ceiling Detection

In Grounded motion mode, CharacterBody2D tracks which surfaces you're touching:

```csharp
MoveAndSlide();

if (IsOnFloor())
{
    // standing on the ground — can jump
}

if (IsOnWall())
{
    // touching a wall — can wall-jump?
}

if (IsOnCeiling())
{
    // hit the ceiling — stop upward velocity
}
```

These are updated *after* `MoveAndSlide()` runs. Don't check them before calling it — they'll have stale data from the previous frame.

### A Platformer Controller

Here's a basic but solid platformer controller:

```csharp
public partial class Player : CharacterBody2D
{
    [Export] public float Speed = 300f;
    [Export] public float JumpVelocity = -400f;
    [Export] public float Gravity = 980f;

    public override void _PhysicsProcess(double delta)
    {
        // Apply gravity
        if (!IsOnFloor())
        {
            Velocity += new Vector2(0, Gravity * (float)delta);
        }

        // Jump
        if (Input.IsActionJustPressed("jump") && IsOnFloor())
        {
            Velocity = new Vector2(Velocity.X, JumpVelocity);
        }

        // Horizontal movement
        float direction = Input.GetAxis("move_left", "move_right");
        Velocity = new Vector2(direction * Speed, Velocity.Y);

        MoveAndSlide();
    }
}
```

Let's break this down:

**Gravity** — applied every frame the character isn't on the floor. `Velocity.Y` increases (positive Y is down in Godot), pulling the character downward. When the character lands (`IsOnFloor()` becomes true), we stop adding gravity.

**Jump** — sets `Velocity.Y` to a negative value (upward). The jump velocity is negative because **up is negative Y** in Godot's coordinate system. Gravity then gradually pulls the character back down.

**Horizontal movement** — `GetAxis()` returns -1, 0, or 1. We set the X velocity directly each frame. Note that we preserve `Velocity.Y` (gravity/jump) while replacing `Velocity.X` (horizontal input).

**`MoveAndSlide()`** — runs last, applying the combined velocity and handling all collisions.

### Why Is Jump Velocity Negative?

In Godot's 2D coordinate system, **Y increases downward**:

```
(0,0) ──────→ X+
  |
  |
  ↓
  Y+
```

So moving up means decreasing Y. Jump velocity is negative (e.g., `-400`) to push the character upward. Gravity is positive (e.g., `980`) to pull it back down.

---

## 9.4 RigidBody2D — Physics-Driven Objects

`CharacterBody2D` gives you full control — you decide exactly how it moves. `RigidBody2D` is the opposite: the **physics engine** decides how it moves. You apply forces and let Godot handle the rest.

### When to Use RigidBody2D

- **Thrown objects** — rocks, grenades, debris that should bounce and tumble realistically.
- **Ragdolls** — characters that go limp on death.
- **Physics puzzles** — stacking boxes, rolling balls, swinging pendulums.
- **Projectiles with realistic arcs** — cannonballs, arrows affected by gravity and wind.

**Don't** use RigidBody2D for player characters or enemies that need precise control. Physics simulation makes characters feel floaty and unpredictable. Use CharacterBody2D for those.

### Setting Up a RigidBody2D

```
Crate (RigidBody2D)
├── Sprite2D
└── CollisionShape2D
```

Same structure as CharacterBody2D — a sprite and a collision shape. But unlike CharacterBody2D, a RigidBody2D will immediately start falling (due to gravity) and bouncing off things without any code.

### Key Properties

**Mass** — how heavy the object is. Heavier objects are harder to push. Default is 1 kg.

**Gravity Scale** — multiplier for gravity. `1` = normal gravity, `0` = no gravity (floats), `2` = double gravity (falls fast), `-1` = reverse gravity (floats up).

**Linear Damp** — air resistance for movement. Higher values make the object slow down faster. `0` = no air resistance (slides forever on frictionless surfaces).

**Angular Damp** — air resistance for rotation. Higher values make spinning slow down faster.

**Freeze** — completely stops the body from moving. Toggle it on/off to freeze/unfreeze objects (e.g., a boulder that starts rolling when the player pulls a lever).

**Continuous CD** — continuous collision detection. Enable this for fast-moving objects (bullets, thrown items) that might pass through walls at high speed. More expensive but prevents tunneling.

### Applying Forces

You don't set `Position` or `Velocity` on a RigidBody2D directly (well, you can, but it breaks the physics simulation). Instead, you apply forces:

```csharp
public partial class Crate : RigidBody2D
{
    public void Push(Vector2 direction, float force)
    {
        // Apply a one-time impulse (like a kick)
        ApplyImpulse(direction.Normalized() * force);
    }

    public void Hover()
    {
        // Apply a continuous force (like a thruster)
        ApplyCentralForce(new Vector2(0, -500));
    }
}
```

**Impulse vs Force:**

- **`ApplyImpulse()`** — an instant burst. Use for explosions, jumps, kicks. Applied once.
- **`ApplyCentralForce()`** — a continuous push. Use for thrusters, wind, magnetism. Applied every physics frame in `_PhysicsProcess()`.
- **`ApplyForce()`** — like `ApplyCentralForce()` but applied at a specific point on the body, which also creates torque (rotation).

```csharp
// Explosion pushes everything away
public void Explode(Vector2 explosionPos, float explosionForce)
{
    Vector2 direction = GlobalPosition - explosionPos;
    float distance = direction.Length();
    float strength = explosionForce / (distance * distance);  // falloff with distance
    ApplyImpulse(direction.Normalized() * strength);
}
```

### PhysicsMaterial

A `PhysicsMaterial` resource controls how the RigidBody2D interacts with surfaces:

- **Friction** — `0` = ice (no friction), `1` = rubber (high friction). Default `1`.
- **Bounce** — `0` = no bounce (thud), `1` = perfect bounce (like a superball). Default `0`.

You can set the physics material on the RigidBody2D in the Inspector, or on individual collision shapes.

```csharp
var material = new PhysicsMaterial();
material.Friction = 0.2f;
material.Bounce = 0.7f;
PhysicsMaterialOverride = material;
```

### Listening for Collisions

RigidBody2D emits signals when it collides with other bodies. Enable **Contact Monitor** and set **Max Contacts Reported** (e.g., 4) in the Inspector first:

```csharp
public override void _Ready()
{
    BodyEntered += OnBodyEntered;
}

private void OnBodyEntered(Node body)
{
    GD.Print($"Hit {body.Name}");

    if (LinearVelocity.Length() > 500)
    {
        GD.Print("Hard impact!");
    }
}
```

**Important:** Contact monitoring is **disabled by default** for performance. You must enable it in the Inspector before these signals work.

---

## 9.5 StaticBody2D — Walls and Floors

`StaticBody2D` is the simplest physics body — it doesn't move, but other bodies collide with it. Walls, floors, platforms, and any solid surface that isn't going anywhere.

### Setting Up Walls and Floors

```
Wall (StaticBody2D)
└── CollisionShape2D
```

That's it. No script needed. Add a StaticBody2D, give it a CollisionShape2D, and it's a solid wall. CharacterBody2D characters will collide with it, RigidBody2D objects will bounce off it.

You can add a Sprite2D or use it with a TileMap (which generates StaticBody2D collisions internally) — but the collision behavior requires no code.

### Moving Platforms with AnimatableBody2D

What if you need a platform that moves? `StaticBody2D` itself doesn't move (it ignores physics forces), but you can move it from code or with an `AnimationPlayer`. However, when a StaticBody2D is moved, it doesn't push characters standing on it — they'd be left behind in mid-air.

For moving platforms, use `AnimatableBody2D` instead. It's a StaticBody2D variant that properly carries other bodies when it moves:

```csharp
public partial class MovingPlatform : AnimatableBody2D
{
    [Export] public Vector2 MoveDistance = new Vector2(200, 0);
    [Export] public float Duration = 2f;

    private Vector2 _startPos;

    public override void _Ready()
    {
        _startPos = GlobalPosition;

        var tween = CreateTween().SetLoops().SetTrans(Tween.TransitionType.Sine);
        tween.TweenProperty(this, "global_position", _startPos + MoveDistance, Duration);
        tween.TweenProperty(this, "global_position", _startPos, Duration);
    }
}
```

Characters standing on this platform will move with it automatically.

### PhysicsMaterial on Static Bodies

StaticBody2D also supports PhysicsMaterial. Setting a low friction on a floor creates an ice surface:

```csharp
// Ice floor — characters slide
var ice = new PhysicsMaterial();
ice.Friction = 0.05f;
PhysicsMaterialOverride = ice;
```

Setting high bounce makes objects bounce off walls:

```csharp
// Bouncy wall
var bouncy = new PhysicsMaterial();
bouncy.Bounce = 0.9f;
PhysicsMaterialOverride = bouncy;
```

### Constant Velocity and Force

StaticBody2D has two properties for simulating surfaces that push things:

- **Constant Linear Velocity** — objects touching this surface are pushed at this velocity. Use for conveyor belts.
- **Constant Angular Velocity** — objects touching this surface are rotated. Use for spinning platforms.

These don't move the StaticBody2D itself — they affect bodies that touch it.

---

## 9.6 Area2D — Triggers and Detection Zones

`Area2D` is not a physics body — it doesn't block movement or participate in collisions. Instead, it **detects** when other bodies or areas enter, exit, or overlap with it. Think of it as an invisible sensor.

### Common Uses

- **Collectibles** — a coin that disappears when the player touches it.
- **Damage zones** — lava, spikes, or an enemy's attack hitbox.
- **Triggers** — stepping on a pressure plate opens a door.
- **Detection zones** — an enemy's "vision cone" that triggers a chase when the player enters.
- **Interaction zones** — the area around an NPC where the player can press E to talk.

### Setting Up an Area2D

```
Coin (Area2D)
├── Sprite2D
└── CollisionShape2D
```

Like all physics nodes, it needs a CollisionShape2D to define its region.

### Signals

Area2D's power comes from its signals:

```csharp
public partial class Coin : Area2D
{
    public override void _Ready()
    {
        BodyEntered += OnBodyEntered;
    }

    private void OnBodyEntered(Node2D body)
    {
        if (body is Player)
        {
            GD.Print("Coin collected!");
            QueueFree();
        }
    }
}
```

Key signals:

| Signal | Fires When |
|---|---|
| `BodyEntered` | A physics body (CharacterBody2D, RigidBody2D, StaticBody2D) enters the area |
| `BodyExited` | A physics body leaves the area |
| `AreaEntered` | Another Area2D enters this area |
| `AreaExited` | Another Area2D leaves this area |

**`BodyEntered` vs `AreaEntered`:** `BodyEntered` detects physics bodies (the player, enemies, crates). `AreaEntered` detects other Area2Ds. A common pattern is hitbox/hurtbox — the weapon's attack hitbox (Area2D) overlaps the enemy's hurtbox (Area2D), so you'd use `AreaEntered`.

### Querying Overlaps

Instead of reacting to signals, you can check what's currently inside an area:

```csharp
public override void _PhysicsProcess(double delta)
{
    var bodies = GetOverlappingBodies();
    foreach (var body in bodies)
    {
        if (body is Player player)
        {
            // Player is standing in the area right now
            player.TakeDamage(1);
        }
    }
}
```

`GetOverlappingBodies()` returns all physics bodies currently inside the area. `GetOverlappingAreas()` returns all Area2Ds.

**Important:** These methods only work if **Monitoring** is enabled (default `true`) on the Area2D.

### Area2D Properties

**Monitoring** — whether this area detects other bodies/areas entering it. If `false`, no signals fire and overlap queries return empty.

**Monitorable** — whether this area can be detected by *other* areas. If `false`, other Area2Ds won't report this one in their `AreaEntered` signals.

**Gravity, Linear Damp, Angular Damp** — Area2D can override physics properties for any RigidBody2D inside it. This is how you create:

- **Water zones** — increase linear damp to slow objects, reduce gravity.
- **Zero-gravity zones** — set gravity to zero inside a specific region.
- **Wind zones** — apply a directional gravity.

```csharp
// Water zone setup in the Inspector:
// Gravity Space Override: Replace
// Gravity: 200  (reduced from default ~980)
// Linear Damp Space Override: Replace
// Linear Damp: 5  (adds resistance)
```

### A Practical Example: Damage Zone

```csharp
public partial class DamageZone : Area2D
{
    [Export] public int Damage = 1;
    [Export] public float DamageInterval = 0.5f;

    private float _timer = 0f;

    public override void _PhysicsProcess(double delta)
    {
        _timer -= (float)delta;

        if (_timer <= 0)
        {
            foreach (var body in GetOverlappingBodies())
            {
                if (body.HasMethod("TakeDamage"))
                {
                    body.Call("TakeDamage", Damage);
                }
            }
            _timer = DamageInterval;
        }
    }
}
```

This damages any body with a `TakeDamage` method every `DamageInterval` seconds while they're inside the area. Lava, poison gas, electric fields — same pattern.

---

## 9.7 Gravity, Friction, and Bounce

We've touched on these throughout the chapter, but let's bring it all together.

### Gravity

Godot has a project-wide gravity setting: **Project → Project Settings → Physics → 2D → Default Gravity**. The default is `980` (pixels per second squared, mimicking Earth's ~9.8 m/s²).

Gravity only affects `RigidBody2D` automatically. For `CharacterBody2D`, you apply gravity yourself:

```csharp
// Use the project setting so all objects feel consistent
public float Gravity = ProjectSettings.GetSetting("physics/2d/default_gravity").AsSingle();

public override void _PhysicsProcess(double delta)
{
    if (!IsOnFloor())
    {
        Velocity += new Vector2(0, Gravity * (float)delta);
    }
    // ...
    MoveAndSlide();
}
```

Using `ProjectSettings.GetSetting()` instead of a hardcoded value means changing the project gravity affects all characters automatically.

### Better Jump Feel

Real-world gravity makes for floaty, unsatisfying jumps. Most good platformers cheat:

```csharp
[Export] public float Gravity = 980f;
[Export] public float FallMultiplier = 1.5f;
[Export] public float JumpVelocity = -400f;

public override void _PhysicsProcess(double delta)
{
    if (!IsOnFloor())
    {
        float gravityScale = Velocity.Y > 0 ? FallMultiplier : 1f;
        Velocity += new Vector2(0, Gravity * gravityScale * (float)delta);
    }

    if (Input.IsActionJustPressed("jump") && IsOnFloor())
    {
        Velocity = new Vector2(Velocity.X, JumpVelocity);
    }

    // Variable jump height: release early = shorter jump
    if (Input.IsActionJustReleased("jump") && Velocity.Y < 0)
    {
        Velocity = new Vector2(Velocity.X, Velocity.Y * 0.5f);
    }

    float direction = Input.GetAxis("move_left", "move_right");
    Velocity = new Vector2(direction * Speed, Velocity.Y);

    MoveAndSlide();
}
```

Two tricks here:

1. **Fall multiplier** — gravity is stronger when falling than when rising. The character rises quickly but falls sharply, making jumps feel snappy and weighty.
2. **Variable jump height** — releasing the jump button early cuts the upward velocity, resulting in a shorter jump. Holding it longer gives the full jump. This gives the player fine control.

### Friction

Friction controls how quickly objects slow down on surfaces. It's set through `PhysicsMaterial` resources on physics bodies.

For `CharacterBody2D`, Godot's built-in friction doesn't apply directly — you control movement speed yourself. But you can simulate friction:

```csharp
// Acceleration-based movement (feels better than instant speed changes)
[Export] public float Speed = 300f;
[Export] public float Acceleration = 1500f;
[Export] public float Friction = 1200f;

public override void _PhysicsProcess(double delta)
{
    float direction = Input.GetAxis("move_left", "move_right");

    if (direction != 0)
    {
        // Accelerate toward target speed
        Velocity = new Vector2(
            Mathf.MoveToward(Velocity.X, direction * Speed, Acceleration * (float)delta),
            Velocity.Y
        );
    }
    else
    {
        // Decelerate to zero
        Velocity = new Vector2(
            Mathf.MoveToward(Velocity.X, 0, Friction * (float)delta),
            Velocity.Y
        );
    }

    // gravity, jump, etc.
    MoveAndSlide();
}
```

`Mathf.MoveToward(current, target, maxDelta)` moves `current` toward `target` by at most `maxDelta`. This creates smooth acceleration and deceleration instead of snapping instantly to full speed.

The difference is night and day:

- **Without acceleration/friction:** Movement feels robotic. Full speed instantly, full stop instantly.
- **With acceleration/friction:** Movement feels responsive but weighty. Characters have momentum.

### Bounce

Bounce is controlled by the `Bounce` property on `PhysicsMaterial`. It only affects `RigidBody2D` automatically.

For `CharacterBody2D`, you can implement bounce manually:

```csharp
MoveAndSlide();

for (int i = 0; i < GetSlideCollisionCount(); i++)
{
    var collision = GetSlideCollision(i);
    Vector2 normal = collision.GetNormal();

    // Reflect velocity off the surface
    Velocity = Velocity.Bounce(normal) * 0.8f;  // 0.8 = 80% energy retention
}
```

`Vector2.Bounce()` reflects a vector off a surface defined by its normal. The `0.8f` multiplier means each bounce loses 20% of its energy, so the object eventually comes to rest.

### Putting It All Together

Here's a complete platformer character that combines everything from this chapter:

```csharp
public partial class Player : CharacterBody2D
{
    [Export] public float Speed = 300f;
    [Export] public float Acceleration = 2000f;
    [Export] public float Friction = 1500f;
    [Export] public float JumpVelocity = -450f;
    [Export] public float FallMultiplier = 1.5f;

    private float _gravity = ProjectSettings.GetSetting("physics/2d/default_gravity").AsSingle();

    public override void _PhysicsProcess(double delta)
    {
        ApplyGravity(delta);
        HandleJump();
        HandleHorizontalMovement(delta);
        MoveAndSlide();
    }

    private void ApplyGravity(double delta)
    {
        if (IsOnFloor()) return;

        float scale = Velocity.Y > 0 ? FallMultiplier : 1f;
        Velocity += new Vector2(0, _gravity * scale * (float)delta);
    }

    private void HandleJump()
    {
        if (Input.IsActionJustPressed("jump") && IsOnFloor())
        {
            Velocity = new Vector2(Velocity.X, JumpVelocity);
        }

        if (Input.IsActionJustReleased("jump") && Velocity.Y < 0)
        {
            Velocity = new Vector2(Velocity.X, Velocity.Y * 0.5f);
        }
    }

    private void HandleHorizontalMovement(double delta)
    {
        float direction = Input.GetAxis("move_left", "move_right");

        if (direction != 0)
        {
            Velocity = new Vector2(
                Mathf.MoveToward(Velocity.X, direction * Speed, Acceleration * (float)delta),
                Velocity.Y
            );
        }
        else
        {
            Velocity = new Vector2(
                Mathf.MoveToward(Velocity.X, 0, Friction * (float)delta),
                Velocity.Y
            );
        }
    }
}
```

Clean, separated into methods, with `[Export]` on all tunable values so you can tweak them in the Inspector without touching code.

---

## Summary

- **Moving a node by changing `Position` directly** works but ignores collisions. Always multiply movement by `delta` for frame-rate independence.
- **CharacterBody2D** is the standard for player characters and enemies — you control movement through code, and `MoveAndSlide()` handles collisions. Set **Motion Mode** to Floating for top-down, Grounded for platformers.
- **`MoveAndSlide()`** moves the body, detects collisions, and slides along surfaces. It applies delta internally — don't multiply velocity by delta yourself. Use `IsOnFloor()`, `IsOnWall()`, and `IsOnCeiling()` after calling it to check what the character is touching.
- **RigidBody2D** is controlled by the physics engine — apply forces and impulses instead of setting velocity directly. Use it for thrown objects, physics puzzles, and anything that should tumble and bounce realistically. Don't use it for player characters.
- **StaticBody2D** is for solid, immovable surfaces — walls, floors, and platforms. Use `AnimatableBody2D` for moving platforms that carry the player. Use Constant Linear Velocity for conveyor belts.
- **Area2D** is a sensor, not a solid body. Use it for collectibles, damage zones, triggers, and detection regions. Connect to `BodyEntered`/`BodyExited` signals or query `GetOverlappingBodies()`.
- **Gravity** affects RigidBody2D automatically. For CharacterBody2D, apply it manually in `_PhysicsProcess()`. Use `ProjectSettings.GetSetting()` for consistency.
- **Better jumps** use a fall multiplier (heavier falling) and variable height (release to cut jump short). These are simple tricks that make a massive difference in feel.
- **Acceleration and friction** via `Mathf.MoveToward()` make movement feel responsive and weighty instead of robotic.

**Next up: Chapter 10 — Collisions & Physics Shapes.** You know how to move characters and detect overlaps. Now let's dive deeper — collision layers and masks, raycasting, one-way platforms, and precise collision detection.
