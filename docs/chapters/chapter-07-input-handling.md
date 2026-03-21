# Chapter 7: Input Handling

---

## 7.1 The Input Map — Defining Actions

Your nodes can talk to each other with signals. But they can't listen to the player yet. A game that doesn't respond to keyboard, mouse, or gamepad input isn't much of a game. In this chapter, we'll learn how Godot handles input — and build controls that feel responsive.

### Why Not Just Check Key Codes?

You *could* check for specific keys directly:

```csharp
if (Input.IsKeyPressed(Key.W))
{
    // move up
}
```

This works, but it has problems:

- **Hardcoded keys.** If a player wants to remap "move up" from W to the up arrow, you'd have to find every `Key.W` check in your code and add alternatives.
- **No gamepad support.** A keyboard key and a gamepad stick are completely different input types. Checking for both requires separate code paths.
- **Scattered logic.** Every script that cares about "move up" needs to know which key that is.

Godot solves this with the **Input Map** — a layer of abstraction between physical inputs and game actions.

### What Is the Input Map?

The Input Map is a table that maps **action names** (like `"move_up"`, `"jump"`, `"attack"`) to **physical inputs** (keyboard keys, mouse buttons, gamepad buttons/sticks). Your code only refers to action names — never to specific keys.

```
Action Name        →  Physical Inputs
─────────────────────────────────────────
"move_up"          →  W key, Up arrow, Gamepad left stick up
"move_down"        →  S key, Down arrow, Gamepad left stick down
"jump"             →  Space key, Gamepad A button
"attack"           →  Left mouse button, Gamepad X button
```

In code, you check the *action*, not the key:

```csharp
if (Input.IsActionPressed("move_up"))
{
    // move up — works with W, arrow, AND gamepad
}
```

### Setting Up the Input Map

1. Open **Project → Project Settings → Input Map** tab.
2. At the top, type an action name (e.g., `move_up`) and click **Add**.
3. The action appears in the list. Click the **+** button next to it to add inputs.
4. A dialog appears — press the key, mouse button, or gamepad button you want to bind. Click **OK**.
5. Add as many inputs as you want per action. For example, `move_up` might have both `W` and `Up Arrow`.

Repeat for all your actions. A typical 2D platformer might have:

- `move_left` — A, Left Arrow
- `move_right` — D, Right Arrow
- `move_up` — W, Up Arrow
- `move_down` — S, Down Arrow
- `jump` — Space
- `attack` — Left Mouse Button

### Godot's Built-in Actions

Godot comes with some default actions prefixed with `ui_`:

- `ui_left`, `ui_right`, `ui_up`, `ui_down` — arrow keys, mapped for UI navigation.
- `ui_accept` — Enter/Space.
- `ui_cancel` — Escape.

You *can* use these for gameplay, but it's better to create your own actions. The `ui_` actions are intended for UI navigation, and mixing them with gameplay can cause conflicts later (e.g., pressing Enter to interact also triggers a button in a menu).

### Dead Zones (Gamepad Sticks)

Gamepad analog sticks rarely rest at exactly zero — there's always a tiny amount of drift. The **dead zone** is a threshold below which input is ignored. Godot's default dead zone is `0.5` (50%), which is quite high.

When adding a gamepad stick to an action, you'll see a dead zone slider in the Input Map. A value of `0.2` (20%) is a good starting point — responsive enough to feel snappy, but high enough to filter out stick drift.

---

## 7.2 Polling Input — `Input.IsAction*()`

The most common way to read input is **polling** — checking the state of an action every frame inside `_Process()` or `_PhysicsProcess()`. Godot provides three methods for this:

### `Input.IsActionPressed()` — Is the button held down?

Returns `true` every frame while the action's input is held:

```csharp
public override void _PhysicsProcess(double delta)
{
    if (Input.IsActionPressed("move_right"))
    {
        Position += new Vector2(200 * (float)delta, 0);
    }
}
```

Use this for **continuous actions** — movement, sprinting, holding a shield, charging a shot.

