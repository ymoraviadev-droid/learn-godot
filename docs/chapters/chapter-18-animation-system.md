# Chapter 18: Animation System

---

## 18.1 AnimationPlayer Node

Up to this point, every animation in Crystal Caverns has been frame-by-frame — `AnimatedSprite2D` flipping between idle, run, and jump sprites. That works for character animations, but it only changes which sprite is shown. What if you want a platform to slide sideways, a door to rotate open, a light to fade in, or a UI element to bounce? You need something that can animate *any* property on *any* node.

That's `AnimationPlayer`.

### What AnimationPlayer Does

`AnimationPlayer` is a node that stores named animations. Each animation is a timeline with tracks, and each track targets a property on a node in the scene. When the animation plays, `AnimationPlayer` updates those properties every frame according to the keyframes you've set.

The difference from `AnimatedSprite2D`:

| | AnimatedSprite2D | AnimationPlayer |
| --- | --- | --- |
| **What it animates** | Sprite frames only | Any property on any node |
| **Data source** | `SpriteFrames` resource | `Animation` resource |
| **Typical use** | Character sprite loops | Moving platforms, UI effects, cutscenes, property changes |
| **Scope** | Single node | Entire scene tree (relative to root) |

`AnimatedSprite2D` is specialized — it's great at one thing. `AnimationPlayer` is general-purpose — it can animate position, rotation, scale, color, visibility, audio, method calls, and more. You can even use it to animate sprite frames (it has a dedicated track type for `SpriteFrames`), but for simple character animations, `AnimatedSprite2D` is more convenient.

Think of it this way: `AnimatedSprite2D` is a flipbook. `AnimationPlayer` is a film director — it controls what every actor in the scene does at every moment.

### Creating Your First AnimationPlayer Animation

Let's make a simple example: a platform that moves up and down.

1. Create a scene with a `StaticBody2D` (or `AnimatableBody2D` — more on the difference shortly) and a `CollisionShape2D` with a rectangle shape. Add a `Sprite2D` with a platform texture.

2. Add an `AnimationPlayer` node as a child:

```
MovingPlatform (AnimatableBody2D)
├── Sprite2D
├── CollisionShape2D
└── AnimationPlayer
```

3. Select the `AnimationPlayer` node. The **Animation** panel appears at the bottom of the editor.

4. Click **Animation → New** and name it `move_up_down`.

5. Set the animation length to `2.0` seconds (the field next to the timeline).

6. Enable **looping** — click the loop icon (🔄) next to the length field. This makes the animation repeat endlessly.

### Adding a Keyframe

With the `move_up_down` animation selected:

1. Select the `MovingPlatform` root node in the scene tree.
2. In the Inspector, find the `Position` property.
3. Click the **key icon** (🔑) next to `Position`. Godot asks if you want to create a new track — click **Create**.

This adds a keyframe at time `0.0` with the platform's current position. The Animation panel now shows a track called `.:position` with a diamond (◆) at `t=0`.

The `.:` prefix means "the root of the scene that owns this AnimationPlayer." If the track targeted a child node, it would say `Sprite2D:position` or `CollisionShape2D:visible`.

4. Move the timeline cursor to `1.0` seconds (click on the timeline ruler at the 1-second mark).
5. In the Inspector, change the platform's Y position — move it up by 64 pixels (e.g., from `(0, 0)` to `(0, -64)`).
6. Click the key icon next to `Position` again. A second keyframe appears at `t=1`.

Now the Animation panel shows two diamonds on the `.:position` track — one at `t=0` and one at `t=1`. The platform moves from its original position to 64 pixels higher over 1 second, then snaps back (because the animation loops from the start).

### Ping-Pong: Smooth Round Trips

That snap at the loop point looks bad. There are two ways to fix it:

**Option A — Add a return keyframe:**

Move the cursor to `t=2.0`, set the position back to the original `(0, 0)`, and add a third keyframe. Now the platform goes up (0→1s), comes back down (1→2s), and loops smoothly.

**Option B — Loop mode Ping-Pong:**

Instead of the standard loop, use the **Ping-Pong** loop mode (the icon next to the loop toggle — it shows arrows going both ways, ⇆). This automatically plays the animation forward, then backward, then forward, etc. You only need two keyframes — Godot handles the reverse.

Ping-pong is cleaner for simple back-and-forth motions. Use Option A when the return path should be different from the forward path (e.g., a door opens slowly but slams shut fast).

### AnimatableBody2D vs StaticBody2D

In Chapter 9.5, we mentioned `AnimatableBody2D` for moving platforms. Here's why it matters:

