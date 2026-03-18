# Chapter 4: Nodes & Scenes

---

## 4.1 What is a Node?

In Chapter 3 we worked with nodes in the editor — adding them, arranging them, inspecting their properties. Now it's time to understand what a node actually *is*, because once you truly get this, everything else in Godot makes sense.

A **node** is the fundamental building block of every Godot game. Every object in your game — a character, a wall, a sound effect, a timer, a health bar — is a node (or a tree of nodes). This is the single most important concept in Godot.

### Nodes Are Small and Focused

Each node type does **one thing** well:

- `Sprite2D` — displays an image.
- `CollisionShape2D` — defines a collision area.
- `AudioStreamPlayer` — plays a sound.
- `Timer` — counts down and emits a signal when it reaches zero.
- `Camera2D` — defines what the player sees on screen.
- `Label` — displays text.

No single node does everything. A player character isn't one monolithic object — it's a composition of several nodes working together: a body for physics, a sprite for visuals, a collision shape for hit detection, an animation player for animations, and so on.

This is Godot's core design philosophy: **composition over inheritance.** Instead of building complex objects from a deep class hierarchy, you compose them from simple, focused nodes.

### Every Node Has a Name, a Type, and a Parent

When you create a node, it gets:

- **A type** — `Sprite2D`, `CharacterBody2D`, `Timer`, etc. The type determines what the node can do.
- **A name** — a string identifier, unique among its siblings. You use names to reference nodes in code.
- **A parent** — every node except the root belongs to exactly one parent. This forms the tree structure.

Nodes also have **properties** (configurable values like position, color, or speed), **methods** (functions you can call), and **signals** (events the node can emit). We'll explore signals in Chapter 6.

### The Node Base Class

Every node in Godot inherits from the `Node` class. This base class provides the fundamental behaviors that all nodes share:

- **Tree membership** — entering and exiting the scene tree.
- **Processing** — the `_Ready()`, `_Process()`, and `_PhysicsProcess()` lifecycle methods.
- **Child management** — adding, removing, and finding child nodes.
- **Groups** — tagging nodes for batch operations (e.g., add all enemies to an "enemies" group).
- **Name and path** — every node has a unique path in the tree, like `/root/Main/Player/Sprite2D`.

From `Node`, several key classes branch out:

```
Node
├── Node2D          — base for all 2D game objects (has position, rotation, scale in 2D space)
├── Node3D          — base for all 3D game objects (has transform in 3D space)
├── Control         — base for all UI elements (has anchors, margins, themes)
├── CanvasLayer     — draws on a separate layer (used for HUDs, parallax)
└── ... many more
```

Understanding this hierarchy helps you predict what properties and methods a node will have. If a node inherits from `Node2D`, you know it has a `Position`, `Rotation`, and `Scale` property. If it inherits from `Control`, you know it participates in the UI layout system.

---

## 4.2 The Node Tree and Parent-Child Relationships

We introduced the node tree in Chapter 3. Now let's go deeper, because the tree isn't just an organizational tool — it's the engine's core architecture.

### The Tree Is the Engine

When your game runs, Godot doesn't have a list of objects — it has a **tree**. Every frame, the engine walks this tree from top to bottom, calling lifecycle methods, applying transforms, rendering visuals, and processing physics. The tree *is* the game.

The root of the tree is always a special node called `/root`, which is a `Window` node that represents your game window. Your main scene is added as a child of `/root`. So if your main scene's root node is called `Main`, the full path is `/root/Main`.

### What the Parent-Child Relationship Gives You

We covered this briefly in Chapter 3, but it's worth going deeper:

**Transform inheritance:** A child's position, rotation, and scale are relative to its parent. If the parent is at position (100, 200) and the child's position is (50, 0), the child appears at (150, 200) in the game world.

This means:

```
# Parent at (100, 200)
#   Child at (50, 0)
# Child's global position = (150, 200)
```

You'll work with two types of position in code:
- `Position` — the **local** position relative to the parent.
- `GlobalPosition` — the **world** position, after all parent transforms are applied.

