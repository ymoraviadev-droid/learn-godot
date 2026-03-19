# Chapter 5: C# in Godot — The Basics

---

## 5.1 How C# Integrates with Godot

In Chapter 4 we built a scene hierarchy entirely in the editor — adding nodes, arranging them, instancing scenes. But a game that doesn't run code is just a picture. It's time to bring things to life.

Godot supports two scripting languages: **GDScript** (Godot's own language) and **C#**. In this tutorial we use C#, and in this section we'll understand how it fits into the engine.

### The Big Picture

Godot is written in C++. When you write C# code, it doesn't run inside the engine directly — it runs on the **.NET runtime** (the same runtime used by ASP.NET, Unity, and thousands of enterprise applications). Godot communicates with your C# code through a binding layer that translates between the engine's internal C++ objects and your C# classes.

You don't need to think about this binding layer in your day-to-day work — it's seamless. But it helps to know it exists, because it explains a few things:

- **Your scripts are real C# classes.** You can use any C# feature — generics, LINQ, async/await, records, pattern matching. It's all standard .NET.
- **Your project is a .NET project.** When you created a Godot project with the .NET version, a `.csproj` file was generated. You can add NuGet packages, reference other .NET libraries, and use your favorite C# tools.
- **There's a compilation step.** Unlike GDScript (which is interpreted), C# code must be compiled before it runs. When you press the **Build** button in Godot (or press Alt+B), your code is compiled into a DLL. If there are compilation errors, the game won't run.

### Scripts Are Attached to Nodes

This is the key mental model: **a script extends a node's behavior.** You don't write a "Player class" that creates nodes — you write a script that's attached *to* a node. The node already exists in the scene tree with its built-in properties and behavior. Your script adds custom logic on top.

In React terms, if a node is like an HTML element, a script is like a component's logic — the event handlers, state management, and effects that make the element *do something*. The element (node) exists with its default behavior; your code extends it.

Every C# script in Godot is a class that inherits from a node type:

```csharp
using Godot;

public partial class Player : CharacterBody2D
{
    // Your custom logic here
}
```

Notice three things:

1. **`using Godot;`** — imports the Godot namespace, giving you access to all engine types.
2. **`partial class`** — the `partial` keyword is required. Godot's source generator creates the other half of your class behind the scenes, handling the binding between C# and the engine.
3. **`: CharacterBody2D`** — your class inherits from the node type it will be attached to. A script that inherits from `CharacterBody2D` can only be attached to a `CharacterBody2D` node (or its subtypes).

### One Script Per Node

Each node can have at most **one** script attached to it. You can't attach multiple scripts to the same node. If you need complex behavior, you compose it using child nodes, each with their own script — the same composition-over-inheritance approach from Chapter 4.

For example, instead of cramming everything into a Player script, you might have:

```
Player (CharacterBody2D) — Player.cs (movement, input)
├── HealthComponent (Node) — HealthComponent.cs (health logic)
├── HurtBox (Area2D) — HurtBox.cs (damage detection)
└── Sprite2D (no script — just visuals)
```

Each script is small and focused, handling one responsibility.

---

## 5.2 Your First Script — Attaching C# to a Node

Let's write your first script. We'll start from the Main scene you built in Chapter 4's exercise (or create a fresh one — all you need is a `Node2D` root with a `Sprite2D` child).

### Creating a Script

1. Open your scene and select the `Sprite2D` node (the one you want to script).
2. In the Inspector, click the **Attach Script** button (the scroll icon at the top of the Inspector, or right-click the node → **Attach Script**).
3. A dialog appears with these settings:
   - **Language:** C#
   - **Inherits:** Sprite2D (automatically set to match the node type)
   - **Path:** `res://Sprite2D.cs` (you can change this — it's good practice to organize scripts in a `scripts/` folder, e.g., `res://scripts/Spinner.cs`)
   - **Template:** Node: Default (leave this — it gives you a nice starting template)
4. Click **Create**.

Godot creates a `.cs` file and attaches it to the node. The node now shows a script icon in the Scene tree. Double-click the script icon (or click the file in the FileSystem panel) to open it.

### The Generated Template

The default template looks like this:

```csharp
using Godot;
using System;

public partial class Spinner : Sprite2D
{
    // Called when the node enters the scene tree for the first time.
    public override void _Ready()
    {
    }

    // Called every frame. 'delta' is the elapsed time since the previous frame.
    public override void _Process(double delta)
    {
    }
}
```

This is the skeleton of every Godot script. The two methods — `_Ready()` and `_Process()` — are **lifecycle methods** that the engine calls automatically. We'll explore them in the next section.

### Making It Do Something

Let's make the sprite spin. Replace the `_Process` method:

```csharp
public override void _Process(double delta)
{
    Rotation += 2.0f * (float)delta;
}
```

Build the project (Alt+B or the **Build** button in the top-right), then run the scene (F6). The sprite rotates smoothly.

What's happening:

- `_Process()` is called **every frame** — 60 times per second on a typical display.
- `delta` is the time in seconds since the last frame (approximately 0.016 at 60 FPS). Multiplying by delta makes the rotation speed **frame-rate independent** — it rotates at the same speed whether the game runs at 30 FPS or 144 FPS.
- `Rotation` is a property inherited from `Sprite2D` (via `Node2D`). It's the node's rotation in **radians**. Adding to it every frame creates continuous spinning.
- `2.0f` means it rotates at 2 radians per second (about 115 degrees per second). Increase the number for faster spinning.

### The Build Step

Every time you modify C# code, you need to **build** before the changes take effect. Godot will remind you if you forget — you'll see a banner at the bottom saying the assembly needs to be rebuilt.

Shortcuts for building:

- **Alt+B** in the Godot editor.
- The **Build** button in the top-right toolbar (hammer icon).
- If you're using an external IDE (VS Code, Rider), building there works too — Godot detects the updated DLL.

Build errors appear in Godot's **Output** panel and in your IDE. Fix all errors before running — a failed build means no code runs at all.

---

## 5.3 `_Ready()`, `_Process()`, `_PhysicsProcess()`

These three methods are the heartbeat of every Godot script. Understanding when each one runs — and what each one is for — is essential.

### `_Ready()` — Initialization

```csharp
public override void _Ready()
{
    GD.Print("I'm alive!");
}
```

`_Ready()` is called **once**, when the node enters the scene tree for the first time. At this point:

- The node is in the tree.
- All of its children are in the tree and have already had *their* `_Ready()` called (children are ready before parents).
- You can safely access child nodes, set initial values, and connect signals.

This is your initialization method. Use it for:

- Caching references to other nodes.
- Setting initial state.
- Connecting signals from code.
- Starting timers.

```csharp
private Sprite2D _sprite;
private int _score = 0;

public override void _Ready()
{
    _sprite = GetNode<Sprite2D>("Sprite2D");
    _score = 0;
    GD.Print("Player is ready!");
}
```

**Important:** children are ready before parents. If your tree is:

```
Player
├── Sprite2D
└── CollisionShape2D
```

The order of `_Ready()` calls is: Sprite2D → CollisionShape2D → Player. This guarantees that when `Player._Ready()` runs, its children are fully initialized.

### `_Process(double delta)` — Every Frame

```csharp
public override void _Process(double delta)
{
    // Runs every frame (every ~16ms at 60 FPS)
}
```

`_Process()` is called **every rendered frame**. The `delta` parameter is the time elapsed since the previous frame, in seconds. Use delta to make your logic frame-rate independent.

Use `_Process()` for:

- Visual updates (animations, rotations, color changes).
- Non-physics movement (UI elements, particles, camera effects).
- Checking input state (we'll cover this in Chapter 7).
- Any logic that should run as often as possible.

```csharp
public override void _Process(double delta)
{
    // Move right at 200 pixels per second
    Position += new Vector2(200 * (float)delta, 0);

    // Rotate at 1 radian per second
    Rotation += 1.0f * (float)delta;
}
```

The frame rate is not guaranteed — `delta` will be larger on slow frames and smaller on fast frames. Always multiply movement and time-based values by `delta`.

### `_PhysicsProcess(double delta)` — Fixed Timestep

```csharp
public override void _PhysicsProcess(double delta)
{
    // Runs at a fixed rate (60 times per second by default)
}
```

`_PhysicsProcess()` is called at a **fixed interval** — by default, 60 times per second, regardless of the actual frame rate. This is synchronized with the physics engine.

Use `_PhysicsProcess()` for:

- Physics-related movement (`MoveAndSlide()`, applying velocity).
- Any logic that interacts with the physics engine (raycasts, collision queries).
- Game logic that needs a consistent, predictable timestep.

```csharp
public override void _PhysicsProcess(double delta)
{
    Velocity = new Vector2(200, 0);
    MoveAndSlide();
}
```

### _Process vs _PhysicsProcess — When to Use Which

| Aspect | `_Process` | `_PhysicsProcess` |
|---|---|---|
| **Timing** | Every rendered frame (variable rate) | Fixed interval (default: 60/sec) |
| **Delta** | Variable | Constant (~0.0167) |
| **Use for** | Visuals, UI, animations | Physics, movement, collisions |
| **Example** | Rotating a decoration | Moving a CharacterBody2D |

The rule of thumb: if it involves physics bodies or collision detection, use `_PhysicsProcess()`. For everything else, use `_Process()`. When in doubt, `_PhysicsProcess()` is the safer choice for game logic.

### Other Lifecycle Methods

There are a few more you'll encounter later:

- **`_EnterTree()`** — called when the node enters the tree, before `_Ready()`. Rarely needed.
- **`_ExitTree()`** — called when the node is removed from the tree. Use for cleanup.
- **`_Input(InputEvent @event)`** — called for every input event. Covered in Chapter 7.
- **`_UnhandledInput(InputEvent @event)`** — called for input events not handled by the UI. Covered in Chapter 7.

You don't need to override all of these. Most scripts only use `_Ready()` and one of the process methods.

---

## 5.4 Accessing Node Properties from Code

Every node has properties — Position, Rotation, Scale, Visible, Modulate, and many more. When you attach a script to a node, you can read and write all these properties from code, because your script class *inherits* from the node type.

### Inherited Properties

Since your script class inherits from the node type, all the node's properties are available as C# properties:

```csharp
public partial class Player : CharacterBody2D
{
    public override void _Ready()
    {
        // Properties inherited from Node2D
        Position = new Vector2(100, 200);
        Rotation = 0.5f;                    // radians
        Scale = new Vector2(2, 2);           // double size

        // Properties inherited from CanvasItem (parent of Node2D)
        Visible = true;
        Modulate = new Color(1, 0, 0);       // tint red

        // Properties inherited from Node
        Name = "PlayerOne";
    }
}
```

These are the same properties you see in the Inspector. Changing them from code has exactly the same effect as changing them in the editor — the difference is that code changes happen at runtime.

### Common Properties You'll Use Often

**Node2D properties:**

```csharp
// Position
Position = new Vector2(100, 200);        // local (relative to parent)
GlobalPosition = new Vector2(500, 300);  // world position

// Rotation
Rotation = Mathf.Pi / 4;                // 45 degrees in radians
RotationDegrees = 45;                    // same thing, in degrees

// Scale
Scale = new Vector2(1.5f, 1.5f);        // 150% size
```

**CanvasItem properties (2D visuals):**

```csharp
Visible = false;                         // hide the node (and all children)
Modulate = new Color(1, 1, 1, 0.5f);    // 50% transparent
SelfModulate = Colors.Red;               // tint only this node, not children
ZIndex = 5;                              // draw order (higher = in front)
```

**Sprite2D properties:**

```csharp
var sprite = GetNode<Sprite2D>("Sprite2D");
sprite.FlipH = true;                    // flip horizontally
sprite.FlipV = false;                   // flip vertically
sprite.Texture = GD.Load<Texture2D>("res://assets/player.png");
```

### Modifying Properties Over Time

The real power comes from modifying properties in `_Process()` or `_PhysicsProcess()`. This is how you create movement, animation, and dynamic behavior:

```csharp
public partial class FloatingItem : Sprite2D
{
    private float _time = 0;

    public override void _Process(double delta)
    {
        _time += (float)delta;

        // Bob up and down using a sine wave
        Position = new Vector2(Position.X, Mathf.Sin(_time * 2) * 20);

        // Pulse the opacity
        Modulate = new Color(1, 1, 1, 0.5f + Mathf.Sin(_time * 3) * 0.5f);
    }
}
```

This creates a floating, pulsing item — no animation system needed, just math applied to properties every frame.

### Methods on Nodes

Besides properties, nodes have **methods** — functions you can call to make them do things:

```csharp
// Node methods
QueueFree();                             // destroy this node
GetChildren();                           // get all child nodes
AddChild(someNode);                      // add a child node

// Node2D methods
LookAt(targetPosition);                  // rotate to face a point
GlobalPosition.DistanceTo(other);        // distance to another point

// Sprite2D methods
GetRect();                               // get the bounding rectangle
```

You'll learn specific methods as we use them in projects. The principle is always the same: your script inherits everything the node type offers.

---

## 5.5 `GetNode<T>()` and `[Export]` Attributes

So far, we've only accessed properties on the node the script is attached to. But games require nodes to communicate — a Player script needs to access its child Sprite2D, a HUD needs to read the player's health, a bullet needs to know its direction.

Godot gives you two main tools for this: **`GetNode<T>()`** to find nodes in the tree, and **`[Export]`** to expose values to the editor.

### GetNode<T>() — Finding Nodes by Path

`GetNode<T>()` takes a **node path** (the same paths we discussed in section 4.2) and returns the node at that path, cast to type `T`:

```csharp
public partial class Player : CharacterBody2D
{
    private Sprite2D _sprite;
    private AnimationPlayer _animPlayer;
    private Label _scoreLabel;

    public override void _Ready()
    {
        // Get a direct child by name
        _sprite = GetNode<Sprite2D>("Sprite2D");

        // Get a nested child
        _animPlayer = GetNode<AnimationPlayer>("Sprite2D/AnimationPlayer");

        // Go up to parent, then down to a sibling's child
        _scoreLabel = GetNode<Label>("../HUD/ScoreLabel");
    }
}
```

**Important rules:**

- **Call `GetNode` in `_Ready()` and cache the result.** Don't call `GetNode` every frame in `_Process()` — it's a tree traversal, and doing it 60 times per second is wasteful. Store the reference in a field and reuse it.
- **The path must be correct.** If the node doesn't exist at that path, Godot throws an error and your game crashes. Double-check node names and tree structure.
- **The type must match.** If you write `GetNode<Sprite2D>("Timer")` but the node at that path is a `Timer`, you'll get an invalid cast error.

### GetNodeOrNull<T>() — Safe Lookups

If a node might not exist, use `GetNodeOrNull<T>()`:

```csharp
var optionalNode = GetNodeOrNull<Sprite2D>("MaybeMissing");
if (optionalNode != null)
{
    optionalNode.Visible = false;
}
```

This returns `null` instead of crashing if the node isn't found. Use it when the node is genuinely optional — for required nodes, let `GetNode` crash loudly so you notice the problem immediately.

### [Export] — Exposing Values to the Editor

The `[Export]` attribute is one of the most useful features in Godot. It exposes a C# field or property to the **Inspector**, so you can set its value in the editor without touching code.

```csharp
public partial class Enemy : CharacterBody2D
{
    [Export] public float Speed = 100;
    [Export] public int Health = 3;
    [Export] public Color TintColor = Colors.White;
}
```

After building, these three values appear in the Inspector when you select a node with this script. You can set them per-instance — one enemy can have Speed 100, another 200. It's the same concept as instance property overrides from Chapter 4, but for your custom values.

### Why [Export] Is Powerful

1. **Rapid iteration.** Change values in the editor and see the result immediately, without recompiling.
2. **Designer-friendly.** Level designers can tweak game feel (speed, health, damage) without reading code.
3. **Per-instance customization.** Different instances of the same scene can have different values — fast enemies, slow enemies, tanky enemies — all from the same script.

### Supported Types

`[Export]` works with many types:

```csharp
[Export] public float Speed = 100;           // number slider
[Export] public int Lives = 3;               // integer spinner
[Export] public string PlayerName = "Hero";  // text field
[Export] public bool IsInvincible = false;   // checkbox
[Export] public Color HitColor = Colors.Red; // color picker
[Export] public Vector2 SpawnOffset;          // X/Y fields
[Export] public PackedScene BulletScene;      // drag-and-drop a .tscn file
[Export] public Texture2D Icon;              // drag-and-drop an image
[Export] public NodePath TargetPath;         // select a node in the tree
```

The last three are especially useful:

- **`PackedScene`** — lets you assign a scene file in the editor, then instance it from code. No more hardcoding `"res://scenes/Bullet.tscn"` in your scripts.
- **`Texture2D`** — swap images without code changes.
- **`NodePath`** — create a reference to another node that's configurable in the editor.

### [Export] with PackedScene — A Better Pattern

In Chapter 4 we loaded scenes with `GD.Load<PackedScene>("res://scenes/Bullet.tscn")`. Using `[Export]` is cleaner:

```csharp
public partial class Player : CharacterBody2D
{
    [Export] public PackedScene BulletScene;

    private void Shoot()
    {
        var bullet = BulletScene.Instantiate<Node2D>();
        bullet.GlobalPosition = GlobalPosition;
        GetTree().CurrentScene.AddChild(bullet);
    }
}
```

Now you drag `Bullet.tscn` onto the `BulletScene` field in the Inspector. If you rename or move the scene file, the reference updates automatically. No magic strings in code.

### Export Hints

You can add hints to control how the editor displays exported values:

```csharp
[Export(PropertyHint.Range, "0,500,5")]
public float Speed = 100;  // slider from 0 to 500, step 5

[Export(PropertyHint.Range, "1,10")]
public int Damage = 1;     // slider from 1 to 10

[Export(PropertyHint.MultilineText)]
public string Description = "";  // multi-line text box

[Export(PropertyHint.File, "*.tscn")]
public string ScenePath = "";    // file picker filtered to .tscn files
```

These hints make the Inspector experience better for whoever is editing the values — including future you.

### Enums with [Export]

Exported enums become dropdown menus in the Inspector:

```csharp
public enum EnemyType
{
    Slime,
    Bat,
    Skeleton
}

public partial class Enemy : CharacterBody2D
{
    [Export] public EnemyType Type = EnemyType.Slime;
}
```

This is a great way to create configurable behaviors without multiple scripts.

---

## 5.6 Logging and Debugging

Things will go wrong. Your character will fly off-screen, your bullet won't spawn, your score will be negative. Debugging is a skill, and Godot gives you several tools for it.

### GD.Print() — Your Best Friend

The simplest debugging tool is printing to the Output panel:

```csharp
GD.Print("Hello from Godot!");
GD.Print($"Player position: {GlobalPosition}");
GD.Print($"Health: {_health}, Score: {_score}");
```

`GD.Print()` accepts any number of arguments and converts them to strings. Use string interpolation (`$"..."`) for readable output.

Output appears in the **Output** panel at the bottom of the Godot editor. During gameplay, you can also see the output in the console that opens with the game window.

### GD.PrintErr() and GD.PushWarning()

For different severity levels:

```csharp
GD.Print("Just informational");             // white text
GD.PushWarning("Something seems off...");   // yellow warning
GD.PrintErr("Something went wrong!");       // red error
```

Warnings and errors are easier to spot in the Output panel. Use `GD.PrintErr()` for conditions that indicate a bug, `GD.PushWarning()` for things that *might* be problems, and `GD.Print()` for informational messages.

### Conditional Printing

Don't leave print statements running everywhere — they slow things down and clutter the output. A common pattern:

```csharp
private void Shoot()
{
    var bullet = _bulletScene.Instantiate<Node2D>();
    bullet.GlobalPosition = GlobalPosition;
    GetTree().CurrentScene.AddChild(bullet);

    #if DEBUG
    GD.Print($"Spawned bullet at {GlobalPosition}");
    #endif
}
```

The `#if DEBUG` preprocessor directive includes the print only in debug builds. In a release export, this line doesn't exist.

### The Debugger

Godot has a built-in debugger that's more powerful than print statements:

**The Remote Inspector:** While the game is running, switch to the **Remote** tab in the Scene tree panel. You can see the *live* scene tree, click on any node, and inspect its properties in real-time. This is incredibly useful — you can see exact positions, velocities, and property values as the game runs.

**Breakpoints (in your IDE):** If you're using Rider or VS Code with the C# extension, you can set breakpoints in your code, step through execution line by line, and inspect variables. To enable this:

1. In Godot, go to **Editor → Editor Settings → Mono → Debugger → External Editor**.
2. Set your IDE. Rider and VS Code both support .NET debugging.
3. Set breakpoints in your IDE.
4. Launch the game from Godot — the IDE will catch the breakpoints.

This is the most powerful debugging tool, but print statements are often faster for quick investigations.

### Common Debugging Strategies

**"Is this code running?"** — Add a `GD.Print("HERE")` at the start of the method you suspect isn't being called.

**"What's the value?"** — Print the variable: `GD.Print($"velocity = {Velocity}")`.

**"When does it break?"** — Print inside `_Process()` with a condition:

```csharp
public override void _Process(double delta)
{
    if (GlobalPosition.Y > 1000)
    {
        GD.PrintErr($"Player fell off! Position: {GlobalPosition}");
    }
}
```

**"Is the node there?"** — Check if `GetNode` can find it:

```csharp
public override void _Ready()
{
    var node = GetNodeOrNull<Sprite2D>("Sprite2D");
    GD.Print($"Sprite2D found: {node != null}");
}
```

**"What's in the tree?"** — Print the tree structure:

```csharp
public override void _Ready()
{
    PrintTree();        // prints this node's subtree
    PrintTreePretty();  // same, but formatted nicely
}
```

### Draw Methods for Visual Debugging

Sometimes you need to *see* what's happening — collision areas, raycasts, movement vectors. Godot lets you draw debug visuals:

```csharp
public override void _Draw()
{
    // Draw a red circle at the origin
    DrawCircle(Vector2.Zero, 10, Colors.Red);

    // Draw a line showing velocity direction
    DrawLine(Vector2.Zero, Velocity.Normalized() * 50, Colors.Green, 2);
}
```

Call `QueueRedraw()` whenever the data changes (e.g., in `_Process()`) to trigger a redraw. We won't use this much early on, but it's a powerful technique for debugging physics and movement.

---

## 5.7 C# vs GDScript — Key Differences

Most Godot tutorials and community resources use GDScript. You'll frequently encounter GDScript code that you'll want to translate to C#. Here's a reference for the key differences.

### Syntax Comparison

**Variable declaration:**

```gdscript
# GDScript
var speed = 100.0
var player_name: String = "Hero"
@export var health: int = 5
```

```csharp
// C#
float speed = 100.0f;
string playerName = "Hero";
[Export] public int Health = 5;
```

**Functions / Methods:**

```gdscript
# GDScript
func _ready():
    print("Ready!")

func take_damage(amount: int) -> void:
    health -= amount
```

```csharp
// C#
public override void _Ready()
{
    GD.Print("Ready!");
}

public void TakeDamage(int amount)
{
    Health -= amount;
}
```

**Conditionals:**

```gdscript
# GDScript
if health <= 0:
    die()
elif health < 3:
    flash_warning()
else:
    pass
```

```csharp
// C#
if (Health <= 0)
{
    Die();
}
else if (Health < 3)
{
    FlashWarning();
}
```

**Loops:**

```gdscript
# GDScript
for i in range(10):
    print(i)

for child in get_children():
    child.queue_free()
```

```csharp
// C#
for (int i = 0; i < 10; i++)
{
    GD.Print(i);
}

foreach (Node child in GetChildren())
{
    child.QueueFree();
}
```

### Naming Conventions

This is the most consistent difference you'll encounter:

| Element | GDScript | C# |
|---|---|---|
| Variables / fields | `snake_case` | `camelCase` or `PascalCase` |
| Functions / methods | `snake_case` | `PascalCase` |
| Constants | `UPPER_SNAKE` | `PascalCase` |
| Signals | `snake_case` | `PascalCase` |
| Enums | `PascalCase` | `PascalCase` |
| Node access | `get_node()` | `GetNode()` |
| Lifecycle methods | `_ready()` | `_Ready()` |

When reading GDScript code, mentally convert `snake_case` to `PascalCase` for method names and you'll find the C# equivalent.

### Key API Differences

**Printing:**

```gdscript
# GDScript
print("Hello")
print_rich("[color=red]Error[/color]")
```

```csharp
// C#
GD.Print("Hello");
GD.PrintRich("[color=red]Error[/color]");
```

**Loading resources:**

```gdscript
# GDScript
var scene = preload("res://Bullet.tscn")
var texture = load("res://icon.png")
```

```csharp
// C#
// No preload equivalent — use GD.Load or [Export]
PackedScene scene = GD.Load<PackedScene>("res://Bullet.tscn");
Texture2D texture = GD.Load<Texture2D>("res://icon.png");
```

**Type casting:**

```gdscript
# GDScript
var player = get_node("Player") as CharacterBody2D
```

```csharp
// C#
var player = GetNode<CharacterBody2D>("Player");
// or
var player = GetNode("Player") as CharacterBody2D;
```

**Signals (preview — covered in depth in Chapter 6):**

```gdscript
# GDScript
signal health_changed(new_health)
health_changed.emit(health)
```

```csharp
// C#
[Signal] public delegate void HealthChangedEventHandler(int newHealth);
EmitSignal(SignalName.HealthChanged, Health);
```

### Why C# is Worth the Extra Verbosity

C# is more verbose than GDScript. That's a trade-off. Here's what you get in return:

- **Type safety.** The compiler catches type errors before the game runs. No more runtime "null is not an Object" surprises.
- **IDE support.** Autocompletion, refactoring, go-to-definition, and inline errors in Rider/VS Code are significantly better for C# than for GDScript.
- **Transferable skills.** C# is used in Unity, enterprise software, web backends, and more. GDScript is only used in Godot.
- **.NET ecosystem.** Need JSON parsing? HTTP clients? Data structures? NuGet has battle-tested libraries for everything.
- **Language features.** Generics, LINQ, async/await, pattern matching, records — C# is a rich, modern language.

The verbose signal syntax and the build step are real costs. But once you're past the initial learning curve, C# in Godot is a powerful combination.

### Translating GDScript Examples

When you find a GDScript tutorial or code sample online, here's your mental checklist for translating it:

1. Convert `snake_case` names to `PascalCase`.
2. Add types to variable declarations.
3. Add semicolons and braces.
4. Replace `print()` with `GD.Print()`.
5. Replace `@export` with `[Export]`.
6. Replace `preload()`/`load()` with `GD.Load<T>()`.
7. Replace `$NodeName` with `GetNode<Type>("NodeName")`.
8. Add `public partial class` and the inheritance.
9. Add `using Godot;` at the top.

With practice, this becomes automatic. You'll read GDScript examples and mentally compile them to C# without thinking about it.

---

## Summary

- **C# scripts are real .NET classes** that inherit from a node type. They extend a node's behavior through lifecycle methods and custom logic.
- **Scripts are attached to nodes** — one script per node. The script class must inherit from the node's type (or a parent type).
- **`_Ready()`** runs once when the node enters the tree. Use it for initialization. Children are ready before parents.
- **`_Process(double delta)`** runs every rendered frame. Use it for visuals and non-physics logic. Always multiply by `delta` for frame-rate independence.
- **`_PhysicsProcess(double delta)`** runs at a fixed rate. Use it for physics, movement, and collision-related logic.
- **Node properties** (Position, Rotation, Visible, etc.) are directly accessible from your script because your class inherits them.
- **`GetNode<T>()`** finds nodes in the tree by path. Cache references in `_Ready()` — don't call it every frame.
- **`[Export]`** exposes fields to the Inspector for editor-time configuration. It works with primitives, vectors, colors, packed scenes, textures, and enums.
- **`GD.Print()`** and the Remote Inspector are your primary debugging tools. Use the IDE debugger with breakpoints for complex issues.
- **C# vs GDScript**: C# uses PascalCase, requires explicit types, needs a build step, and has more verbose signal syntax — but offers type safety, better IDE support, and access to the full .NET ecosystem.

**Next up: Chapter 6 — Signals & Communication.** Nodes need to talk to each other — a player takes damage, a coin is collected, a timer expires. Signals are Godot's elegant, decoupled communication system. You'll learn to connect, emit, and design with signals.