`StaticBody2D` is meant to be stationary. If you animate its position, the physics engine doesn't properly calculate velocity — objects standing on it won't move with it. They'll slide off or jitter.

`AnimatableBody2D` extends `StaticBody2D` and tells the physics engine "I'm going to move, account for it." Objects riding on an `AnimatableBody2D` move with it. Always use `AnimatableBody2D` for platforms animated with `AnimationPlayer`.

### Autoplay

To start the animation when the scene loads, select the `move_up_down` animation in the Animation panel and click the **Autoplay on Load** button (the icon that looks like ▶ with an "A"). A small "A" badge appears on the animation name. Now the platform starts moving as soon as the scene enters the tree — no code needed.

### Playback from Code

You don't always want autoplay. To control `AnimationPlayer` from a script:

```csharp
private AnimationPlayer _anim;

public override void _Ready()
{
    _anim = GetNode<AnimationPlayer>("AnimationPlayer");
    _anim.Play("move_up_down");
}
```

Key methods:

| Method | What it does |
| --- | --- |
| `Play("name")` | Plays animation from the start (or current position if already playing) |
| `PlayBackwards("name")` | Plays in reverse |
| `Stop()` | Stops and resets to the beginning |
| `Pause()` | Stops at the current position (resume with `Play()`) |
| `IsPlaying()` | Returns `true` if an animation is currently playing |
| `Queue("name")` | Queues an animation to play after the current one finishes |
| `CurrentAnimation` | The name of the currently playing animation (empty string if none) |
| `SpeedScale` | Playback speed multiplier (2.0 = double speed, 0.5 = half) |

```csharp
// Examples
_anim.Play("open");                     // Play "open"
_anim.Queue("idle");                    // After "open" finishes, play "idle"
_anim.SpeedScale = 0.5f;               // Half speed
_anim.Play("close");                   // Play "close" at half speed
_anim.PlayBackwards("open");           // Reverse the open animation (same as close)
```

`PlayBackwards` is useful when you have a reversible animation (door open/close, chest open/close) — define it once, play it both ways.

---

## 18.2 Keyframe Animation — Properties, Methods, Signals

Keyframes are the core of `AnimationPlayer`. A keyframe says: "At this point in time, this property should have this value." Godot interpolates between keyframes to produce smooth motion.

### Property Tracks

This is the most common track type — the one we used for position in 18.1. A property track targets a specific property on a specific node path.

You can keyframe *any* property that appears in the Inspector:

- `position` — move nodes
- `rotation` — spin nodes
- `scale` — grow/shrink nodes
- `modulate` — change color/transparency
- `visible` — show/hide nodes
- `volume_db` — fade audio in/out
- Custom `[Export]` properties on your scripts

**Adding tracks manually:** Instead of using the key icon in the Inspector, you can add tracks directly in the Animation panel. Click **Add Track → Property Track**, select the node path, then select the property. This is useful when the property you want isn't easily accessible in the Inspector.

### Interpolation Modes

Right-click a keyframe to change how Godot interpolates between it and the next keyframe:

| Mode | Behavior | Use when |
| --- | --- | --- |
| **Nearest** | Snaps instantly to the next value — no smooth transition | Toggling visibility, switching states |
| **Linear** | Constant-speed change from one value to the next | Mechanical movement, consistent speed |
| **Cubic** | Smooth acceleration and deceleration (ease in/out) | Natural-feeling motion, most animations |

**Cubic** is the default and usually what you want. Objects in the real world don't start and stop instantly — they ease in and out. A platform that eases into its endpoints feels solid; one that moves linearly feels robotic.

**Nearest** is underrated. For boolean-like properties (visibility, collision enabled/disabled), you don't want interpolation — you want an instant snap. If you animate `visible` with linear interpolation, Godot tries to interpolate between `true` and `false`, which doesn't make sense. Use Nearest.

### Method Call Tracks

A method call track fires a method on a node at a specific point in the timeline. No interpolation — it's an event trigger.

**Add Track → Call Method Track**, select the node, then add a keyframe at the desired time. Click the keyframe to configure which method to call and what arguments to pass.

Example: a chest animation that plays an "open" sequence and then spawns a reward at the halfway point:

```
Chest animation "open" (1.0 second):
  Track 1: .:rotation — keyframes at t=0 (0°) and t=0.5 (30°) — lid tilts open
  Track 2: Method on "." — call SpawnReward() at t=0.5
  Track 3: .:modulate — keyframes at t=0.5 (white) and t=1.0 (gold glow)
```