### `Input.IsActionJustPressed()` — Was the button pressed this frame?

Returns `true` only on the frame the input was first pressed:

```csharp
public override void _PhysicsProcess(double delta)
{
    if (Input.IsActionJustPressed("jump"))
    {
        Velocity = new Vector2(Velocity.X, -400);
    }
}
```

Use this for **one-time actions** — jumping, shooting, opening a door, pausing the game. You don't want the player to jump every frame they hold Space — only on the first frame.

### `Input.IsActionJustReleased()` — Was the button released this frame?

Returns `true` only on the frame the input was released:

```csharp
if (Input.IsActionJustReleased("charge_attack"))
{
    // Release the charged attack
    FireChargedShot(_chargeLevel);
    _chargeLevel = 0;
}
```

Use this for **release-triggered actions** — releasing a charged bow, letting go of a throw.

### Movement Example

Here's a typical 2D top-down movement script using `IsActionPressed()` for continuous input:

```csharp
public partial class Player : CharacterBody2D
{
    [Export] public float Speed = 200f;

    public override void _PhysicsProcess(double delta)
    {
        // Continuous: read movement direction
        var direction = Vector2.Zero;

        if (Input.IsActionPressed("move_right")) direction.X += 1;
        if (Input.IsActionPressed("move_left")) direction.X -= 1;
        if (Input.IsActionPressed("move_down")) direction.Y += 1;
        if (Input.IsActionPressed("move_up")) direction.Y -= 1;

        // Normalize so diagonal movement isn't faster
        direction = direction.Normalized();

        Velocity = direction * Speed;
        MoveAndSlide();
    }
}
```

### Why Normalize?

If the player presses Right and Down simultaneously, the direction vector is `(1, 1)`. The length of this vector is approximately `1.41` — meaning diagonal movement would be ~41% faster than horizontal or vertical movement. `Normalized()` scales the vector to a length of `1`, so all directions move at the same speed.

### `Input.GetAxis()` and `Input.GetVector()` — Cleaner Input Reading

Instead of four `if` statements, Godot provides helper methods:

**`Input.GetAxis()`** returns a value from `-1` to `1` for a single axis:

```csharp
float horizontal = Input.GetAxis("move_left", "move_right");
// -1 if left, +1 if right, 0 if neither (or both)
```

**`Input.GetVector()`** returns a normalized `Vector2` for two axes:

```csharp
Vector2 direction = Input.GetVector("move_left", "move_right", "move_up", "move_down");
```

This replaces the entire direction-building block from above — four `if` statements, the zero vector, and the `Normalized()` call — with a single line. The full movement script becomes:

```csharp
public partial class Player : CharacterBody2D
{
    [Export] public float Speed = 200f;

    public override void _PhysicsProcess(double delta)
    {
        Vector2 direction = Input.GetVector("move_left", "move_right", "move_up", "move_down");
        Velocity = direction * Speed;
        MoveAndSlide();
    }
}
```

Three lines. Clean, readable, and it handles normalization automatically. Prefer `GetVector()` for movement.

---

## 7.3 Event-Driven Input — `_Input()` and `_UnhandledInput()`

Polling works well for continuous actions checked every frame. But some input handling is better as **events** — reacting when something happens, rather than checking every frame whether it happened.

Godot provides two event-driven input methods:

### `_Input()` — All Input Events

```csharp
public override void _Input(InputEvent @event)
{
    if (@event.IsActionPressed("pause"))
    {
        GetTree().Paused = !GetTree().Paused;
    }
}
```

`_Input()` is called whenever any input event occurs — key press, key release, mouse move, gamepad button, etc. It receives an `InputEvent` object with details about what happened.

The `@` before `event` is a C# syntax requirement — `event` is a reserved keyword in C#, so we prefix it with `@` to use it as a parameter name.

### `_UnhandledInput()` — Input Not Consumed by UI

```csharp
public override void _UnhandledInput(InputEvent @event)
{
    if (@event.IsActionPressed("interact"))
    {
        TryInteract();
    }
}
```

