# Chapter 14: Player Character

---

## 14.1 Player Scene Setup (CharacterBody2D)

Time to make something move. The player character is the most important element in any platformer — it's what the player touches, sees, and feels every single frame. We'll build it piece by piece, starting with the scene structure.

### The Player Scene Tree

Create a new scene (`Scene → New Scene`) and build this node tree:

```
Player (CharacterBody2D)
├── AnimatedSprite2D
├── CollisionShape2D
├── CoyoteTimer (Timer)
├── JumpBufferTimer (Timer)
└── Camera2D
```

Save it as `res://scenes/player/player.tscn`.

We're using `AnimatedSprite2D` from the start — whether your asset pack provides individual files or sprite sheets, `AnimatedSprite2D` handles both. We'll set up the animations in section 14.3; for now, just add the node.

Let's set up each node.

### CharacterBody2D (Root)

Select the root `Player` node and configure in the Inspector:

```
Motion Mode:         Grounded
Floor → Stop on Slope: true
Floor → Max Angle:     45°
```

The remaining defaults (Snap Length, Wall Min Slide Angle, etc.) are fine as-is.

**Grounded** motion mode is designed for platformers — it distinguishes between floor, wall, and ceiling based on a configurable up direction (default: `Vector2.Up`). This gives us `IsOnFloor()`, `IsOnWall()`, and `IsOnCeiling()` for free.

### AnimatedSprite2D

Leave this empty for now — we'll configure the `SpriteFrames` resource and animations in section 14.3. The character will be invisible until then, but the movement code in 14.2 works regardless.

**Pixel art reminder:** If sprites look blurry later, verify that `Default Texture Filter` is set to `Nearest` in Project Settings (we did this in Chapter 13.4). You can also override per-node under Texture → Filter in the Inspector.

### CollisionShape2D

Add a `CapsuleShape2D` (or `RectangleShape2D` if you prefer):

- **Capsule** — rounded bottom slides smoothly over terrain. Better for most platformers.
- **Rectangle** — precise for pixel art, but can snag on tile edges.

Set the capsule to roughly **14×20 pixels** for a typical platformer character — slightly smaller than the sprite so the player doesn't feel like they're colliding with things they visually aren't touching. You won't see the sprite yet, but you can fine-tune the shape size once animations are set up in 14.3.

**Important:** The collision shape should be slightly smaller than the sprite. Players feel cheated when they die to a spike they didn't visually touch. A forgiving hitbox makes the game feel fair.

### Timers

We need two timers for game feel (used in sections 14.4):

**CoyoteTimer:**
```
Wait Time: 0.1
One Shot:  true
Autostart: false
```

**JumpBufferTimer:**
```
Wait Time: 0.1
One Shot:  true
Autostart: false
```

Leave them for now — we'll wire them up in section 14.4.

### Camera2D

We set up cameras in Chapter 12, so keep it simple:

```
Position Smoothing → Enabled: true
Position Smoothing → Speed: 5.0
Limit → Left: 0
Limit → Top: 0
```

We'll adjust camera limits per-level in Chapter 15. For now, the camera follows the player with smoothing.

### Attach the Script

Create `res://scenes/player/player.cs` and attach it to the root node. Here's the skeleton:

```csharp
using Godot;

public partial class Player : CharacterBody2D
{
    // Movement constants — we'll tune these throughout the chapter
    [Export] public float MoveSpeed { get; set; } = 130f;
    [Export] public float JumpForce { get; set; } = 300f;
    [Export] public float Gravity { get; set; } = 980f;

    public override void _PhysicsProcess(double delta)
    {
        // All movement code goes here
    }
}
```

**Why `[Export]`?** It exposes these values in the Inspector so you can tweak them without recompiling. Platformer movement is 90% tuning — you'll change these numbers dozens of times.

**Why `_PhysicsProcess` and not `_Process`?** Physics runs at a fixed rate (default 60 times/sec) regardless of frame rate. Movement and collision code belongs here for consistent behavior. `_Process` runs every render frame — use it for visuals, input polling, and animations.

---

## 14.2 Movement — Run, Jump, Fall

This is the core of the entire game. Get this right and everything else builds on a solid foundation. Get it wrong and no amount of enemies, levels, or polish will save the game from feeling bad.

### Horizontal Movement

```csharp
private void HandleMovement()
{
    float direction = Input.GetAxis("move_left", "move_right");
    Velocity = new Vector2(direction * MoveSpeed, Velocity.Y);
}
```

`Input.GetAxis()` returns a float from -1 to 1. With keyboard input, it's exactly -1 (left), 0 (neither), or 1 (right). With a gamepad stick, it smoothly transitions through all values in between.