Most of the time you'll read `GlobalPosition` (to know where something is in the world) and set `Position` (to move it relative to its parent).

**Processing order:** Every frame, the engine processes nodes top-to-bottom. For a tree like this:

```
Main
├── Player
│   ├── Sprite2D
│   └── CollisionShape2D
├── Enemy
│   ├── Sprite2D
│   └── CollisionShape2D
└── UI
    └── ScoreLabel
```

The processing order is: Main → Player → Player/Sprite2D → Player/CollisionShape2D → Enemy → Enemy/Sprite2D → Enemy/CollisionShape2D → UI → ScoreLabel. Parents run before children, siblings run top-to-bottom.

**Lifetime:** When a parent is freed (removed and destroyed), all its children are freed too, recursively. This is Godot's memory management model — you don't need a garbage collector for nodes. Free the root of a subtree, and everything underneath is cleaned up.

**Notifications propagate:** When a parent enters the tree, each child receives a "ready" notification in order. When a parent is paused, its children are affected (based on their process mode). When a parent is hidden, its children are hidden.

### Node Paths

Every node in the tree has a unique **path**, which is a string that describes how to reach it from some starting point. Paths use the `/` separator, just like file paths:

- **Absolute paths** start from the root: `/root/Main/Player/Sprite2D`
- **Relative paths** start from the current node: `Player/Sprite2D` (from Main), or `../Enemy` (go up to parent, then down to Enemy)

You use node paths in code with `GetNode<T>()`:

```csharp
// From the Main node, get the Player node
var player = GetNode<CharacterBody2D>("Player");

// From the Player node, get its Sprite2D child
var sprite = GetNode<Sprite2D>("Sprite2D");

// From the Player node, get the Enemy (sibling — go up, then down)
var enemy = GetNode<CharacterBody2D>("../Enemy");
```

We'll cover `GetNode` in detail in Chapter 5. For now, understand that the tree structure directly determines how you reference nodes in code.

---

## 4.3 Built-in Node Types Overview

Godot ships with over 100 built-in node types. You don't need to memorize them all — you'll learn the ones you need as we use them. But having a mental map of the major categories will help you know what's available.

### 2D Nodes (inherit from Node2D)

These are the nodes you'll use for 2D game development:

**Visuals:**
- `Sprite2D` — displays a texture (image).
- `AnimatedSprite2D` — plays a sequence of frames from a sprite sheet.
- `Polygon2D` — draws a colored polygon.
- `Line2D` — draws a line between points.
- `Parallax2D` — creates parallax scrolling backgrounds.

**Physics bodies:**
- `CharacterBody2D` — a body you move with code. Used for players and NPCs. Handles collision response with `MoveAndSlide()`.
- `RigidBody2D` — a body driven by the physics engine. Affected by gravity, forces, and collisions. Used for objects that should "feel physical" — falling crates, bouncing balls.
- `StaticBody2D` — a body that doesn't move. Used for walls, floors, and platforms.
- `Area2D` — detects when other bodies enter or exit its area. Used for triggers, pickup zones, damage areas.

**Collision:**
- `CollisionShape2D` — defines the shape of a collision area (rectangle, circle, capsule, polygon). Added as a child of a physics body or Area2D.
- `CollisionPolygon2D` — same idea, but you draw the shape point by point.

**Other 2D:**
- `Camera2D` — defines the viewport camera. Can follow a node, have limits, and apply smoothing.
- `TileMapLayer` — tile-based level building.
- `RayCast2D` — casts a ray and reports what it hits. Used for line-of-sight, ground detection.
- `NavigationAgent2D` — pathfinding for AI characters.
- `GPUParticles2D` — particle effects (fire, smoke, sparkles).

### UI Nodes (inherit from Control)

These are for building user interfaces:

- `Label` — displays text.
- `Button` — a clickable button.
- `TextureRect` — displays an image in the UI layer.
- `ProgressBar` — a fill bar (health, loading).
- `LineEdit` — single-line text input.
- `TextEdit` — multi-line text input.
- `HBoxContainer` / `VBoxContainer` — auto-arrange children horizontally or vertically.
- `GridContainer` — arrange children in a grid.
- `Panel` — a styled background rectangle.
- `MarginContainer` — adds margins around its child.
- `ScrollContainer` — scrollable content area.