`_UnhandledInput()` is called only for input that **wasn't already handled** by the UI system. This is the one you'll use most for gameplay input.

### The Input Processing Order

When the player presses a key, Godot processes it in this order:

1. **`_Input()`** — called on all nodes (from root to leaves).
2. **UI Controls** — buttons, text fields, sliders, etc. consume matching input.
3. **`_UnhandledInput()`** — called only if the input wasn't consumed by steps 1-2.

This matters when you have UI elements. If the player clicks a Button in a menu, you don't want that click to *also* fire the player's weapon. Using `_UnhandledInput()` for gameplay input prevents this automatically — the Button consumes the click in step 2, so step 3 never runs.

### When to Use Which

| Method | Use For | Example |
|---|---|---|
| `Input.IsActionPressed()` in `_Process`/`_PhysicsProcess` | Continuous, every-frame checks | Movement, holding to sprint |
| `_Input()` | Input that should work even when UI is focused | Pause, screenshot, debug toggle |
| `_UnhandledInput()` | Gameplay input that UI should block | Attack, interact, jump |

**Rule of thumb:** Use `_UnhandledInput()` for gameplay. Use `_Input()` only when you need input to work regardless of UI state. Use polling in `_PhysicsProcess()` for movement and continuous actions.

### Consuming Input

If you handle an input event and don't want other nodes to also process it, call `GetViewport().SetInputAsHandled()`:

```csharp
public override void _UnhandledInput(InputEvent @event)
{
    if (@event.IsActionPressed("interact"))
    {
        TryInteract();
        GetViewport().SetInputAsHandled();
    }
}
```

This stops the event from propagating further. Without it, multiple nodes might all respond to the same input event.

---

## 7.4 Keyboard, Mouse, and Gamepad Input

The Input Map abstracts most input differences away. But sometimes you need to work with specific input types directly.

### Keyboard Input

Keyboard input is the simplest. Through the Input Map, keys are mapped to actions. But if you need to check a specific key outside the Input Map:

```csharp
public override void _Input(InputEvent @event)
{
    if (@event is InputEventKey keyEvent && keyEvent.Pressed)
    {
        GD.Print($"Key pressed: {keyEvent.Keycode}");
    }
}
```

`InputEventKey` has properties like:
- `Keycode` — the key that was pressed (e.g., `Key.W`, `Key.Space`).
- `Pressed` — `true` on press, `false` on release.
- `Echo` — `true` if this is a key-repeat event (holding a key down).
- `ShiftPressed`, `CtrlPressed`, `AltPressed` — modifier key state.

### Mouse Input

#### Mouse Buttons

```csharp
public override void _UnhandledInput(InputEvent @event)
{
    if (@event is InputEventMouseButton mouseButton && mouseButton.Pressed)
    {
        if (mouseButton.ButtonIndex == MouseButton.Left)
        {
            GD.Print($"Left click at {mouseButton.Position}");
        }
        else if (mouseButton.ButtonIndex == MouseButton.Right)
        {
            GD.Print($"Right click at {mouseButton.Position}");
        }
    }
}
```

#### Mouse Motion

```csharp
public override void _Input(InputEvent @event)
{
    if (@event is InputEventMouseMotion mouseMotion)
    {
        GD.Print($"Mouse moved by {mouseMotion.Relative}");
    }
}
```

`InputEventMouseMotion` gives you:
- `Position` — current mouse position in the viewport.
- `Relative` — how much the mouse moved since the last event (useful for camera rotation).
- `Velocity` — speed of mouse movement.

#### Getting Mouse Position Anytime

You don't need an event to get the mouse position:

```csharp
public override void _Process(double delta)
{
    Vector2 mousePos = GetGlobalMousePosition();
    LookAt(mousePos);  // rotate to face the mouse
}
```

### Gamepad Input

Gamepad buttons are mapped through the Input Map like keyboard keys. But analog sticks provide continuous values between `-1` and `1`, which is why `Input.GetAxis()` and `Input.GetVector()` are especially useful:

```csharp
// Left stick movement (already normalized)
Vector2 direction = Input.GetVector("move_left", "move_right", "move_up", "move_down");

// Right stick for aiming (if mapped)
Vector2 aim = Input.GetVector("aim_left", "aim_right", "aim_up", "aim_down");
```

For direct gamepad access without the Input Map:

```csharp
public override void _Input(InputEvent @event)
{
    if (@event is InputEventJoypadButton joyButton && joyButton.Pressed)
    {
        GD.Print($"Gamepad button: {joyButton.ButtonIndex}");
    }

    if (@event is InputEventJoypadMotion joyMotion)
    {
        GD.Print($"Axis {joyMotion.Axis}: {joyMotion.AxisValue}");
    }
}
```

### Input Type Detection

You might want to change UI prompts based on whether the player is using a keyboard or a gamepad (showing "Press Space" vs "Press A"). You can detect the last input type:

```csharp
public override void _Input(InputEvent @event)
{
    if (@event is InputEventKey or InputEventMouseButton or InputEventMouseMotion)
    {
        _usingGamepad = false;
    }
    else if (@event is InputEventJoypadButton or InputEventJoypadMotion)
    {
        _usingGamepad = true;
    }
}
```

---

## 7.5 Input Actions vs Raw Key Codes

Now that we've seen both approaches — Input Map actions and raw input events — let's clarify when to use each.

### Use Input Map Actions (Almost Always)

```csharp
// Good — uses action names
if (Input.IsActionJustPressed("jump")) { Jump(); }
if (Input.IsActionPressed("move_right")) { MoveRight(); }
```

Benefits:
- **Remappable.** Players can change key bindings (if you build a settings menu) without touching code.
- **Multi-device.** One action works for keyboard, mouse, and gamepad.
- **Centralized.** All key bindings live in one place (Project Settings).
- **Readable.** `"jump"` is clearer than `Key.Space`.

### Use Raw Key Codes (Rare Cases)

```csharp
// Sometimes needed — checks specific keys
if (@event is InputEventKey key && key.Keycode == Key.F12)
{
    ToggleDebugOverlay();
}
```

Use raw codes only when:
- **Debug tools** — F12 for debug overlay, F3 for FPS counter. These aren't gameplay actions.
- **Text input** — a chat system or naming screen that needs to read individual characters.
- **Input remapping UI** — the settings screen that *records* which key the player presses needs the raw input.

For everything else, use the Input Map.

### Action Naming Conventions

Name your actions by **what they do**, not by what key triggers them:

| Bad | Good | Why |
|---|---|---|
| `press_space` | `jump` | Key might be remapped |
| `w_key` | `move_up` | Gamepad has no W key |
| `left_click` | `attack` | Might be on gamepad trigger |
| `escape` | `pause` | Describes the *action*, not the *input* |

Use `snake_case` for action names — this is Godot's convention and matches the `ui_` built-in actions.

---

## 7.6 Practical Example — Complete Player Controller

Let's put everything together into a complete, practical player controller. This is a 2D top-down character that can move, sprint, and interact with objects.

### Setting Up the Input Map

First, define these actions in **Project → Project Settings → Input Map**:

| Action | Keys | Gamepad |
|---|---|---|
| `move_up` | W, Up Arrow | Left Stick Up |
| `move_down` | S, Down Arrow | Left Stick Down |
| `move_left` | A, Left Arrow | Left Stick Left |
| `move_right` | D, Right Arrow | Left Stick Right |
| `sprint` | Shift | Left Trigger |
| `interact` | E | A Button |

### The Scene Tree

```
Player (CharacterBody2D) — Player.cs
├── Sprite2D
├── CollisionShape2D
└── InteractionArea (Area2D)
    └── CollisionShape2D
```

The `InteractionArea` is an Area2D positioned slightly in front of the player, used to detect interactable objects.

### The Script