```csharp
// In Chest.cs — called by AnimationPlayer at t=0.5
public void SpawnReward()
{
    var crystal = CrystalScene.Instantiate<Crystal>();
    crystal.Position = GlobalPosition + new Vector2(0, -16);
    GetParent().AddChild(crystal);
}
```

Method call tracks are powerful for sequencing game logic with visual animation — they let you say "when the animation reaches this frame, do this." Without them, you'd need timers or coroutines to sync code with animation timing.

### Signal Tracks (Animation Signals)

Similar to method calls, but instead of calling a method directly, a signal track emits a signal at a specific point in the timeline. This is useful when multiple systems need to react to an animation event.

**Add Track → Animation Signal Track**, then add keyframes where you want signals emitted.

The difference from method call tracks: method calls go to one target node. Signals can be connected to any number of listeners. Use method calls for direct "do this" commands; use signals for "announce that this happened" events.

### Bezier Tracks

For fine-tuned control over animation curves, Godot offers Bezier tracks. Instead of choosing between Linear and Cubic interpolation, you manually drag control handles on each keyframe to shape the curve exactly how you want.

**Add Track → Bezier Track**, select a property. In the Animation panel, switch to the **Bezier Editor** view (the curve icon in the toolbar). Each keyframe gets two handles — drag them to control the ease-in and ease-out curvature.

Bezier tracks are overkill for most game animations. They shine for:
- Camera movements in cutscenes
- UI animations that need a specific feel
- Character motion that needs to match a reference video

For everyday use, Cubic interpolation with the standard easing options covers 90% of cases.

### Audio Tracks

**Add Track → Audio Playback Track**, then assign an `AudioStreamPlayer` (or `AudioStreamPlayer2D`/`3D`) node. Keyframes on this track trigger audio playback at specific timestamps.

This is perfect for syncing sound effects to animation: a footstep sound at the exact frame the foot hits the ground, a sword slash sound when the swing animation reaches full extension, a click sound when a button animation reaches the pressed state.

```
Player "attack" animation:
  Track 1: AnimatedSprite2D:frame — sprite frames
  Track 2: Audio on SFXPlayer — play slash.wav at t=0.15
  Track 3: Method on "." — call DealDamage() at t=0.2
```

### The RESET Animation

Godot has a special convention: an animation named `RESET` (all caps) stores the default state of all animated properties. When you create a `RESET` animation, the editor offers to automatically capture the current values of every property that has tracks in other animations.

**Why this matters:** Without `RESET`, when the scene loads, animated properties start at whatever value they had when you saved the scene. If the last thing you did was move the platform to its end position while testing, it starts there. `RESET` guarantees a clean initial state.

To create one: **Animation → New**, name it `RESET`. The editor prompts "Create RESET animation? This will store the current value of all animated properties." Click yes. Don't set it to autoplay — Godot applies `RESET` automatically when the AnimationPlayer initializes.

Get in the habit of creating a `RESET` animation whenever you add an `AnimationPlayer`. It costs nothing and prevents subtle bugs.

---

## 18.3 Animation Tracks and Blending

### Multiple Animations on One AnimationPlayer

An `AnimationPlayer` can hold as many named animations as you need. A door might have `open`, `close`, and `RESET`. A trap might have `idle`, `activate`, and `deactivate`. A UI panel might have `slide_in`, `slide_out`, and `shake`.

Each animation is independent — different tracks, different durations, different loop settings. You switch between them with `Play("name")`.

### Blending Between Animations

When you call `Play("walk")` while `idle` is playing, the transition is instant — one frame of idle, next frame of walk. For sprite animations this is usually fine. For property animations (camera movement, UI transitions), the snap can be jarring.

`AnimationPlayer` supports crossfading:

```csharp
_anim.Play("walk", 0.2f); // Blend from current animation to "walk" over 0.2 seconds
```

The second parameter is the blend time in seconds. During the blend, both the old and new animations contribute to the final property values, with the new animation gradually taking over.

This is most useful for:
- Camera transitions (smooth cut from one camera motion to another)
- UI state changes (panel slides in while another slides out)
- Environmental animations (day-night lighting crossfade)

For character sprite animations, blending usually looks wrong — you get ghost frames as two animations merge. Stick to instant transitions for sprite-frame-based animations. Blending is for property-based animations.

### Animation Libraries

If your project grows large, managing dozens of animations on a single `AnimationPlayer` gets unwieldy. Godot 4 introduced **Animation Libraries** — you can organize animations into named groups.