UI nodes have their own layout system based on **anchors** and **containers**. We'll cover this in Chapter 20.

### Utility Nodes (inherit from Node)

These nodes don't have a visual presence or a position in 2D/3D space, but they provide essential functionality:

- `Timer` — counts down, emits a `Timeout` signal. Extremely useful.
- `AudioStreamPlayer` — plays sound (non-positional — same volume everywhere).
- `AudioStreamPlayer2D` — plays sound with 2D positional audio (volume changes based on distance from the listener).
- `AnimationPlayer` — plays keyframe animations on any property of any node.
- `AnimationTree` — manages transitions between animations using a state machine.
- `HTTPRequest` — makes HTTP requests. Used for leaderboards, APIs.
- `CanvasLayer` — creates a separate rendering layer (HUD elements drawn on top of the game world regardless of camera position).

### How to Discover Nodes

When you press Ctrl+A to add a node, you see the full node list with a search bar. Type what you need — "sprite," "collision," "timer" — and the list filters. Every node has a brief description. You can also press F1 and type a node name to read its full documentation.

Don't try to learn them all now. As we build projects, you'll naturally encounter and learn the nodes relevant to each task. The pattern is always the same: find the node that does what you need, add it to the tree, configure its properties.

---

## 4.4 What is a Scene?

We've been using the word "scene" since Chapter 1. Now let's define it precisely.

A **scene** is a saved tree of nodes. That's it. It's a `.tscn` file that describes a node tree — which nodes exist, their types, their property values, their parent-child relationships, and their attached scripts.

When you save a scene, Godot writes a `.tscn` file that contains all this information. When you open or instance a scene, Godot reads the file and reconstructs the node tree in memory.

### Scenes Are Reusable Templates

Here's what makes scenes powerful: you can **instance** them. An instance is a live copy of a scene that you place inside another scene. The instance references the original `.tscn` file, so if you change the original, all instances are updated.

Think of a scene as a **blueprint** and an instance as a **built copy** of that blueprint. You define the blueprint once, then stamp out copies wherever you need them.

### Scenes Are Self-Contained

A well-designed scene contains everything it needs to function. A `Player` scene contains the player's body, sprite, collision shape, animations, and script. A `Bullet` scene contains the bullet's body, sprite, collision, and movement logic. Each scene is a complete, independent unit.

This self-containment means scenes are:

- **Testable in isolation** — press F6 to run just the player scene and test movement without loading an entire level.
- **Reusable** — instance the same enemy scene in every level.
- **Easy to reason about** — open the player scene and see everything about the player in one place.

### Not Just "Levels"

The word "scene" might make you think of game levels, but in Godot, scenes are used for *everything*:

- A character (Player.tscn)
- An enemy (Slime.tscn)
- A projectile (Bullet.tscn)
- A UI element (HealthBar.tscn)
- A pickup (Coin.tscn)
- A particle effect (Explosion.tscn)
- A level (Level01.tscn)
- A menu (MainMenu.tscn)

Some scenes are small (a single Timer node), and some are large (an entire level with hundreds of instanced sub-scenes). The pattern is the same — it's always a saved node tree.

---

## 4.5 Scene Composition — Scenes Within Scenes

This is where Godot's design really shines. Scenes can contain instances of other scenes, which can contain instances of other scenes, and so on. This is **scene composition**, and it's how you build complex games from simple parts.

### A Concrete Example

Let's say you're building a platformer level. Here's how you might compose it:

```
Level01.tscn
├── TileMapLayer          (the level geometry)
├── Player.tscn           (instanced scene)
│   ├── CharacterBody2D
│   ├── Sprite2D
│   ├── CollisionShape2D
│   └── AnimationPlayer
├── Enemy.tscn            (instanced scene — copy 1)
│   ├── CharacterBody2D
│   ├── Sprite2D
│   ├── CollisionShape2D
│   └── PatrolPath
├── Enemy.tscn            (instanced scene — copy 2)
├── Enemy.tscn            (instanced scene — copy 3)
├── Coin.tscn             (instanced — copy 1)
├── Coin.tscn             (instanced — copy 2)
├── Coin.tscn             (instanced — copy 3)
├── HUD.tscn              (instanced scene)
│   ├── ScoreLabel
│   ├── HealthBar.tscn    (instanced scene within HUD)
│   └── LivesCounter
└── Camera2D
```

The level scene doesn't know or care about the internal structure of the Player, Enemy, Coin, or HUD scenes. It just instances them and places them where they should be. The Player scene doesn't know it's inside a level — it just handles player behavior. Each scene focuses on its own responsibility.

### Overriding Instance Properties

When you instance a scene, you get an exact copy of its properties. But you can **override** specific properties on each instance. Overridden properties appear with a reset icon next to them in the Inspector.

For example, your `Enemy.tscn` might define:
- Speed: 80
- Health: 3
- Color: red

But in your level, you might want a faster blue enemy. So you instance the enemy scene and override:
- Speed: 150 → overridden
- Health: 3 → keep the default
- Color: blue → overridden

If you later change the original enemy's Health from 3 to 5, all instances that didn't override Health will update to 5. But the overridden Speed and Color on your custom instance remain unchanged.

This is how you create variants without duplicating entire scenes.

### Editable Children

By default, you can't modify an instance's internal nodes from the parent scene — they're "locked" to the original scene definition. But sometimes you need to tweak something specific.

Right-click an instance in the Scene tree and select **"Editable Children."** This unlocks the internal nodes, letting you modify properties, add nodes, or even remove nodes on this specific instance. The changes only affect this instance, not the original scene.

Use this sparingly. If you find yourself constantly editing children of an instance, it's a sign that the original scene might need exported properties or needs to be redesigned to be more flexible.

### The Composition Mindset

When planning a game, think in terms of scenes:

> "What are the independent *things* in my game?"

Each one is a scene. Then ask:

> "What is each *thing* made of?"

Each component is either a node or another scene. Build from the bottom up — small scenes first, then combine them into larger scenes.

This is the same principle as component-based design in software engineering. If you've worked with React components, the analogy is direct — a Godot scene is like a React component. It encapsulates its own structure, logic, and presentation, and it's composed into larger structures through nesting.

---

## 4.6 Instancing Scenes at Runtime

So far, we've instanced scenes in the editor — dragging them into the Scene tree, placing them in a level. But games need to create objects dynamically: a player shoots a bullet, an enemy spawns, a coin appears after defeating a boss.

For this, you instance scenes **from code** at runtime.

### The Two-Step Pattern

Instancing a scene in C# always follows two steps:

1. **Load the scene** and create an instance (a copy of the node tree).
2. **Add the instance** to the scene tree as a child of some node.

Here's the code:

```csharp
// Step 1: Load the scene resource and create an instance
var bulletScene = GD.Load<PackedScene>("res://scenes/Bullet.tscn");
var bullet = bulletScene.Instantiate<Node2D>();

// Step 2: Configure and add to the tree
bullet.Position = new Vector2(100, 200);
GetTree().CurrentScene.AddChild(bullet);
```

Let's break this down:

- `GD.Load<PackedScene>("res://scenes/Bullet.tscn")` — loads the scene file from disk and returns a `PackedScene` resource. A `PackedScene` is a compressed version of the scene tree, ready to be instantiated.
- `bulletScene.Instantiate<Node2D>()` — creates a new instance of the scene. The generic type parameter (`Node2D`) tells the compiler what type the root node is, so you get the right type back without casting.
- `bullet.Position = new Vector2(100, 200)` — the instance exists in memory but isn't in the tree yet. You can set properties on it before adding it.
- `GetTree().CurrentScene.AddChild(bullet)` — adds the instance to the tree as a child of the current scene's root. Now it's live — it renders, processes, and participates in physics.

### Preloading for Performance

