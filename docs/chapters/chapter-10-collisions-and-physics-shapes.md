# Chapter 10: Collisions & Physics Shapes

---

## 10.1 CollisionShape2D and Collision Polygons

Every physics body in Godot — CharacterBody2D, RigidBody2D, StaticBody2D, Area2D — needs at least one `CollisionShape2D` child to participate in the physics world. Without it, the body exists but is invisible to the physics engine. It can't collide with anything.

### CollisionShape2D

`CollisionShape2D` takes a `Shape2D` resource that defines its geometry. You assign the shape in the Inspector under the **Shape** property.

Built-in shape types:

| Shape | Best For |
|---|---|
| `RectangleShape2D` | Walls, floors, crates, pixel-art characters |
| `CapsuleShape2D` | Characters — slides smoothly along surfaces, doesn't snag on edges |
| `CircleShape2D` | Balls, round objects, simple triggers |
| `WorldBoundaryShape2D` | Infinite floor/ceiling — a line that extends forever in one direction |
| `SegmentShape2D` | A single line segment — thin walls, laser beams |
| `SeparationRayShape2D` | Special shape for keeping characters grounded on slopes and stairs |

**Which shape should you use?** The simplest one that fits. Simpler shapes are cheaper for the physics engine. A `RectangleShape2D` is faster than a polygon with 20 vertices. For most characters, a `CapsuleShape2D` is the best balance between accuracy and performance.

### Creating Shapes in the Inspector

1. Select the `CollisionShape2D` node.
2. In the Inspector, click the **Shape** dropdown → **New RectangleShape2D** (or whichever type).
3. Resize the shape by dragging the handles in the 2D viewport, or set exact values in the Inspector.

**Tip:** Hold Alt while dragging a handle to resize symmetrically from the center.

### Multiple Collision Shapes

A single physics body can have multiple `CollisionShape2D` children. The engine treats them as one combined shape. This is useful for complex bodies:

```
Enemy (CharacterBody2D)
├── Sprite2D
├── CollisionShape2D          ← body (capsule)
└── CollisionShape2D          ← head (circle, positioned on top)
```

Each shape can be positioned, rotated, and scaled independently. Together they form the body's collision boundary.

### CollisionPolygon2D

When built-in shapes don't fit — an oddly shaped rock, a winding cave wall, a character with a unique silhouette — use `CollisionPolygon2D` instead. It lets you draw a freeform polygon:

1. Add a `CollisionPolygon2D` as a child of your physics body.
2. In the 2D viewport, click to place vertices. Each click adds a point.
3. Close the polygon by clicking near the first point, or press Enter.

```
Rock (StaticBody2D)
├── Sprite2D
└── CollisionPolygon2D      ← custom polygon matching the rock's outline
```

**Performance warning:** Collision polygons are more expensive than primitive shapes. A polygon with 30+ vertices is significantly slower than a couple of rectangles and circles that approximate the same shape. Use polygons only when you need precise outlines — which is rarely. Players won't notice if a rock's collision is slightly simpler than its sprite.

### Concave vs Convex

`CollisionPolygon2D` creates a **convex** polygon by default — no inward-facing corners allowed. If you draw a concave shape (like an L or a star), Godot automatically decomposes it into multiple convex pieces.

For `StaticBody2D`, you can set `Build Mode` to **Segments** to create a concave polygon that works as-is. This is useful for terrain outlines. But convex decomposition is generally fine and you rarely need to think about this.

### Disabling Shapes at Runtime

You can toggle a collision shape on or off:

```csharp
var shape = GetNode<CollisionShape2D>("CollisionShape2D");
shape.Disabled = true;   // physics engine ignores this shape
shape.Disabled = false;  // shape is active again
```

Common use case: a character has an attack hitbox that's disabled by default and enabled for a few frames during the attack animation.

**Important:** Never remove or add collision shapes during a physics callback (`_PhysicsProcess`, signal handlers). Instead, set `Disabled` to toggle them. Adding/removing nodes during physics can cause crashes or unpredictable behavior.

### One-Way Collision

`CollisionShape2D` has a **One Way Collision** property. When enabled, the shape only blocks movement from one side. Objects can pass through from the other direction.