In the Animation panel, click the library dropdown (next to the animation name) to create a new library. Animations in a library are referenced as `library_name/animation_name`:

```csharp
_anim.Play("doors/open");     // Play "open" from the "doors" library
_anim.Play("traps/activate"); // Play "activate" from the "traps" library
```

You probably won't need this for Crystal Caverns — it's a feature for larger projects with hundreds of animations. But it's good to know it exists.

---

## 18.4 AnimationTree and State Machines

`AnimationPlayer` plays one animation at a time (with optional blending). For simple objects — moving platforms, doors, traps — that's enough. But for characters with many states (idle, walk, run, jump, fall, attack, hurt, die), managing transitions in code gets messy fast.

In Chapter 14.3, we handled player animation states with an if/else chain:

```csharp
if (!IsOnFloor())
    _sprite.Play("jump");
else if (Mathf.Abs(Velocity.X) > 10f)
    _sprite.Play("run");
else
    _sprite.Play("idle");
```

This worked because we used `AnimatedSprite2D` and had only three states. But imagine adding attack, hurt, die, climb, swim, dash, and wall slide — the if/else chain becomes a nightmare of priority checks and edge cases.

`AnimationTree` solves this by letting you define animation states and transitions visually, as a state machine. The engine handles blending and transition logic; you just set parameters.

### When to Use AnimationTree

Not every animation needs an `AnimationTree`. Here's the decision:

- **Simple objects** (platforms, doors, pickups): use `AnimationPlayer` directly. Two or three animations with code-driven `Play()` calls.
- **Characters with many states**: use `AnimationTree` with a state machine. The visual graph scales better than code.
- **Characters with blended movement** (walking speed affects animation speed, upper/lower body independence): `AnimationTree` with blend trees.

For Crystal Caverns, the player has 3-4 states and `AnimatedSprite2D` handles it fine. But as a learning exercise — and because you'll absolutely need this in future projects — let's build an `AnimationTree` state machine.

### Setup

`AnimationTree` needs an `AnimationPlayer` as its data source. The player holds the actual animations; the tree controls which one plays and how they transition.

```
Character (CharacterBody2D)
├── Sprite2D
├── CollisionShape2D
├── AnimationPlayer      — holds all animations
└── AnimationTree         — controls which animation plays
```

1. Create several animations on the `AnimationPlayer`: `idle`, `run`, `jump`, `fall`, `RESET`. For this example, make them property animations on the `Sprite2D` (position offset, scale, rotation) so you can see blending in action.

2. Select the `AnimationTree` node. In the Inspector:
   - **Anim Player:** assign the `AnimationPlayer` node path
   - **Tree Root:** click and choose **New AnimationNodeStateMachine**
   - **Active:** check this box (the tree does nothing if inactive)

### Building the State Machine

Double-click the `AnimationTree` node (or click the "Open Editor" button). The **AnimationTree** editor appears at the bottom, showing an empty graph.

Right-click to add states:
- **Add Animation → idle** — plays the `idle` animation
- **Add Animation → run** — plays `run`
- **Add Animation → jump** — plays `jump`
- **Add Animation → fall** — plays `fall`

Each state appears as a rounded rectangle in the graph. Drag them to arrange visually.

### Transitions

Connect states by clicking one, then drawing a line to another. A transition arrow appears. Click the arrow to configure:

- **Switch Mode:**
  - `Immediate` — switch as soon as the condition is met (good for responsive controls)
  - `Sync` — wait until the current animation finishes, then switch
  - `AtEnd` — switch exactly when the current animation reaches its end
- **Advance Condition:** a string name that you set from code to trigger the transition

For a character state machine, most transitions should be `Immediate` — when the player jumps, the animation should respond instantly, not wait for the walk cycle to finish.

### Setting Conditions from Code

Each transition can have an **Advance Condition** — a string that maps to a parameter you set from code:

```csharp
private AnimationTree _animTree;

public override void _Ready()
{
    _animTree = GetNode<AnimationTree>("AnimationTree");
}

public override void _PhysicsProcess(double delta)
{
    // Set parameters based on character state
    _animTree.Set("parameters/conditions/is_running",
        Mathf.Abs(Velocity.X) > 10f);
    _animTree.Set("parameters/conditions/is_jumping",
        !IsOnFloor() && Velocity.Y < 0);
    _animTree.Set("parameters/conditions/is_falling",
        !IsOnFloor() && Velocity.Y >= 0);
    _animTree.Set("parameters/conditions/is_idle",
        IsOnFloor() && Mathf.Abs(Velocity.X) <= 10f);
}
```