`GD.Load()` reads from disk every time you call it (Godot caches resources, but the first load still has a cost). If you're instancing something frequently — like bullets in a shooter — you should load the scene once and reuse the `PackedScene`:

```csharp
public partial class Player : CharacterBody2D
{
    // Load once when the script is first used
    private readonly PackedScene _bulletScene = GD.Load<PackedScene>("res://scenes/Bullet.tscn");

    private void Shoot()
    {
        var bullet = _bulletScene.Instantiate<Node2D>();
        bullet.GlobalPosition = GlobalPosition;
        GetTree().CurrentScene.AddChild(bullet);
    }
}
```

By storing the `PackedScene` in a field, the scene file is loaded once and reused every time `Shoot()` is called.

### Where to Add the Instance

The node you add the instance to matters:

```csharp
// Add to the current scene root — most common
GetTree().CurrentScene.AddChild(bullet);

// Add as a child of this node
AddChild(bullet);

// Add to a specific container node
GetNode<Node2D>("BulletContainer").AddChild(bullet);
```

If you add a bullet as a child of the player, the bullet's position becomes relative to the player — it moves when the player moves, which isn't what you want. Adding it to the scene root or a dedicated container keeps it independent.

A common pattern is to create an empty `Node2D` called `BulletContainer` or `EnemyContainer` in your level scene. Add spawned objects there to keep the tree organized.

### Removing Instances

When a spawned object should disappear (a bullet hits a wall, an enemy dies, a particle effect finishes), you remove it from the tree:

```csharp
// Remove from the tree and free memory
QueueFree();
```

`QueueFree()` is the safe way to destroy a node. It waits until the current frame is done processing, then removes the node and all its children from the tree and frees their memory. Never call `Free()` directly unless you know exactly what you're doing — it can cause crashes if the node is still being processed.

### The Full Lifecycle

An instanced node goes through these stages:

1. **Created** — `Instantiate()` is called. The node exists in memory but is not in the tree.
2. **Configured** — you set position, properties, etc.
3. **Added to the tree** — `AddChild()` is called. The node is now live.
4. **`_Ready()` is called** — once, when the node enters the tree for the first time. This is where initialization code goes.
5. **`_Process()` / `_PhysicsProcess()` are called every frame** — the node is active.
6. **`QueueFree()` is called** — the node is removed from the tree and destroyed at the end of the frame.

This lifecycle is the same whether you create the node in the editor or from code. Editor-instanced nodes just go through steps 1-5 automatically when the scene loads.

---

## 4.7 Practical Exercise: Building a Scene Hierarchy

Let's put this all together. In this exercise, you'll build a simple scene hierarchy that demonstrates composition, instancing, and the parent-child relationship. We won't write game logic yet — this is about understanding structure.

### The Goal

Create a small scene hierarchy that looks like this:

```
Main (Node2D)
├── Background (Sprite2D)
├── Player (Node2D)
│   ├── Body (Sprite2D)
│   └── Marker (Sprite2D)
├── Obstacle (StaticBody2D)     — instanced scene
│   ├── Sprite2D
│   └── CollisionShape2D
├── Obstacle (StaticBody2D)     — instanced scene (copy 2)
└── Obstacle (StaticBody2D)     — instanced scene (copy 3)
```

### Step 1: Create the Obstacle Scene

Start with the smallest reusable piece — the obstacle.