This is the simplest possible horizontal movement: instant full speed, instant stop. It feels responsive but robotic. We'll add acceleration and friction later in this section.

### Input Map

Before this code works, define the input actions in **Project → Project Settings → Input Map**:

| Action | Key | Gamepad |
| --- | --- | --- |
| `move_left` | A / Left Arrow | Left Stick Left |
| `move_right` | D / Right Arrow | Left Stick Right |
| `jump` | Space / W / Up Arrow | A Button (Xbox) / Cross (PS) |

### Basic Gravity and Jump

```csharp
[Export] public float JumpForce { get; set; } = 300f;
[Export] public float Gravity { get; set; } = 980f;

private void ApplyGravity(float delta)
{
    if (!IsOnFloor())
    {
        Velocity = new Vector2(Velocity.X, Velocity.Y + Gravity * delta);
    }
}

private void HandleJump()
{
    if (Input.IsActionJustPressed("jump") && IsOnFloor())
    {
        Velocity = new Vector2(Velocity.X, -JumpForce);
    }
}
```

Gravity is applied every physics frame when the player is airborne. Jump sets a negative Y velocity (up in Godot's coordinate system where Y increases downward).

**Why negative?** In Godot's 2D space, Y points down. Moving up means decreasing Y. A jump velocity of -300 means "move upward at 300 pixels per second." Gravity (+980) pulls the velocity back toward positive (downward) over time, creating the jump arc.

### Putting It Together

```csharp
public override void _PhysicsProcess(double delta)
{
    ApplyGravity((float)delta);
    HandleMovement();
    HandleJump();
    MoveAndSlide();
}
```

`MoveAndSlide()` takes the current `Velocity`, moves the body, handles collisions, and updates `Velocity` to reflect any collisions that occurred. Call it once, at the end.

Press F5 and test. The player should run left/right and jump. It works, but it probably feels wrong — too floaty, too stiff, too something. That's normal. Raw physics values never feel right out of the box.

### Tuning Gravity — The 80% Solution

Here's a secret most tutorials skip: **platformer gravity should be much higher than real-world gravity**, and **jump force should be proportionally high too**. Real gravity feels floaty in a game because games need snappy responsiveness.

Good starting values for our 320×180 viewport:

```csharp
[Export] public float MoveSpeed { get; set; } = 130f;
[Export] public float JumpForce { get; set; } = 300f;
[Export] public float Gravity { get; set; } = 980f;
[Export] public float FallMultiplier { get; set; } = 1.5f;
```

The **fall multiplier** is the key insight. When the player is falling (velocity.Y > 0), we apply extra gravity so they come down faster than they went up. This creates a satisfying arc: slow rise, fast fall. Almost every great platformer does this.

```csharp
private void ApplyGravity(float delta)
{
    if (!IsOnFloor())
    {
        float gravityScale = Velocity.Y > 0 ? FallMultiplier : 1.0f;
        Velocity = new Vector2(Velocity.X, Velocity.Y + Gravity * gravityScale * delta);
    }
}
```

### Variable Jump Height

Players expect: tap jump = small hop, hold jump = full jump. This is critical for precision platforming.

The trick: when the player **releases** the jump button while still moving upward, cut the vertical velocity:

```csharp
private void HandleJump()
{
    if (Input.IsActionJustPressed("jump") && IsOnFloor())
    {
        Velocity = new Vector2(Velocity.X, -JumpForce);
    }

    // Variable jump height: releasing jump early cuts upward velocity
    if (Input.IsActionJustReleased("jump") && Velocity.Y < 0)
    {
        Velocity = new Vector2(Velocity.X, Velocity.Y * 0.5f);
    }
}
```

Multiplying by 0.5 halves the remaining upward velocity. The player still goes up, but the arc ends sooner. This single mechanic makes jumping feel dramatically more controllable.

### Acceleration and Friction

Instant speed changes feel robotic. Adding acceleration (ramp up to full speed) and friction (slow to a stop) makes movement feel physical:

```csharp
[Export] public float Acceleration { get; set; } = 900f;
[Export] public float Friction { get; set; } = 1200f;
[Export] public float AirFriction { get; set; } = 200f;

private void HandleMovement()
{
    float direction = Input.GetAxis("move_left", "move_right");

    if (direction != 0)
    {
        // Accelerate toward target speed
        float targetSpeed = direction * MoveSpeed;
        Velocity = new Vector2(
            Mathf.MoveToward(Velocity.X, targetSpeed, Acceleration * (float)GetPhysicsProcessDeltaTime()),
            Velocity.Y
        );
    }
    else
    {
        // Apply friction to slow down
        float friction = IsOnFloor() ? Friction : AirFriction;
        Velocity = new Vector2(
            Mathf.MoveToward(Velocity.X, 0, friction * (float)GetPhysicsProcessDeltaTime()),
            Velocity.Y
        );
    }
}
```

`Mathf.MoveToward(current, target, step)` moves `current` toward `target` by at most `step`, never overshooting. It's perfect for smooth speed transitions.

**Air friction is lower than ground friction.** On the ground, you stop quickly (high friction). In the air, you keep more momentum (low air friction). This lets players commit to aerial trajectories while still having precise ground control.

### Terminal Velocity

Without a speed cap, a player falling for a long time accelerates indefinitely. Add a terminal velocity:

```csharp
[Export] public float MaxFallSpeed { get; set; } = 400f;

private void ApplyGravity(float delta)
{
    if (!IsOnFloor())
    {
        float gravityScale = Velocity.Y > 0 ? FallMultiplier : 1.0f;
        Velocity = new Vector2(
            Velocity.X,
            Mathf.Min(Velocity.Y + Gravity * gravityScale * delta, MaxFallSpeed)
        );
    }
}
```

`Mathf.Min` clamps the downward velocity. The player still accelerates while falling, but never exceeds 400 px/sec downward.

### The Complete Movement Script (So Far)

```csharp
using Godot;

public partial class Player : CharacterBody2D
{
    [Export] public float MoveSpeed { get; set; } = 130f;
    [Export] public float Acceleration { get; set; } = 900f;
    [Export] public float Friction { get; set; } = 1200f;
    [Export] public float AirFriction { get; set; } = 200f;
    [Export] public float JumpForce { get; set; } = 300f;
    [Export] public float Gravity { get; set; } = 980f;
    [Export] public float FallMultiplier { get; set; } = 1.5f;
    [Export] public float MaxFallSpeed { get; set; } = 400f;

    public override void _PhysicsProcess(double delta)
    {
        ApplyGravity((float)delta);
        HandleMovement();
        HandleJump();
        MoveAndSlide();
    }

    private void ApplyGravity(float delta)
    {
        if (!IsOnFloor())
        {
            float gravityScale = Velocity.Y > 0 ? FallMultiplier : 1.0f;
            Velocity = new Vector2(
                Velocity.X,
                Mathf.Min(Velocity.Y + Gravity * gravityScale * delta, MaxFallSpeed)
            );
        }
    }

    private void HandleMovement()
    {
        float direction = Input.GetAxis("move_left", "move_right");

        if (direction != 0)
        {
            float targetSpeed = direction * MoveSpeed;
            Velocity = new Vector2(
                Mathf.MoveToward(Velocity.X, targetSpeed, Acceleration * (float)GetPhysicsProcessDeltaTime()),
                Velocity.Y
            );
        }
        else
        {
            float friction = IsOnFloor() ? Friction : AirFriction;
            Velocity = new Vector2(
                Mathf.MoveToward(Velocity.X, 0, friction * (float)GetPhysicsProcessDeltaTime()),
                Velocity.Y
            );
        }
    }

    private void HandleJump()
    {
        if (Input.IsActionJustPressed("jump") && IsOnFloor())
        {
            Velocity = new Vector2(Velocity.X, -JumpForce);
        }

        if (Input.IsActionJustReleased("jump") && Velocity.Y < 0)
        {
            Velocity = new Vector2(Velocity.X, Velocity.Y * 0.5f);
        }
    }
}
```

Test this and spend time tweaking the exported values in the Inspector. Every platformer has different feel — Celeste is tight and snappy, Hollow Knight is weighty and deliberate, Mario is somewhere in between. There's no objectively correct set of numbers; there's only what feels right for your game.

---

## 14.3 Animations — Idle, Run, Jump

Movement code is invisible. Animations are what the player actually sees. A character that slides around with a static image feels like a placeholder; a character that leans into their run, squashes on landing, and stretches during a jump feels alive.

### Setting Up AnimatedSprite2D

We already added the `AnimatedSprite2D` node in 14.1. Now let's give it animations.

1. Select the `AnimatedSprite2D` node.
2. In the Inspector, create a new `SpriteFrames` resource (click `Sprite Frames → New SpriteFrames`).
3. Click the `SpriteFrames` resource to open the animation editor at the bottom of the screen.

### Creating Animations

In the SpriteFrames editor (bottom panel):

1. You'll see a "default" animation. Rename it to `idle`.
2. Click **Add Animation** (the "+" icon) to create: `run`, `jump`, `hurt`.
3. Add frames to each animation using one of two methods, depending on your asset pack:

**Individual image files** (e.g., Kenney's Platformer Art Deluxe): drag the relevant files from the FileSystem panel into the frame list. You can select multiple files and drag them all at once.

**Sprite sheets** (e.g., Kenney's Pixel Platformer): click the **Add Frames from Sprite Sheet** button (grid icon), select the sprite sheet, set the grid size to match your sprites, click the frames you want in order, then click **Add Frames**.

Configure each animation:

| Animation | Frames | FPS | Loop |
| --- | --- | --- | --- |
| `idle` | 1 frame | 8 | Yes |
| `run` | 11 frames | 10 | Yes |
| `jump` | 1 frame | 10 | No |
| `hurt` | 1 frame | 10 | No |

Single-frame "animations" work fine — `AnimatedSprite2D` handles them without issues, and the code doesn't care how many frames each animation has. We won't wire up `hurt` in this chapter — it gets used in Chapter 17 when we build the health system.

**Loop** means the animation repeats. Idle and run loop continuously. Jump plays once and holds on the last frame — we'll use it for falling too, since most asset packs don't include a separate fall sprite.

### Sprite Flipping

The character needs to face the direction of movement. Rather than having left-facing and right-facing sprites, we flip the entire `AnimatedSprite2D` horizontally:

```csharp
private AnimatedSprite2D _sprite;

public override void _Ready()
{
    _sprite = GetNode<AnimatedSprite2D>("AnimatedSprite2D");
}

private void UpdateFacing()
{
    float direction = Input.GetAxis("move_left", "move_right");
    if (direction != 0)
    {
        _sprite.FlipH = direction < 0;
    }
}
```

`FlipH = true` mirrors the sprite horizontally. We only update facing when there's input — when the player stops, the character keeps facing the last direction. This feels natural; you don't snap to a default facing when you release the key.

### Animation State Logic

The player can be in one of three visual states: idle, running, or airborne. The logic for choosing which animation to play:

```csharp
private void UpdateAnimation()
{
    if (!IsOnFloor())
    {
        _sprite.Play("jump");
    }
    else if (Mathf.Abs(Velocity.X) > 10f)
    {
        _sprite.Play("run");
    }
    else
    {
        _sprite.Play("idle");
    }
}
```

The order matters:

1. **Airborne check first** — if the player is in the air, show the jump sprite regardless of horizontal movement. We use the same sprite for jumping and falling — it works fine and most players won't notice.
2. **Moving on ground** — if horizontal velocity is above a small threshold (10 px/sec avoids flickering during deceleration), show the run animation.
3. **Everything else** — idle.

The threshold of 10 prevents a visual glitch: when the player decelerates, velocity passes through very small values near zero. Without the threshold, the animation rapidly alternates between run and idle for a few frames, causing a visible flicker.

### Integrating with _PhysicsProcess

```csharp
public override void _PhysicsProcess(double delta)
{
    ApplyGravity((float)delta);
    HandleMovement();
    HandleJump();
    MoveAndSlide();
    UpdateFacing();
    UpdateAnimation();
}
```

Animation updates come after `MoveAndSlide()` — the velocity has been resolved by then, so the animation reflects the actual movement state, not the intended one.

---

## 14.4 Coyote Time and Jump Buffering

These two mechanics are invisible when done right and infuriating when absent. They're the difference between "this game feels fair" and "I PRESSED JUMP WHY DIDN'T IT JUMP."

### The Problem

**Coyote time problem:** The player runs off a ledge and presses jump one frame after leaving the ground. `IsOnFloor()` is already false, so the jump doesn't happen. The player falls and blames the game.

**Jump buffer problem:** The player presses jump 3 frames before landing. By the time they touch the ground, `IsActionJustPressed("jump")` has already been consumed. The player has to press jump again after landing. It feels laggy and unresponsive.

Both problems have the same root cause: the game demands frame-perfect timing that humans can't reliably provide.

### Coyote Time

Named after Wile E. Coyote, who runs off cliffs and hangs in the air for a moment before falling. The idea: after the player leaves the ground (without jumping), give them a short grace period where they can still jump.

We already created a `CoyoteTimer` node (0.1 seconds, one-shot). Here's the logic:

```csharp
private Timer _coyoteTimer;
private bool _wasOnFloor = false;

public override void _Ready()
{
    _sprite = GetNode<AnimatedSprite2D>("AnimatedSprite2D");
    _coyoteTimer = GetNode<Timer>("CoyoteTimer");
}

private bool CanJump()
{
    return IsOnFloor() || !_coyoteTimer.IsStopped();
}

private void UpdateCoyoteTimer()
{
    if (_wasOnFloor && !IsOnFloor() && Velocity.Y >= 0)
    {
        // Just left the ground by walking off (not jumping)
        _coyoteTimer.Start();
    }
    _wasOnFloor = IsOnFloor();
}
```

The condition `Velocity.Y >= 0` is important — it prevents coyote time from activating after a jump. We only want it when the player *walks* off an edge (velocity is zero or positive/downward), not when they jump (velocity is negative/upward).

Update `HandleJump` to use `CanJump()`:

```csharp
private void HandleJump()
{
    if (Input.IsActionJustPressed("jump") && CanJump())
    {
        Velocity = new Vector2(Velocity.X, -JumpForce);
        _coyoteTimer.Stop();  // Consume coyote time
    }

    if (Input.IsActionJustReleased("jump") && Velocity.Y < 0)
    {
        Velocity = new Vector2(Velocity.X, Velocity.Y * 0.5f);
    }
}
```

### Jump Buffering

The complement to coyote time. When the player presses jump while airborne and close to the ground, buffer the input and execute the jump automatically on landing.

```csharp
private Timer _jumpBufferTimer;

public override void _Ready()
{
    _sprite = GetNode<AnimatedSprite2D>("AnimatedSprite2D");
    _coyoteTimer = GetNode<Timer>("CoyoteTimer");
    _jumpBufferTimer = GetNode<Timer>("JumpBufferTimer");
}

private void HandleJump()
{
    // Buffer jump presses
    if (Input.IsActionJustPressed("jump"))
    {
        _jumpBufferTimer.Start();
    }

    // Execute jump if we can
    bool wantsJump = !_jumpBufferTimer.IsStopped();
    if (wantsJump && CanJump())
    {
        Velocity = new Vector2(Velocity.X, -JumpForce);
        _jumpBufferTimer.Stop();  // Consume the buffer
        _coyoteTimer.Stop();      // Consume coyote time too
    }

    if (Input.IsActionJustReleased("jump") && Velocity.Y < 0)
    {
        Velocity = new Vector2(Velocity.X, Velocity.Y * 0.5f);
    }
}
```

Now the flow is:

1. Player presses jump → start the buffer timer (0.1 seconds).
2. Every physics frame, check: do we have a buffered jump AND can we jump?
3. If yes → jump and clear both timers.
4. If the buffer timer expires before the player lands → the press is forgotten.

### How It Feels

With both systems active:

- Walking off a cliff → player has 0.1 seconds to still press jump (coyote time).
- Pressing jump slightly too early while falling toward a platform → the jump executes automatically on landing (jump buffer).
- The two can combine: walk off a ledge, press jump during coyote time, land on a lower platform with the buffer still active. Every combination works transparently.

**0.1 seconds** (6 frames at 60fps) is a good default. It's long enough to catch most mistimed inputs but short enough to be imperceptible. Celeste uses about 0.1s for both. Longer values (0.15–0.2s) are more forgiving but can feel imprecise in tight platforming sections.

---

## 14.5 Double Jump and Wall Jump

These mechanics expand the player's movement vocabulary. Not every platformer needs them, but our design document includes wall jump, and double jump is a natural complement.

### Double Jump

The simplest aerial mechanic: the player can jump once more while airborne.

```csharp
[Export] public int MaxAirJumps { get; set; } = 1;
private int _airJumpsRemaining;

private void HandleJump()
{
    if (Input.IsActionJustPressed("jump"))
    {
        _jumpBufferTimer.Start();
    }

    bool wantsJump = !_jumpBufferTimer.IsStopped();

    if (wantsJump && CanJump())
    {
        // Ground jump (or coyote jump)
        Velocity = new Vector2(Velocity.X, -JumpForce);
        _jumpBufferTimer.Stop();
        _coyoteTimer.Stop();
        _airJumpsRemaining = MaxAirJumps;
    }
    else if (wantsJump && _airJumpsRemaining > 0)
    {
        // Air jump
        Velocity = new Vector2(Velocity.X, -JumpForce);
        _jumpBufferTimer.Stop();
        _airJumpsRemaining--;
    }

    if (Input.IsActionJustReleased("jump") && Velocity.Y < 0)
    {
        Velocity = new Vector2(Velocity.X, Velocity.Y * 0.5f);
    }
}
```

Ground jumps reset the air jump counter. Air jumps decrement it. `MaxAirJumps = 1` gives a double jump. Set it to 0 to disable, or 2 for a triple jump.

**Design note:** The air jump should have the same force as the ground jump. Some games reduce air jump force, but this makes double jumps feel unreliable. Consistent force = consistent mental model.

Reset air jumps when landing:

```csharp
private void UpdateCoyoteTimer()
{
    if (_wasOnFloor && !IsOnFloor() && Velocity.Y >= 0)
    {
        _coyoteTimer.Start();
    }

    // Reset air jumps on landing
    if (IsOnFloor())
    {
        _airJumpsRemaining = MaxAirJumps;
    }

    _wasOnFloor = IsOnFloor();
}
```

### Wall Detection

Before implementing wall jump, we need to detect walls. `CharacterBody2D` provides `IsOnWall()`, but we also need to know *which side* the wall is on:

```csharp
private int GetWallDirection()
{
    // Returns -1 for wall on left, 1 for wall on right, 0 for no wall
    if (!IsOnWall()) return 0;
    var normal = GetWallNormal();
    return normal.X > 0 ? -1 : 1;
}
```

`GetWallNormal()` returns the surface normal of the wall the player is touching. If the normal points right (+X), the wall is to the left. If it points left (-X), the wall is to the right.

### Wall Slide

Before wall jumping, let's add wall sliding — the player slides slowly down a wall instead of falling at full speed. It gives visual feedback that wall interaction is happening:

```csharp
[Export] public float WallSlideSpeed { get; set; } = 50f;

private bool IsWallSliding()
{
    return IsOnWall() && !IsOnFloor() && Velocity.Y > 0;
}

private void HandleWallSlide()
{
    if (IsWallSliding())
    {
        Velocity = new Vector2(Velocity.X, Mathf.Min(Velocity.Y, WallSlideSpeed));
    }
}
```

Wall sliding activates when: touching a wall, not on the ground, and moving downward. The slide speed (50 px/sec) is much slower than normal fall speed (up to 400 px/sec), giving the player time to react and wall jump.

### Wall Jump

The player pushes off a wall — launching both upward and away from the wall:

```csharp
[Export] public float WallJumpForce { get; set; } = 300f;
[Export] public float WallJumpHorizontalForce { get; set; } = 200f;

private void HandleJump()
{
    if (Input.IsActionJustPressed("jump"))
    {
        _jumpBufferTimer.Start();
    }

    bool wantsJump = !_jumpBufferTimer.IsStopped();

    if (wantsJump && CanJump())
    {
        // Ground jump
        Velocity = new Vector2(Velocity.X, -JumpForce);
        _jumpBufferTimer.Stop();
        _coyoteTimer.Stop();
        _airJumpsRemaining = MaxAirJumps;
    }
    else if (wantsJump && IsOnWall() && !IsOnFloor())
    {
        // Wall jump — push away from wall and upward
        int wallDir = GetWallDirection();
        Velocity = new Vector2(-wallDir * WallJumpHorizontalForce, -WallJumpForce);
        _jumpBufferTimer.Stop();
        _airJumpsRemaining = MaxAirJumps;  // Wall jump resets air jumps
    }
    else if (wantsJump && _airJumpsRemaining > 0)
    {
        // Air jump
        Velocity = new Vector2(Velocity.X, -JumpForce);
        _jumpBufferTimer.Stop();
        _airJumpsRemaining--;
    }

    if (Input.IsActionJustReleased("jump") && Velocity.Y < 0)
    {
        Velocity = new Vector2(Velocity.X, Velocity.Y * 0.5f);
    }
}
```

The wall jump priority is between ground jump and air jump. This matters — if the player is sliding on a wall and presses jump, they should wall jump, not spend their double jump.

`-wallDir * WallJumpHorizontalForce` pushes the player away from the wall. If the wall is to the left (`wallDir = -1`), the horizontal velocity becomes positive (rightward). Combined with the upward force, the player launches diagonally away from the wall.

**Wall jump resets air jumps.** This lets the player chain: wall jump → double jump → reach the next wall → wall jump again. It creates interesting traversal possibilities in level design.

### Wall Jump Feel

Raw wall jumping often feels slippery — the player launches off the wall but immediately slides back because they're still holding the movement key toward the wall. There are several solutions:

**Approach 1: Reduced air control after wall jump.** Temporarily reduce how much input affects horizontal velocity for ~0.2 seconds after a wall jump. The player can't fight the wall push immediately.

```csharp
private float _wallJumpControlTimer = 0f;
private const float WallJumpControlDelay = 0.15f;

private void HandleMovement()
{
    float direction = Input.GetAxis("move_left", "move_right");

    // Reduce control right after wall jumping
    if (_wallJumpControlTimer > 0)
    {
        _wallJumpControlTimer -= (float)GetPhysicsProcessDeltaTime();
        direction *= 0.3f;  // 30% control
    }

    if (direction != 0)
    {
        float targetSpeed = direction * MoveSpeed;
        Velocity = new Vector2(
            Mathf.MoveToward(Velocity.X, targetSpeed, Acceleration * (float)GetPhysicsProcessDeltaTime()),
            Velocity.Y
        );
    }
    else
    {
        float friction = IsOnFloor() ? Friction : AirFriction;
        Velocity = new Vector2(
            Mathf.MoveToward(Velocity.X, 0, friction * (float)GetPhysicsProcessDeltaTime()),
            Velocity.Y
        );
    }
}
```

Set `_wallJumpControlTimer = WallJumpControlDelay` in the wall jump block of `HandleJump()`. This approach is clean and tunable.

### Animation Updates for Wall Mechanics

Update the animation state to handle wall sliding (we reuse the jump sprite — add a dedicated `wall_slide` animation later if you find a suitable sprite):

```csharp
private void UpdateAnimation()
{
    if (IsWallSliding())
    {
        _sprite.Play("jump");  // reuse jump sprite for wall slide
    }
    else if (!IsOnFloor())
    {
        _sprite.Play("jump");
    }
    else if (Mathf.Abs(Velocity.X) > 10f)
    {
        _sprite.Play("run");
    }
    else
    {
        _sprite.Play("idle");
    }
}
```

For wall sliding, also flip the sprite to face away from the wall:

```csharp
private void UpdateFacing()
{
    if (IsWallSliding())
    {
        // Face away from wall during slide
        int wallDir = GetWallDirection();
        _sprite.FlipH = wallDir > 0;  // wall on right → face left
    }
    else
    {
        float direction = Input.GetAxis("move_left", "move_right");
        if (direction != 0)
        {
            _sprite.FlipH = direction < 0;
        }
    }
}
```

---

## 14.6 Dust Particles and Juice

"Juice" is game designer shorthand for small visual and audio feedback that makes actions feel impactful. A jump without particles feels quiet. A jump with a puff of dust feels powerful. Juice doesn't change gameplay, but it transforms feel.

### GpuParticles2D — Dust Effect

Create a reusable dust particle scene or add particles directly to the player. We'll do it inline for simplicity.

Add a `GpuParticles2D` node as a child of the player:

```
Player (CharacterBody2D)
├── AnimatedSprite2D
├── CollisionShape2D
├── CoyoteTimer (Timer)
├── JumpBufferTimer (Timer)
├── DustParticles (GpuParticles2D)
└── Camera2D
```

Configure the `DustParticles` node:

1. **Emitting:** false (we'll trigger it from code).
2. **Amount:** 6.
3. **One Shot:** true (burst, don't loop).
4. **Lifetime:** 0.3 seconds.
5. Create a new `ParticleProcessMaterial` and configure these sections in the Inspector:

**Spawn → Velocity:**
```
Direction:            (0, -1, 0)    ← particles go upward
Spread:               45°
Initial Velocity Min: 20
Initial Velocity Max: 40
```

**Accelerations → Gravity:**
```
Gravity:              (0, 100, 0)   ← particles arc downward
```

**Display → Scale:**
```
Scale Min:            1.0
Scale Max:            2.0
Scale Curve:          create a CurveTexture that goes from 1.0 → 0.0 (shrink over lifetime)
```

**Display → Color Curves:**
```
Color:                white
Alpha Curve:          create a CurveTexture that fades from 1.0 → 0.0
```

For the particle texture, a simple 2×2 or 4×4 white square works perfectly for pixel art. Create a small white PNG or use `CanvasTexture`.

### Triggering Particles from Code

```csharp
private GpuParticles2D _dustParticles;

public override void _Ready()
{
    // ... existing _Ready code
    _dustParticles = GetNode<GpuParticles2D>("DustParticles");
}

private void EmitDust()
{
    _dustParticles.Restart();
    _dustParticles.Emitting = true;
}
```

Call `EmitDust()` on landing and jumping. Add it to the `HandleJump()` method in the ground jump and wall jump blocks:

```csharp
// In HandleJump(), inside the ground jump block:
EmitDust();

// In HandleJump(), inside the wall jump block:
EmitDust();
```

The full `CheckLanding()` with dust, squash, and screen shake is shown in the next section.

### Squash, Stretch, and Screen Shake

Squash on landing (wider + shorter) and stretch on jumping (taller + thinner) sell the character's weight. A tiny camera shake on hard landings adds impact. All of this is integrated into `CheckLanding()` and `HandleJump()`:

```csharp
private bool _wasInAir = false;

private void CheckLanding()
{
    if (IsOnFloor() && _wasInAir)
    {
        EmitDust();
        _sprite.Scale = new Vector2(1.2f, 0.8f);  // Squash on land

        // Screen shake on hard landings
        if (Velocity.Y > MaxFallSpeed * 0.8f)
        {
            var camera = GetNode<Camera2D>("Camera2D");
            camera.Offset = new Vector2(
                (float)GD.RandRange(-1.0, 1.0),
                (float)GD.RandRange(-1.0, 1.0)
            );
        }
    }

    // Lerp sprite scale back to normal every frame
    _sprite.Scale = _sprite.Scale.Lerp(Vector2.One, 0.2f);

    _wasInAir = !IsOnFloor();
}
```

For the jump stretch, add this line inside `HandleJump()` right after setting the jump velocity:

```csharp
_sprite.Scale = new Vector2(0.8f, 1.2f);  // Stretch on jump
```

The `Lerp` in `CheckLanding()` runs every frame, so both squash and stretch smoothly return to normal scale within a few frames. Add `CheckLanding()` to `_PhysicsProcess` after `MoveAndSlide()`.

### Particle Positioning

The dust particles should emit from the player's feet, not their center. Offset the `DustParticles` node's position:

```
DustParticles:
  Position: (0, 8)   ← adjust Y to match the bottom of your collision shape
```

For wall jump dust, you could add a second particle emitter positioned at the side, or reposition the existing one in code:

```csharp
// Before emitting wall jump dust
_dustParticles.Position = new Vector2(wallDir * 6, 0);  // emit from wall side
EmitDust();
_dustParticles.Position = new Vector2(0, 8);  // reset to feet position
```

### Sound Effects

Juice isn't just visual. Audio feedback reinforces every action. We'll build a proper AudioManager in Chapter 17, but for now, add quick placeholder sounds:

Add an `AudioStreamPlayer2D` child node (or multiple, one per sound):

```csharp
private AudioStreamPlayer2D _jumpSound;

public override void _Ready()
{
    // ... existing code
    _jumpSound = GetNode<AudioStreamPlayer2D>("JumpSound");
}

// When jumping:
_jumpSound.Play();
```

Assign a short jump sound effect (`.wav` format for low latency). Even a simple "boop" transforms the feel.

### The Juice Checklist

Here's what we've added on top of raw movement:

| Juice Element | Trigger | Effect |
| --- | --- | --- |
| Landing squash | Touching ground after airtime | Sprite scales (1.2, 0.8) then lerps back |
| Jump stretch | Leaving the ground with a jump | Sprite scales (0.8, 1.2) then lerps back |
| Dust particles | Jump, land, wall jump | Burst of small particles at feet/wall |
| Screen shake | Hard landing | Tiny camera offset |
| Jump sound | Jump | Audio feedback |
| Variable jump height | Releasing jump early | Arc responds to input duration |
| Coyote time | Walking off edge | Invisible forgiveness window |
| Jump buffer | Pressing jump before landing | Invisible responsiveness boost |

Half of these are invisible. The player will never notice coyote time or jump buffering — they'll just say the game "feels responsive." They won't notice the landing squash — they'll say the character "feels alive." That's juice working as intended.

---

## Summary

**Player scene setup (14.1):** `CharacterBody2D` root with `AnimatedSprite2D`, `CollisionShape2D`, timers for coyote time and jump buffering, and a `Camera2D`. Use a slightly-smaller-than-sprite collision shape for forgiving gameplay.

**Movement (14.2):** Horizontal movement with acceleration and friction (different on ground vs air). Gravity with a fall multiplier for snappy arcs. Variable jump height by cutting velocity on button release. Terminal velocity to cap fall speed. All values exported for Inspector tuning.

**Animations (14.3):** `AnimatedSprite2D` with `SpriteFrames` resource. Three animations: idle, run, jump (jump sprite reused for falling and wall sliding). State selected by priority: airborne → moving → idle. Sprite flipped horizontally based on input direction.

**Coyote time and jump buffering (14.4):** Two `Timer` nodes (0.1s, one-shot). Coyote time: grace period to jump after walking off an edge. Jump buffer: queued jump executes on next landing. Together they make input feel effortlessly responsive.

**Double jump and wall jump (14.5):** Air jump counter reset on landing and wall jump. Wall detection via `GetWallNormal()`. Wall slide at reduced speed. Wall jump launches player away from wall with reduced air control for ~0.15s.

**Juice (14.6):** Dust particles on jump/land/wall jump. Sprite squash on landing, stretch on jumping. Light screen shake on hard landings. Sound effects on actions. These small touches are the difference between "works" and "feels great."

---

**Next up: Chapter 15 — Level Design.** We'll build playable levels with TileMaps, add hazards (spikes, moving platforms), place collectible crystals, create checkpoints, and wire up level transitions with doors.