This is the foundation for jump-through platforms — we'll cover the full setup in section 10.6.

---

## 10.2 Collision Layers and Masks

So far, everything collides with everything. The player collides with walls, enemies, coins, and projectiles. Enemies collide with each other, with the player's bullets, and with decorative objects. This quickly becomes a mess.

**Collision layers and masks** let you control exactly what collides with what.

### The Concept

Every physics body has two settings:

- **Layer** — which layers this body *exists on*. "I am on layer 1."
- **Mask** — which layers this body *scans for collisions*. "I look for things on layer 3."

A collision happens only when body A's **mask** includes a layer that body B is **on** (or vice versa).

```
Player:  Layer = 1,  Mask = 2, 3
Enemy:   Layer = 2,  Mask = 1
Wall:    Layer = 3,  Mask = (none)
Coin:    Layer = 4,  Mask = (none)  ← Area2D, detected by player's Area2D
```

In this setup:
- The player collides with enemies (mask 2) and walls (mask 3).
- Enemies collide with the player (mask 1) but not with each other (no mask 2).
- Walls don't scan for anything — they just sit there being solid.
- Coins are on their own layer, detected separately.

### Setting Layers and Masks in the Inspector

Every physics body and Area2D has **Collision → Layer** and **Collision → Mask** in the Inspector. They appear as a grid of numbered buttons (1–32). Click to toggle each layer on or off.

**Naming layers** makes life much easier. Go to **Project → Project Settings → Layer Names → 2D Physics** and name your layers:

```
Layer 1: Player
Layer 2: Enemies
Layer 3: World
Layer 4: Collectibles
Layer 5: PlayerProjectiles
Layer 6: EnemyProjectiles
Layer 7: Triggers
```

After naming, the Inspector shows names instead of numbers — much easier to work with.

### Setting Layers and Masks from Code

```csharp
// Set this body to exist on layer 1 only
CollisionLayer = 1;  // bit 1 = layer 1

// Set this body to scan layers 2 and 3
CollisionMask = 0b110;  // bits 2 and 3

// Or use the helper methods for clarity
SetCollisionLayerValue(1, true);   // enable layer 1
SetCollisionLayerValue(2, false);  // disable layer 2
SetCollisionMaskValue(3, true);    // scan layer 3
SetCollisionMaskValue(4, false);   // don't scan layer 4
```

`CollisionLayer` and `CollisionMask` are bitmasks. Layer 1 is bit 1 (value `1`), layer 2 is bit 2 (value `2`), layer 3 is bit 3 (value `4`), and so on. The helper methods `SetCollisionLayerValue()` and `SetCollisionMaskValue()` are easier to read and less error-prone.

### A Practical Layer Setup

Here's a layer configuration that works well for a typical 2D game:

| Layer | Name | Used By |
|---|---|---|
| 1 | Player | Player's CharacterBody2D |
| 2 | Enemies | Enemy CharacterBody2D nodes |
| 3 | World | Walls, floors, platforms (StaticBody2D) |
| 4 | Collectibles | Coins, health pickups (Area2D) |
| 5 | PlayerProjectiles | Bullets fired by the player |
| 6 | EnemyProjectiles | Bullets fired by enemies |
| 7 | PlayerHurtbox | Player's damage receiver (Area2D) |
| 8 | EnemyHurtbox | Enemy's damage receiver (Area2D) |

And the mask configuration:

| Body | Layer | Mask |
|---|---|---|
| Player | 1 | 3 (World) |
| Enemy | 2 | 2, 3 (Enemies, World) |
| Wall | 3 | — |
| Coin (Area2D) | 4 | 1 (Player) |
| Player Bullet | 5 | 3, 8 (World, EnemyHurtbox) |
| Enemy Bullet | 6 | 3, 7 (World, PlayerHurtbox) |

Notice: player bullets can't hit the player (mask doesn't include layer 1), and enemy bullets can't hit enemies (mask doesn't include layer 2). This is the power of layers — no `if` statements needed to filter out friendly fire.

### Changing Layers at Runtime

Sometimes you need to change which layer a body is on. A common example: making the player temporarily invincible after taking damage.