1. Create a new scene (**Scene → New Scene** or Ctrl+N).
2. Select **Other Node** as the root type and search for `StaticBody2D`. Click **Create**.
3. Rename the root node to `Obstacle` (press F2).
4. Add a child `Sprite2D` node (Ctrl+A → search "Sprite2D" → Create).
5. In the Inspector, assign a texture to the Sprite2D. You can use Godot's built-in icon: click the Texture property → **Quick Load** → search for `icon.svg` (Godot's default icon). Alternatively, drag any image from the FileSystem panel onto the Texture property.
6. Add a child `CollisionShape2D` node to the `Obstacle` (select the root first, then Ctrl+A → search "CollisionShape2D").
7. In the Inspector, set the CollisionShape2D's **Shape** property to a new `RectangleShape2D`. Adjust the size to roughly match the sprite.
8. Save the scene as `res://scenes/Obstacle.tscn` (create the `scenes` folder if it doesn't exist).

Your Obstacle scene now contains everything it needs — a visual (Sprite2D) and a collision (CollisionShape2D), all parented to a StaticBody2D.

### Step 2: Create the Main Scene

1. Create another new scene (Ctrl+N).
2. Choose **2D Scene** (Node2D root).
3. Rename the root to `Main`.

Now build the hierarchy:

4. Add a `Sprite2D` child and rename it `Background`. Assign a texture (any image, or the default icon scaled up). Set its position to the center of the viewport.
5. Add a `Node2D` child and rename it `Player`. This will be our placeholder player group.
6. Select `Player` and add a `Sprite2D` child. Rename it `Body`. Assign a texture (perhaps the Godot icon with a different modulate color so you can distinguish it).
7. Add another `Sprite2D` child to `Player` and rename it `Marker`. Give it a small texture or the same icon scaled down to 0.3. Position it at (0, -80) — above the body, like a floating marker.

### Step 3: Instance the Obstacle Scene

8. Select the `Main` root node.
9. Press Ctrl+Shift+A (Instance Scene).
10. Navigate to `res://scenes/Obstacle.tscn` and open it.
11. An Obstacle instance appears in the tree with a clapboard icon. Drag it in the viewport to place it somewhere.
12. Repeat twice more — instance two more copies of Obstacle. Place them at different positions.

### Step 4: Observe the Hierarchy

Run the scene (F6). You should see:

- The background image.
- The "player" — a sprite with a marker floating above it.
- Three obstacles — each one identical, placed at different positions.

Now go back to the editor and experiment:

- **Move the Player node** — notice that both the Body and Marker move together, because they're children of Player.
- **Rotate the Player node** — the Body and Marker rotate around the Player's origin.
- **Edit the Obstacle scene** (double-click the Obstacle instance, or open `Obstacle.tscn` in a new tab). Change the Sprite2D's modulate color to red. Save. Go back to the Main scene — all three obstacle instances are now red. That's the power of instancing.
- **Override one instance** — select one of the Obstacle instances in the Main scene. In the Inspector, right-click "Editable Children" and change that specific instance's sprite color. Only that one changes.

### What You've Learned

This exercise demonstrated:

1. **Nodes as building blocks** — each node has a specific purpose (Sprite2D for visuals, CollisionShape2D for collisions, StaticBody2D for a non-moving physics body).
2. **Parent-child transforms** — moving or rotating the Player node affects its children.
3. **Scene composition** — the Obstacle is a self-contained scene, instanced multiple times in the Main scene.
4. **Instance propagation** — changes to the original scene propagate to all instances.
5. **Property overrides** — individual instances can have custom property values.

These patterns scale up directly. In later chapters, your Player scene will have a CharacterBody2D with complex children, your levels will instance dozens of enemy and collectible scenes, and your game will be a composition of compositions. The pattern never changes — just the scale.

---

## Summary

- **Nodes** are the fundamental building blocks in Godot. Each type does one thing well. You compose them to create complex objects.
- The **node tree** is the engine's core data structure. Parent-child relationships determine transforms, processing order, visibility, and lifetime.
- Godot has over **100 built-in node types** across categories: 2D, 3D, UI, and utility. You don't memorize them all — you discover them as needed.
- A **scene** is a saved node tree (`.tscn` file). Scenes are reusable templates — you define them once and instance them wherever needed.
- **Scene composition** is how you build complex games from simple parts. Scenes within scenes, each self-contained and focused.
- You can **instance scenes at runtime** from C# code using `GD.Load<PackedScene>()` and `Instantiate<T>()`. Always add the instance to the tree with `AddChild()`.
- The **composition mindset** — identifying the independent "things" in your game and building each as a scene — is the key to productive Godot development.

**Next up: Chapter 5 — C# in Godot: The Basics.** Now that you understand the node tree, it's time to control it with code. You'll write your first scripts, learn the lifecycle methods, and start making things actually *do* something.