```csharp
public partial class Player : CharacterBody2D
{
    [Export] public float WalkSpeed = 200f;
    [Export] public float SprintSpeed = 350f;

    private Sprite2D _sprite;
    private Area2D _interactionArea;

    public override void _Ready()
    {
        _sprite = GetNode<Sprite2D>("Sprite2D");
        _interactionArea = GetNode<Area2D>("InteractionArea");
    }

    public override void _PhysicsProcess(double delta)
    {
        HandleMovement();
    }

    public override void _UnhandledInput(InputEvent @event)
    {
        if (@event.IsActionPressed("interact"))
        {
            TryInteract();
            GetViewport().SetInputAsHandled();
        }
    }

    private void HandleMovement()
    {
        Vector2 direction = Input.GetVector("move_left", "move_right", "move_up", "move_down");

        float speed = Input.IsActionPressed("sprint") ? SprintSpeed : WalkSpeed;
        Velocity = direction * speed;

        if (direction != Vector2.Zero)
        {
            _sprite.FlipH = direction.X < 0;
        }

        MoveAndSlide();
    }

    private void TryInteract()
    {
        var bodies = _interactionArea.GetOverlappingBodies();
        foreach (var body in bodies)
        {
            if (body.HasMethod("Interact"))
            {
                body.Call("Interact");
                return;
            }
        }
    }
}
```

Let's break down the design decisions:

**Movement in `_PhysicsProcess()`** — movement involves physics (MoveAndSlide), so it belongs in the fixed-rate physics step.

**Interaction in `_UnhandledInput()`** — interact is a one-time event, not a continuous action. Using `_UnhandledInput()` means it won't fire if the player clicks a UI button.

**`GetVector()` for direction** — one line replaces four `if` checks and handles normalization.

**Sprint with `IsActionPressed()`** — sprint is a held action (continuous while holding Shift).

**`SetInputAsHandled()`** — prevents other nodes from also reacting to the interact press.

**`HasMethod("Interact")`** — a simple way to check if a body is interactable without requiring a specific type. Any node with an `Interact()` method can be interacted with.

### Making an Interactable Object

Here's a simple chest that responds to the player's interaction:

```csharp
public partial class Chest : StaticBody2D
{
    [Signal]
    public delegate void OpenedEventHandler();

    private bool _isOpen = false;

    public void Interact()
    {
        if (_isOpen) return;

        _isOpen = true;
        var sprite = GetNode<Sprite2D>("Sprite2D");
        sprite.Frame = 1;  // switch to open sprite frame
        EmitSignal(SignalName.Opened);
        GD.Print("Chest opened!");
    }
}
```

Notice how signals (Chapter 6) and input (Chapter 7) work together — the player's input triggers an interaction, which emits a signal that other systems can respond to.

---

## Summary

- **The Input Map** maps action names to physical inputs (keys, mouse, gamepad). Define actions in **Project → Project Settings → Input Map**. Your code references actions, never specific keys.
- **Polling** with `Input.IsActionPressed()`, `IsActionJustPressed()`, and `IsActionJustReleased()` is the standard approach for continuous and one-time checks inside `_Process()` or `_PhysicsProcess()`.
- **`Input.GetVector()`** returns a normalized direction from four actions in a single line — use it for movement.
- **`_Input()`** and **`_UnhandledInput()`** are event-driven callbacks. Use `_UnhandledInput()` for gameplay so UI controls block input correctly.
- **Input processing order:** `_Input()` → UI Controls → `_UnhandledInput()`. The UI consumes input between the two, preventing gameplay actions from firing through menus.
- **Keyboard, mouse, and gamepad** all flow through the same system. The Input Map abstracts device differences. Use raw `InputEvent` types only for special cases (debug tools, text input, remapping UI).
- **Name actions by what they do** (`jump`, `attack`, `move_up`), not by what key triggers them (`press_space`). Use `snake_case`.
- **Movement goes in `_PhysicsProcess()`**, one-time actions go in `_UnhandledInput()`, and continuous non-physics checks go in `_Process()`.

**Next up: Chapter 8 — Sprites & Textures.** You can move a character and interact with the world. Now it's time to make things look good — importing art, working with sprite sheets, and animating your game's visuals.