The transition from `idle` to `run` uses the advance condition `is_running`. The transition from `run` back to `idle` uses `is_idle`. And so on.

**The parameter path** follows the pattern `parameters/conditions/<condition_name>`. The condition name matches what you typed in the transition's Advance Condition field.

### Travel

Instead of setting conditions, you can tell the state machine to navigate to a specific state:

```csharp
var stateMachine = (AnimationNodeStateMachinePlayback)
    _animTree.Get("parameters/playback");
stateMachine.Travel("jump");
```

`Travel` finds a path from the current state to the target state through valid transitions. If there's no path, it teleports directly (no transition blending). This is simpler than conditions for states triggered by discrete events — like getting hurt or dying.

```csharp
public void TakeHit()
{
    var playback = (AnimationNodeStateMachinePlayback)
        _animTree.Get("parameters/playback");
    playback.Travel("hurt");
}
```

### Blend Trees (Brief Overview)

Inside an `AnimationTree`, instead of a state machine, you can use a **Blend Tree** — a graph that mixes multiple animations based on a continuous parameter.

The classic example: a character's movement speed controls a blend between walk and run animations. At speed 0, the idle animation plays. At speed 50, a 50/50 blend of walk and run. At speed 100, full run. The engine interpolates between the two smoothly.

You set this up with a **BlendSpace1D** (1 parameter, like speed) or **BlendSpace2D** (2 parameters, like X/Y direction for 8-directional movement):

```csharp
_animTree.Set("parameters/blend_position", normalizedSpeed);
```