```csharp
public void BecomeInvincible(float duration)
{
    // Remove player from hurtbox layer — projectiles pass through
    SetCollisionLayerValue(7, false);

    // Restore after delay
    GetTree().CreateTimer(duration).Timeout += () =>
    {
        SetCollisionLayerValue(7, true);
    };
}
```

---

## 10.3 Detecting Collisions in Code

We covered `MoveAndSlide()` collision data in Chapter 9. Let's go deeper — there are several ways to detect and respond to collisions, depending on the body type.

### CharacterBody2D: After MoveAndSlide()

After calling `MoveAndSlide()`, you can inspect every collision that occurred:

```csharp
public override void _PhysicsProcess(double delta)
{
    // ... set velocity ...
    MoveAndSlide();

    for (int i = 0; i < GetSlideCollisionCount(); i++)
    {
        KinematicCollision2D collision = GetSlideCollision(i);

        // What did we hit?
        Node collider = (Node)collision.GetCollider();

        // Where did we hit it?
        Vector2 point = collision.GetPosition();

        // What direction is the surface?
        Vector2 normal = collision.GetNormal();

        // How hard did we hit? (approach velocity projected onto the normal)
        float impactSpeed = Velocity.Length();

        if (collider is RigidBody2D rigidBody)
        {
            // Push physics objects on collision
            Vector2 pushDirection = -normal;
            rigidBody.ApplyImpulse(pushDirection * 50f);
        }
    }
}
```

### KinematicCollision2D Properties

The `KinematicCollision2D` object returned by `GetSlideCollision()` contains everything about the collision:

| Method | Returns |
|---|---|
| `GetCollider()` | The object we collided with |
| `GetColliderId()` | The instance ID of the collider |
| `GetPosition()` | The world-space contact point |
| `GetNormal()` | The surface normal at the contact point |
| `GetTravel()` | How far the body actually moved before the collision |
| `GetRemainder()` | How far it wanted to move but couldn't |
| `GetDepth()` | How deep the penetration is |
| `GetAngle()` | The angle of the collision surface relative to `UpDirection` |

### MoveAndCollide() — The Manual Alternative

`MoveAndSlide()` handles sliding for you automatically. If you want more control, use `MoveAndCollide()` instead:

```csharp
public override void _PhysicsProcess(double delta)
{
    Vector2 motion = Velocity * (float)delta;
    KinematicCollision2D collision = MoveAndCollide(motion);

    if (collision != null)
    {
        // We hit something — decide what to do yourself
        Vector2 normal = collision.GetNormal();

        // Option 1: bounce
        Velocity = Velocity.Bounce(normal) * 0.8f;

        // Option 2: stop
        // Velocity = Vector2.Zero;

        // Option 3: slide (what MoveAndSlide does)
        // Velocity = Velocity.Slide(normal);
    }
}
```

Key differences from `MoveAndSlide()`:

- **You multiply by delta yourself** — `MoveAndCollide()` takes a motion vector, not a velocity.
- **No automatic sliding** — the body stops at the collision point. You decide what happens next.
- **Returns one collision** — `MoveAndSlide()` handles multiple collisions in a single call. With `MoveAndCollide()`, you handle one collision at a time.
- **No floor/wall/ceiling detection** — `IsOnFloor()` etc. are not updated. You check the normal yourself.

`MoveAndCollide()` is useful for projectiles (bounce off walls), custom physics (billiard balls), or any scenario where the default sliding behavior isn't what you want.

### RigidBody2D: Contact Signals

RigidBody2D uses signals for collision detection. Remember to enable **Contact Monitor** and set **Max Contacts Reported** in the Inspector first:

```csharp
public partial class PhysicsCrate : RigidBody2D
{
    public override void _Ready()
    {
        ContactMonitor = true;
        MaxContactsReported = 4;

        BodyEntered += OnBodyEntered;
        BodyExited += OnBodyExited;
    }

    private void OnBodyEntered(Node body)
    {
        GD.Print($"Started touching: {body.Name}");
    }

    private void OnBodyExited(Node body)
    {
        GD.Print($"Stopped touching: {body.Name}");
    }
}
```

### Testing Collision Without Moving

Sometimes you need to check if a body *would* collide if it moved, without actually moving it. Use `TestMove()`:

```csharp
// Would we collide if we moved 10 pixels down?
bool wouldCollide = TestMove(Transform, new Vector2(0, 10));

if (wouldCollide)
{
    GD.Print("There's ground below us");
}
```

`TestMove()` doesn't move the body — it just checks. This is useful for look-ahead logic: checking if the player is near a ledge, if an enemy would walk off a platform, or if there's room to stand up from a crouch.

---

## 10.4 Area2D Overlap Detection

Chapter 9 introduced Area2D signals. Let's explore the full overlap detection system — it's more powerful than simple enter/exit signals.

### Signal-Based Detection (Review)

```csharp
public partial class DetectionZone : Area2D
{
    public override void _Ready()
    {
        BodyEntered += OnBodyEntered;
        BodyExited += OnBodyExited;
        AreaEntered += OnAreaEntered;
        AreaExited += OnAreaExited;
    }

    private void OnBodyEntered(Node2D body) { }   // CharacterBody2D, RigidBody2D, StaticBody2D
    private void OnBodyExited(Node2D body) { }
    private void OnAreaEntered(Area2D area) { }    // other Area2D nodes
    private void OnAreaExited(Area2D area) { }
}
```

### Polling Overlaps

Instead of reacting to signals, you can check what's overlapping right now:

```csharp
public override void _PhysicsProcess(double delta)
{
    // All physics bodies inside this area
    var bodies = GetOverlappingBodies();

    // All Area2D nodes inside this area
    var areas = GetOverlappingAreas();

    GD.Print($"Bodies inside: {bodies.Count}, Areas inside: {areas.Count}");
}
```

**When to use polling vs signals:**

- **Signals** — react the moment something enters or exits. Good for collectibles (`QueueFree()` on enter), triggers (play animation once), and one-time events.
- **Polling** — check every frame what's currently inside. Good for continuous effects (damage over time), physics zones (gravity override), and any logic that depends on *all* current occupants.

### Hitbox/Hurtbox Pattern

The most important Area2D pattern in game development. Nearly every action game uses it:

- **Hitbox** — the area that *deals* damage (weapon swing, projectile, attack area).
- **Hurtbox** — the area that *receives* damage (the character's vulnerable zone).

Both are Area2D nodes. The hitbox detects overlap with hurtboxes.

```
Player (CharacterBody2D)
├── Sprite2D
├── CollisionShape2D           ← physics collision (walls, floors)
├── Hurtbox (Area2D)           ← can receive damage
│   └── CollisionShape2D
└── AttackHitbox (Area2D)      ← deals damage (disabled by default)
    └── CollisionShape2D
```

```csharp
public partial class Hurtbox : Area2D
{
    [Signal] public delegate void HurtEventHandler(int damage, Vector2 knockbackDirection);

    public void TakeHit(int damage, Vector2 from)
    {
        Vector2 knockback = (GlobalPosition - from).Normalized();
        EmitSignal(SignalName.Hurt, damage, knockback);
    }
}
```

```csharp
public partial class Hitbox : Area2D
{
    [Export] public int Damage = 1;

    public override void _Ready()
    {
        AreaEntered += OnAreaEntered;
    }

    private void OnAreaEntered(Area2D area)
    {
        if (area is Hurtbox hurtbox)
        {
            hurtbox.TakeHit(Damage, GlobalPosition);
        }
    }
}
```

**Layer setup for hitbox/hurtbox:**

| Node | Layer | Mask |
|---|---|---|
| Player Hurtbox | 7 (PlayerHurtbox) | — |
| Player Hitbox | — | 8 (EnemyHurtbox) |
| Enemy Hurtbox | 8 (EnemyHurtbox) | — |
| Enemy Hitbox | — | 7 (PlayerHurtbox) |

The hitbox scans for hurtboxes. The hurtbox just sits there being detectable. This way, the player's attack only damages enemies, and enemy attacks only damage the player — no code filtering needed.

### Overlap Timing Gotcha

`GetOverlappingBodies()` and `GetOverlappingAreas()` return empty results on the first frame the Area2D exists. The physics engine needs one physics tick to register overlaps. If you need to check overlaps immediately after adding an Area2D to the scene:

```csharp
public override void _Ready()
{
    // Force the physics engine to update overlaps immediately
    await ToSignal(GetTree(), SceneTree.SignalName.PhysicsFrame);

    var bodies = GetOverlappingBodies();
    // Now this returns accurate results
}
```

---

## 10.5 Raycasting in 2D

A raycast fires an invisible line from point A to point B and tells you what it hits first. It's one of the most useful tools in game development.

### Common Uses

- **Ground detection** — is there ground ahead? (prevent enemies from walking off ledges)
- **Line of sight** — can the enemy see the player? (no wall in between)
- **Targeting** — what is the player aiming at?
- **Wall detection** — is there a wall ahead? (enemy should turn around)
- **Ledge detection** — fire a ray downward from the edge of a platform to check for ground

### RayCast2D Node

The simplest way to raycast. Add a `RayCast2D` as a child of your node:

```
Enemy (CharacterBody2D)
├── Sprite2D
├── CollisionShape2D
├── FloorDetector (RayCast2D)    ← points down-forward to detect ledges
└── WallDetector (RayCast2D)     ← points forward to detect walls
```

Configure in the Inspector:

- **Target Position** — the end point of the ray, relative to the node. `(0, 50)` fires 50 pixels downward.
- **Enabled** — whether the ray is active. Default `true`.
- **Collision Mask** — which layers the ray detects. Same system as physics bodies.
- **Collide With Areas** — whether the ray detects Area2D nodes. Default `false`.
- **Collide With Bodies** — whether the ray detects physics bodies. Default `true`.

### Querying the RayCast2D

```csharp
public partial class PatrolEnemy : CharacterBody2D
{
    private RayCast2D _floorDetector;
    private RayCast2D _wallDetector;
    private int _direction = 1;

    public override void _Ready()
    {
        _floorDetector = GetNode<RayCast2D>("FloorDetector");
        _wallDetector = GetNode<RayCast2D>("WallDetector");
    }

    public override void _PhysicsProcess(double delta)
    {
        // Turn around if there's no floor ahead or a wall ahead
        if (!_floorDetector.IsColliding() || _wallDetector.IsColliding())
        {
            _direction *= -1;
            _floorDetector.TargetPosition = new Vector2(_direction * 20, 30);
            _wallDetector.TargetPosition = new Vector2(_direction * 20, 0);
        }

        Velocity = new Vector2(_direction * 100, Velocity.Y);

        if (!IsOnFloor())
        {
            Velocity += new Vector2(0, 980 * (float)delta);
        }

        MoveAndSlide();
    }
}
```

When the floor detector doesn't hit anything, it means there's a ledge ahead — time to turn around. When the wall detector hits something, there's a wall — also turn around.

### RayCast2D Properties

After the physics frame, a colliding RayCast2D gives you:

```csharp
if (_rayCast.IsColliding())
{
    // What did the ray hit?
    GodotObject collider = _rayCast.GetCollider();

    // Where did it hit? (world coordinates)
    Vector2 point = _rayCast.GetCollisionPoint();

    // What's the surface normal at the hit point?
    Vector2 normal = _rayCast.GetCollisionNormal();
}
```

### Code-Based Raycasting (PhysicsDirectSpaceState2D)

Sometimes you don't want a persistent RayCast2D node — you just need a one-off query. Use the physics space directly:

```csharp
public bool CanSeePlayer(Vector2 playerPosition)
{
    var spaceState = GetWorld2D().DirectSpaceState;

    var query = PhysicsRayQueryParameters2D.Create(
        GlobalPosition,      // from
        playerPosition,      // to
        CollisionMask        // which layers to check
    );

    var result = spaceState.IntersectRay(query);

    if (result.Count == 0)
    {
        // Ray hit nothing — clear line of sight
        return true;
    }

    // Check if the first thing the ray hit is the player
    var collider = result["collider"].As<Node2D>();
    return collider is Player;
}
```

`IntersectRay()` returns a dictionary with these keys (empty dictionary if nothing was hit):

| Key | Value |
|---|---|
| `position` | Contact point (Vector2) |
| `normal` | Surface normal (Vector2) |
| `collider` | The object hit (GodotObject) |
| `collider_id` | Instance ID of the collider |
| `rid` | The RID of the collider |
| `shape` | Shape index of the collider |

### Excluding Bodies from Raycasts

You often want a raycast to ignore the body it's attached to:

```csharp
var query = PhysicsRayQueryParameters2D.Create(GlobalPosition, targetPosition);
query.Exclude = new Godot.Collections.Array<Rid> { GetRid() };  // ignore self
```

For `RayCast2D` nodes, add exceptions in the Inspector or from code:

```csharp
_rayCast.AddException(this);  // ignore the parent body
```

### Shape Casting

Raycasts are infinitely thin — they can miss things. If you need to cast a shape (like a wide beam instead of a thin line), use `PhysicsShapeQueryParameters2D`:

```csharp
public bool IsPathClear(Vector2 from, Vector2 to, float radius)
{
    var spaceState = GetWorld2D().DirectSpaceState;

    var query = new PhysicsShapeQueryParameters2D();
    query.Shape = new CircleShape2D { Radius = radius };
    query.Transform = new Transform2D(0, from);
    query.Motion = to - from;
    query.CollisionMask = CollisionMask;

    var results = spaceState.CastMotion(query);

    // results[0] = safe proportion (0-1, how far we can go without collision)
    // results[1] = unsafe proportion (where the collision starts)
    return results[0] >= 1.0f;  // 1.0 = full path is clear
}
```

This is like sweeping a circle from `from` to `to` and checking if it hits anything. Useful for checking if a character has room to move, or if a wide projectile would hit something.

---

## 10.6 One-Way Platforms and Slopes

Two mechanics that every 2D platformer needs — and both require understanding how collision shapes and physics interact.

### One-Way Platforms

A one-way platform lets the player jump through it from below and land on top. Think of the floating platforms in Mario or any platformer with layered level design.

**Setup:**

1. Create a `StaticBody2D` (or `AnimatableBody2D` for moving platforms).
2. Add a `CollisionShape2D` child.
3. On the `CollisionShape2D`, enable **One Way Collision** in the Inspector.
4. The **One Way Collision Margin** controls how thick the one-way zone is (default 1 pixel — increase if characters are falling through at high speed).

```
Platform (StaticBody2D)
├── Sprite2D
└── CollisionShape2D           ← One Way Collision = true
```

That's it. The character passes through from below and lands on top. No code required.

**How it works:** The collision shape only blocks movement that comes from above (against the shape's normal direction). Movement from below, left, or right passes through.

### Dropping Through One-Way Platforms

Most platformers let the player press Down + Jump (or just Down) to drop through a one-way platform. There are several approaches:

**Approach 1: Temporarily disable the collision shape**

```csharp
public override void _PhysicsProcess(double delta)
{
    // ... normal movement code ...

    if (IsOnFloor() && Input.IsActionJustPressed("move_down"))
    {
        // Disable collision with one-way platforms briefly
        Position += new Vector2(0, 1);  // nudge below the platform surface
        // The one-way collision won't block from below, so the player falls through
    }

    MoveAndSlide();
}
```

**Approach 2: Use collision layers**

Put one-way platforms on a dedicated layer (e.g., layer 9: "Platforms"). When the player wants to drop through, temporarily remove that layer from their mask:

```csharp
private async void DropThroughPlatform()
{
    SetCollisionMaskValue(9, false);    // stop colliding with platforms
    await ToSignal(GetTree().CreateTimer(0.2f), Timer.SignalName.Timeout);
    SetCollisionMaskValue(9, true);     // restore collision
}
```

This is the cleaner approach — it works regardless of how many platforms are nearby and doesn't require toggling individual shapes.

### Slopes

CharacterBody2D handles slopes automatically through `MoveAndSlide()`, but the behavior depends on several properties.

**Max Floor Angle** — the steepest angle the character treats as "floor" (default 45°, which is `Mathf.Pi / 4` radians). Anything steeper is a wall.

```csharp
// Allow steeper slopes (60 degrees)
FloorMaxAngle = Mathf.DegToRad(60);
```

**Floor Snap Length** — how strongly the character sticks to the floor when walking down slopes. Without snap, the character briefly goes airborne at the crest of a hill:

```
Without snap:              With snap:
    ___                        ___
   /   ↑ airborne!            /   ↓ stays grounded
  /                           /
```

Set this in the Inspector under **Floor → Snap Length**. A value of 4–8 pixels works for most games. It's automatically disabled during jumps (when velocity is upward) so it doesn't prevent jumping.

**Stop On Slope** — when `true`, the character doesn't slide down slopes when standing still. When `false`, gravity pulls the character downward on any slope. Default is `true` — almost always what you want.

**Floor Block On Wall** — when `true`, the character can't slide up walls (useful to prevent wall-climbing exploits). Default `true`.

### Slope Speed Adjustment

Walking up a slope should feel slower than walking on flat ground, and walking down should feel faster. This happens naturally with `MoveAndSlide()` because the velocity is projected onto the slope surface. But you can enhance it:

```csharp
public override void _PhysicsProcess(double delta)
{
    float direction = Input.GetAxis("move_left", "move_right");
    float speed = Speed;

    // Check the floor angle
    if (IsOnFloor())
    {
        float floorAngle = GetFloorAngle();

        if (floorAngle > 0.1f)
        {
            // Get the floor normal to determine if we're going up or down
            Vector2 floorNormal = GetFloorNormal();
            bool goingUphill = (direction > 0 && floorNormal.X < 0) ||
                               (direction < 0 && floorNormal.X > 0);

            if (goingUphill)
            {
                speed *= 0.8f;   // 20% slower going uphill
            }
            else
            {
                speed *= 1.2f;   // 20% faster going downhill
            }
        }
    }

    Velocity = new Vector2(direction * speed, Velocity.Y);

    // ... gravity, jump, etc. ...
    MoveAndSlide();
}
```

### Stairs

Stairs are tricky in 2D. The simplest approach: use a slope collision shape over stair-shaped sprites. The character walks smoothly up the invisible slope while the stairs are purely visual.

```
Stairs (StaticBody2D)
├── Sprite2D                   ← visual stair steps
└── CollisionShape2D           ← smooth slope that covers the stairs
```

For more precise stair-stepping behavior, you can use `SeparationRayShape2D` — a special shape that pushes the character upward to stay on top of steps. Add it as an additional collision shape pointing downward:

```
Player (CharacterBody2D)
├── Sprite2D
├── CollisionShape2D                    ← main body (capsule)
└── CollisionShape2D (SeparationRay)    ← short ray pointing down, handles steps
```

The separation ray shape's length determines the maximum step height the character can walk up without jumping.

---

## Summary

- **CollisionShape2D** gives physics bodies their shape. Use primitive shapes (rectangle, capsule, circle) whenever possible — they're cheaper than polygons. Use `CollisionPolygon2D` only for irregular shapes that can't be approximated.
- **Multiple collision shapes** on one body combine into a single boundary. Toggle shapes on/off with `Disabled` — never add/remove shapes during physics callbacks.
- **Collision layers and masks** control what collides with what. A body's **layer** is where it exists; its **mask** is what it looks for. Name your layers in Project Settings for sanity.
- **After `MoveAndSlide()`**, query collisions with `GetSlideCollision()`. Use `MoveAndCollide()` when you want full control over the collision response (bouncing, stopping, custom behavior).
- **Area2D overlap detection** works via signals (`BodyEntered`/`AreaEntered`) for instant reactions, or polling (`GetOverlappingBodies()`) for continuous effects. The **hitbox/hurtbox pattern** is the standard for combat systems.
- **Raycasting** fires an invisible line and reports what it hits. Use `RayCast2D` nodes for persistent checks (floor/wall detection) and `PhysicsDirectSpaceState2D` for one-off queries (line of sight, targeting). Shape casting sweeps a shape instead of a thin line.
- **One-way platforms** use the One Way Collision property on `CollisionShape2D`. Drop-through by temporarily disabling the platform's collision layer in the player's mask.
- **Slopes** work automatically with `MoveAndSlide()`. Tune **Max Floor Angle**, **Snap Length**, and **Stop On Slope** for the right feel. Use smooth slope collisions over stair visuals for clean stair movement.

**Next up: Chapter 11 — TileMaps.** You've learned how individual collision shapes work. Now let's paint entire levels with tiles — grids of sprites with built-in collision, auto-tiling rules, and terrain systems.