Blend trees are more common in 3D (skeletal animations blend naturally) than in 2D (sprite frames don't blend well). In 2D, you'd typically use a blend tree only if your animations are property-based (bone-driven 2D rigs like those from Spine, DragonBones, or Godot's own `Skeleton2D`).

For sprite-frame characters in 2D, stick with the state machine approach — it gives you clean, discrete transitions between animation states.

---

## 18.5 Tweens — Procedural Animations with CreateTween()

We used `CreateTween()` in Chapter 17.6 for screen transitions — fading a `ColorRect` to black and back. That was a quick taste. Tweens are Godot's system for code-driven, one-shot animations, and they're one of the most useful tools in the engine.

### AnimationPlayer vs Tweens

| | AnimationPlayer | Tween |
| --- | --- | --- |
| **Defined in** | The editor (visual timeline) | Code |
| **Stored as** | A resource on a node | Nothing — created at runtime, garbage collected when done |
| **Best for** | Complex, multi-track, reusable animations | Quick, one-off effects driven by game logic |
| **Looping** | Built-in | Possible but awkward |
| **Editing** | Visual keyframe editor | Code only |

Use `AnimationPlayer` when the animation is designed in advance and reused: moving platforms, door sequences, UI panels. Use tweens when the animation depends on runtime values: enemy knockback distance, damage flash intensity, score popup flying to a dynamic position.

The rule of thumb: **if you'd set it up in the editor, use AnimationPlayer. If you'd compute it in code, use a tween.**

### Creating a Tween

```csharp
var tween = CreateTween();
tween.TweenProperty(this, "position", new Vector2(100, 0), 0.5f);
```

This moves the node to `(100, 0)` over 0.5 seconds. That's it — one line to define, one line to create. The tween starts immediately and cleans itself up when finished.

`CreateTween()` is a method on every `Node`. The tween is bound to that node — if the node is freed, the tween stops. If the node is paused, the tween pauses (unless configured otherwise).

### TweenProperty

The workhorse method:

```csharp
tween.TweenProperty(object, property, finalValue, duration);
```

- **object:** the node to animate (usually `this`, but can be any node)
- **property:** the property path as a string (`"position"`, `"modulate"`, `"scale"`, `"rotation"`)
- **finalValue:** the target value at the end of the tween
- **duration:** time in seconds

```csharp
// Move to position (200, 100) over 1 second
tween.TweenProperty(this, "position", new Vector2(200, 100), 1.0f);

// Fade to transparent over 0.3 seconds
tween.TweenProperty(sprite, "modulate:a", 0.0f, 0.3f);

// Scale up to double size over 0.5 seconds
tween.TweenProperty(this, "scale", new Vector2(2, 2), 0.5f);

// Rotate 360 degrees over 2 seconds
tween.TweenProperty(this, "rotation", Mathf.Tau, 2.0f);
```

**Sub-property access:** Notice `"modulate:a"` — you can target individual components with the colon syntax. `"position:x"` for just the X coordinate, `"modulate:r"` for the red channel, etc.

### Relative Values with AsRelative()

By default, `TweenProperty` animates to an absolute final value. If you want to animate *by* an amount (relative to the current value), chain `.AsRelative()`:

```csharp
// Move 50 pixels to the right from current position
tween.TweenProperty(this, "position:x", 50.0f, 0.3f).AsRelative();

// Scale up by 0.5 from current scale
tween.TweenProperty(this, "scale", new Vector2(0.5f, 0.5f), 0.2f).AsRelative();
```

### Starting From a Specific Value with From()

Normally the tween starts from the property's current value. `.From(value)` overrides the starting value:

```csharp
// Flash: instantly set alpha to 0, then tween back to 1
tween.TweenProperty(sprite, "modulate:a", 1.0f, 0.3f).From(0.0f);
```

This is useful for "appear" animations — you want the object to start invisible and fade in, regardless of its current state.

### TweenCallback

Runs a method at a specific point in the tween sequence:

```csharp
var tween = CreateTween();
tween.TweenProperty(this, "position:y", -32.0f, 0.3f).AsRelative();
tween.TweenCallback(Callable.From(EmitCollectEffect));
tween.TweenProperty(this, "modulate:a", 0.0f, 0.2f);
tween.TweenCallback(Callable.From(QueueFree));
```

This sequence: float up → emit particles → fade out → destroy. The callbacks fire between the property tweens.

### TweenInterval

Inserts a pause in the sequence:

```csharp
var tween = CreateTween();
tween.TweenProperty(this, "modulate", Colors.Red, 0.1f);
tween.TweenInterval(0.2f);  // Wait 0.2 seconds
tween.TweenProperty(this, "modulate", Colors.White, 0.1f);
```

The node turns red, holds for 0.2 seconds, then returns to white. A simple damage flash.

### TweenMethod

Calls a method every frame with an interpolated value — useful when you need to animate something that isn't a simple property:

```csharp
var tween = CreateTween();
tween.TweenMethod(
    Callable.From<float>(SetHealthBarWidth),
    currentWidth,   // from
    targetWidth,    // to
    0.3f            // duration
);

private void SetHealthBarWidth(float width)
{
    _healthBar.Size = new Vector2(width, _healthBar.Size.Y);
}
```

This smoothly resizes a health bar by calling `SetHealthBarWidth` every frame with values interpolated between `currentWidth` and `targetWidth`.

---

## 18.6 Easing Functions and Chaining

### Sequential vs Parallel

By default, tween steps run **sequentially** — each one waits for the previous to finish:

```csharp
var tween = CreateTween();
tween.TweenProperty(this, "position:x", 100.0f, 0.5f);  // First: move right
tween.TweenProperty(this, "position:y", -50.0f, 0.3f);   // Then: move up
tween.TweenProperty(this, "modulate:a", 0.0f, 0.2f);     // Then: fade out
```

Total time: 0.5 + 0.3 + 0.2 = 1.0 second.

To run steps **in parallel** (at the same time), call `SetParallel()`:

```csharp
var tween = CreateTween();
tween.SetParallel(true);
tween.TweenProperty(this, "position:x", 100.0f, 0.5f);   // Move right
tween.TweenProperty(this, "position:y", -50.0f, 0.5f);    // AND move up
tween.TweenProperty(this, "modulate:a", 0.0f, 0.5f);      // AND fade out
```

Total time: 0.5 seconds (all three run simultaneously).

You can also switch between parallel and sequential mid-tween by using `SetParallel()` on individual steps:

```csharp
var tween = CreateTween();

// These two run in parallel
tween.TweenProperty(this, "position", target, 0.5f);
tween.Parallel().TweenProperty(this, "modulate:a", 0.0f, 0.5f);

// This runs after both finish
tween.TweenCallback(Callable.From(QueueFree));
```

The `.Parallel()` call on the second tweener tells it to run alongside the previous one. The callback runs after both parallel steps complete.

### Easing Functions

Easing controls the *feel* of an animation. Linear interpolation moves at constant speed — mechanical, robotic. Easing adds acceleration and deceleration curves that make motion feel natural.

Every `TweenProperty` can be configured with a **transition type** and an **ease type**:

```csharp
tween.TweenProperty(this, "position", target, 0.5f)
    .SetTrans(Tween.TransitionType.Quad)
    .SetEase(Tween.EaseType.Out);
```

**Transition types** control the curve shape:

| Transition | Curve | Feel |
| --- | --- | --- |
| `Linear` | Straight line | Mechanical, constant speed |
| `Sine` | Gentle sine curve | Subtle, natural |
| `Quad` | Quadratic (x²) | Smooth, general-purpose |
| `Cubic` | Cubic (x³) | Pronounced acceleration |
| `Quart` | Quartic (x⁴) | Dramatic acceleration |
| `Quint` | Quintic (x⁵) | Very dramatic |
| `Expo` | Exponential | Sharp acceleration |
| `Circ` | Circular | Starts slow, ends fast (or vice versa) |
| `Back` | Overshoots then returns | Bouncy, playful |
| `Elastic` | Spring-like oscillation | Wobbly, cartoony |
| `Bounce` | Bounces at the endpoint | Ball-dropping effect |
| `Spring` | Damped spring | Physical spring simulation |

**Ease types** control *where* the curve accelerates:

| Ease | Behavior |
| --- | --- |
| `In` | Starts slow, ends fast |
| `Out` | Starts fast, ends slow |
| `InOut` | Slow at both ends, fast in the middle |
| `OutIn` | Fast at both ends, slow in the middle |

The combination matters. `Quad` + `Out` is smooth deceleration — great for UI elements sliding into place. `Back` + `Out` overshoots the target then settles — great for popups. `Bounce` + `Out` bounces at the destination — great for items dropping onto the ground.

### Common Easing Recipes

**UI slide-in:**

```csharp
tween.TweenProperty(panel, "position:x", 0.0f, 0.3f)
    .From(-300.0f)
    .SetTrans(Tween.TransitionType.Quad)
    .SetEase(Tween.EaseType.Out);
```

Starts off-screen left, slides to position, decelerates to a stop.

**Score popup:**

```csharp
var tween = CreateTween();
tween.TweenProperty(label, "position:y", -40.0f, 0.6f)
    .AsRelative()
    .SetTrans(Tween.TransitionType.Quad)
    .SetEase(Tween.EaseType.Out);
tween.Parallel().TweenProperty(label, "modulate:a", 0.0f, 0.6f)
    .SetTrans(Tween.TransitionType.Quad)
    .SetEase(Tween.EaseType.In);
tween.TweenCallback(Callable.From(label.QueueFree));
```

Floats up while fading out. The position eases out (fast start, slow end) while the opacity eases in (slow start, fast end) — the label rises quickly then drifts, becoming transparent as it slows.

**Damage flash:**

```csharp
var tween = CreateTween();
tween.TweenProperty(sprite, "modulate", new Color(1, 0.3f, 0.3f), 0.05f);
tween.TweenProperty(sprite, "modulate", Colors.White, 0.15f);
```

Instantly goes red (0.05s is near-instant), then fades back to normal. Linear is fine here — the speed makes easing invisible.

**Bounce landing:**

```csharp
var tween = CreateTween();
tween.TweenProperty(sprite, "scale", new Vector2(1.2f, 0.8f), 0.05f); // Squash
tween.TweenProperty(sprite, "scale", new Vector2(0.9f, 1.1f), 0.08f); // Stretch
tween.TweenProperty(sprite, "scale", Vector2.One, 0.1f)               // Settle
    .SetTrans(Tween.TransitionType.Elastic)
    .SetEase(Tween.EaseType.Out);
```

Classic squash-and-stretch: the character compresses on landing, bounces up slightly, then settles back to normal with a spring-like ease.

**Item collected (float up and vanish):**

```csharp
public void Collect()
{
    // Disable collision immediately
    GetNode<CollisionShape2D>("CollisionShape2D").SetDeferred("disabled", true);

    var tween = CreateTween();
    tween.SetParallel(true);
    tween.TweenProperty(this, "position:y", -20.0f, 0.4f)
        .AsRelative()
        .SetTrans(Tween.TransitionType.Quad)
        .SetEase(Tween.EaseType.Out);
    tween.TweenProperty(this, "modulate:a", 0.0f, 0.4f)
        .SetTrans(Tween.TransitionType.Quad)
        .SetEase(Tween.EaseType.In);

    tween.Chain().TweenCallback(Callable.From(QueueFree));
}
```

Note `tween.Chain()` — after `SetParallel(true)`, calling `.Chain()` switches back to sequential mode for the next step. The `QueueFree` callback runs after both parallel tweens finish.

### Killing and Replacing Tweens

A common bug: starting a new tween on a property that already has an active tween. Both tweens fight over the same property, causing jittering.

`CreateTween()` does **not** automatically kill previous tweens. You need to manage this yourself:

```csharp
private Tween _moveTween;

public void MoveTo(Vector2 target)
{
    // Kill the old tween if it's still running
    _moveTween?.Kill();

    _moveTween = CreateTween();
    _moveTween.TweenProperty(this, "position", target, 0.3f)
        .SetTrans(Tween.TransitionType.Quad)
        .SetEase(Tween.EaseType.Out);
}
```

Store a reference to the tween and call `Kill()` before creating a new one. This is especially important for tweens triggered by player input — mashing a button could stack dozens of tweens on the same property.

### Tween Process Mode

By default, tweens follow `_Process` timing — they pause when the tree is paused. For UI animations that should work during pause (like the pause menu itself), set the tween's process mode:

```csharp
var tween = CreateTween();
tween.SetProcessMode(Tween.TweenProcessMode.Physics);  // Follows _PhysicsProcess
// or
tween.SetProcessMode(Tween.TweenProcessMode.Idle);     // Follows _Process (default)
```

If the tween is on a node with `ProcessMode = Always`, the tween also runs during pause — the tween inherits its owner's process mode.

### Loops

Tweens can loop:

```csharp
var tween = CreateTween();
tween.SetLoops(3);  // Repeat the entire sequence 3 times
tween.TweenProperty(this, "rotation", Mathf.Tau, 1.0f);
```

`SetLoops(0)` loops infinitely. But infinite looping tweens are tricky — if you lose the reference, you can't kill them, and they run until the node is freed. For permanent looping animations, `AnimationPlayer` is usually a better choice.

### Signals

Tweens emit signals you can await:

```csharp
var tween = CreateTween();
tween.TweenProperty(this, "position", target, 0.5f);
await ToSignal(tween, Tween.SignalName.Finished);
GD.Print("Tween completed!");
```

We used this pattern in the `TransitionManager` (Chapter 17.6) — awaiting the fade-out tween before changing scenes.

Each individual tweener also emits `Finished`, so you can await specific steps:

```csharp
var tween = CreateTween();
var step1 = tween.TweenProperty(this, "position", midpoint, 0.3f);
var step2 = tween.TweenProperty(this, "position", target, 0.3f);

await ToSignal(step1, Tween.SignalName.Finished);
GD.Print("Reached midpoint");
// Step 2 is already running at this point
```

---

## Summary

**AnimationPlayer (18.1):** A node that stores named animations, each containing tracks that animate properties on other nodes in the scene. Keyframes define values at specific timestamps; Godot interpolates between them. Use `AnimatableBody2D` (not `StaticBody2D`) for physics bodies animated with AnimationPlayer. Autoplay starts an animation when the scene loads. Playback controlled via `Play()`, `Stop()`, `Queue()`, `PlayBackwards()`.

**Keyframe animation (18.2):** Property tracks animate any Inspector-visible property. Method call tracks fire functions at specific timestamps. Audio tracks sync sound with animation. Bezier tracks give fine-tuned curve control. Interpolation modes: Nearest (instant snap), Linear (constant speed), Cubic (smooth ease). The `RESET` animation stores default property values — always create one.

**Tracks and blending (18.3):** One `AnimationPlayer` holds many named animations. `Play("name", blendTime)` crossfades between animations over the specified duration. Blending works well for property animations but poorly for sprite-frame animations. Animation Libraries organize large animation collections.

**AnimationTree (18.4):** A visual state machine for managing complex animation logic. States represent animations; transitions connect them with conditions set from code via `_animTree.Set()`. `Travel()` navigates to a target state through valid transitions. BlendSpace1D/2D blend animations based on continuous parameters (speed, direction). State machines are better than code for characters with many states; for simple cases, direct `AnimatedSprite2D` is fine.

**Tweens (18.5):** Code-driven, one-shot animations created with `CreateTween()`. `TweenProperty` animates any property to a target value over a duration. `AsRelative()` makes the target relative to the current value. `From()` overrides the starting value. `TweenCallback` fires a method between steps. `TweenInterval` inserts a pause. `TweenMethod` calls a function every frame with an interpolated value. Tweens self-destruct when finished.

**Easing and chaining (18.6):** Transition types (Linear, Quad, Cubic, Back, Elastic, Bounce, etc.) control curve shape. Ease types (In, Out, InOut) control where acceleration occurs. Steps run sequentially by default; `SetParallel(true)` or `.Parallel()` runs them simultaneously; `.Chain()` switches back to sequential. Always `Kill()` existing tweens before starting new ones on the same property to prevent conflicts. Tweens emit `Finished` for async/await patterns.
