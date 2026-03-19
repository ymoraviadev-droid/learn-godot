# Chapter 6: Signals & Communication

---

## 6.1 What Are Signals?

In Chapter 5 we wrote scripts that control individual nodes — spinning a sprite, moving a character, printing debug info. But a game is not a collection of isolated nodes doing their own thing. Nodes need to talk to each other: a player touches a coin, a timer expires, a health bar needs updating, an enemy dies and the score goes up.

You could wire everything together with direct references — the coin calls `player.AddScore(10)`, the enemy calls `hud.UpdateScore()`. But this creates a tangled web of dependencies. The coin needs to know about the player. The enemy needs to know about the HUD. Every node knows about every other node, and changing one thing breaks five others.

Signals solve this problem.

### The Core Idea

A **signal** is a message that a node broadcasts without knowing (or caring) who's listening. The node just says: *"something happened."* Any other node can **connect** to that signal and respond to it.

The coin doesn't call `player.AddScore()`. Instead, the coin **emits** a signal called `Collected`. The player (or a score manager, or a sound system) **connects** to that signal and runs its own code in response. The coin doesn't know who's listening. It doesn't need to.

This is the **Observer pattern** — and if you've worked with frontend development, you already know it. Signals are Godot's version of DOM events. `button.Pressed` is like `button.addEventListener("click", handler)`. A node emits an event; listeners respond.

### Built-in Signals

Every node type in Godot comes with built-in signals. Here are some you'll use constantly:

**Button:**
- `Pressed` — the button was clicked.

**Timer:**
- `Timeout` — the timer finished counting down.

**Area2D:**
- `BodyEntered` — a physics body entered this area.
- `BodyExited` — a physics body left this area.
- `AreaEntered` — another Area2D overlapped with this one.

**AnimationPlayer:**
- `AnimationFinished` — an animation completed.

**CharacterBody2D (via collision):**
- Doesn't have its own signals, but you'll often use Area2D children to detect contacts.

**Node (base class):**
- `Ready` — the node entered the tree (same as `_Ready()`, but as a signal).
- `TreeExiting` — the node is about to leave the tree.

You can see all signals for any node by selecting it in the editor and clicking the **Node** tab (next to the Inspector tab). Every signal the node can emit is listed there.

### The Three Parts of Signal Communication

Every signal interaction has three parts:

1. **Declaration** — the signal exists on a node (built-in or custom).
2. **Connection** — another node says "when that signal fires, call this method on me."
3. **Emission** — the signal fires, and all connected methods are called.

For built-in signals, step 1 is done for you. You just connect and respond. For custom signals, you'll declare them yourself (section 6.4).

---

## 6.2 Connecting Signals in the Editor

The fastest way to connect a signal is through the Godot editor — no code required. Let's walk through a concrete example: making a Button print a message when clicked.

### Step-by-Step: Button → Print

1. Create a scene with a `Control` root node. Add a `Button` child and a `Label` child.
2. Select the `Button` node.
3. Click the **Node** tab on the right side of the editor (next to the Inspector tab).
4. You'll see a list of signals. Find `pressed()` under **BaseButton**.
5. Double-click `pressed()` (or select it and click **Connect...**).
6. A dialog appears:
   - **Connect to Node:** select the node whose script should handle the signal. Pick the root `Control` node.
   - **Receiver Method:** Godot suggests a name like `_on_button_pressed`. You can change it, but the convention `_on_NodeName_signal_name` is clear and widely used.
7. Click **Connect**.

Godot creates the method stub in your script. If the root `Control` doesn't have a script yet, Godot will prompt you to create one. The generated method looks like this:

```csharp
public partial class MainUI : Control
{
    private void _on_button_pressed()
    {
        // Replace with function body.
    }
}
```

Now fill in the method:

```csharp
private void _on_button_pressed()
{
    var label = GetNode<Label>("Label");
    label.Text = "Button was clicked!";
}
```

Build and run. Click the button, and the label updates. The button emitted its `Pressed` signal, and your method responded.

### Visual Indicators

After connecting a signal in the editor, you'll notice:

- The **Node** tab shows a green connection icon next to the signal.
- The connected method in your script has a **green arrow icon** in the margin (in the Godot script editor).
- The connection is saved in the `.tscn` scene file — it's part of the scene data, not the code.

### Disconnecting

To remove a connection, go back to the **Node** tab, right-click the connection, and select **Disconnect**. The method in your script remains (it's just a regular method now), but the signal no longer calls it.

### When to Use Editor Connections

Editor connections are great when:

- The signal source and the handler are in the **same scene**.
- The connection is **permanent** — it should always exist.
- You want non-programmers to see and understand the wiring.

They're less suitable when:

- You need to connect signals **dynamically** (e.g., to enemies that spawn at runtime).
- The signal source is in a **different scene** (the editor can only connect within the current scene).
- You want **conditional** connections (connect only if some condition is met).

For those cases, you connect signals from code.

---

## 6.3 Connecting Signals from C# Code

Connecting signals from code gives you full control — you decide when, where, and to what method a signal connects. This is the approach you'll use most often in practice.

### The += Syntax

In C#, Godot signals behave like events. You connect to them using the `+=` operator:

```csharp
public partial class MainUI : Control
{
    private Button _button;
    private Label _label;

    public override void _Ready()
    {
        _button = GetNode<Button>("Button");
        _label = GetNode<Label>("Label");

        _button.Pressed += OnButtonPressed;
    }

    private void OnButtonPressed()
    {
        _label.Text = "Clicked from code!";
    }
}
```

This does exactly the same thing as the editor connection from section 6.2, but entirely from code. The `+=` says: "when this signal fires, call this method."

### Method Naming Convention

When connecting from code, name your handler methods with the `On` prefix followed by a description of what happened:

```csharp
_button.Pressed += OnButtonPressed;
_timer.Timeout += OnTimerTimeout;
_area.BodyEntered += OnBodyEntered;
_animPlayer.AnimationFinished += OnAnimationFinished;
```

This reads naturally: "On button pressed, do this." It's clear, consistent, and self-documenting.

### Connecting with Lambda Expressions

For simple, one-line handlers, you can use lambda expressions instead of separate methods:

```csharp
public override void _Ready()
{
    var button = GetNode<Button>("Button");
    button.Pressed += () => GD.Print("Button was pressed!");
}
```

Or with parameters:

```csharp
var timer = GetNode<Timer>("Timer");
timer.Timeout += () =>
{
    GD.Print("Timer finished!");
    timer.Start();  // restart the timer
};
```

Lambdas are convenient for small handlers. But if the logic is more than 2-3 lines, extract it into a named method — it's easier to read and debug.

### Disconnecting Signals from Code

To disconnect a signal, use the `-=` operator:

```csharp
_button.Pressed -= OnButtonPressed;
```

**Important:** You can only disconnect with `-=` if you connected with a named method. If you connected with a lambda, you can't disconnect it (there's no reference to the lambda to remove). This is one reason to prefer named methods for signals that might need to be disconnected.

### When to Disconnect

You should disconnect signals when:

- The listening node is about to be freed (to prevent calls to a destroyed object).
- You want to temporarily stop responding to a signal.
- You're replacing one handler with another.

In many cases, Godot handles cleanup automatically — when a node is freed, its signal connections are cleaned up. But explicitly disconnecting is good practice when the *emitter* outlives the *receiver*.

### A Practical Example: Timer-Based Spawner

Here's a common game pattern — using a Timer signal to spawn enemies at regular intervals:

```csharp
public partial class EnemySpawner : Node2D
{
    [Export] public PackedScene EnemyScene;
    [Export] public float SpawnInterval = 2.0f;

    private Timer _timer;

    public override void _Ready()
    {
        _timer = GetNode<Timer>("SpawnTimer");
        _timer.WaitTime = SpawnInterval;
        _timer.Timeout += OnSpawnTimerTimeout;
        _timer.Start();
    }

    private void OnSpawnTimerTimeout()
    {
        var enemy = EnemyScene.Instantiate<Node2D>();
        enemy.GlobalPosition = GlobalPosition;
        GetTree().CurrentScene.AddChild(enemy);
        GD.Print("Enemy spawned!");
    }
}
```

The scene tree for this would be:

```
EnemySpawner (Node2D) — EnemySpawner.cs
└── SpawnTimer (Timer)
```

Set the Timer's `One Shot` property to `false` (so it repeats), and you've got an enemy spawner in under 20 lines of code.

---

## 6.4 Custom Signals with [Signal]

Built-in signals cover common node behaviors — button presses, timer completions, area overlaps. But your game has its own events: a player takes damage, a level is completed, an item is picked up, a dialogue starts. For these, you define **custom signals**.

### Declaring a Custom Signal

In C#, you declare a custom signal using the `[Signal]` attribute on a **delegate**:

```csharp
public partial class Player : CharacterBody2D
{
    [Signal]
    public delegate void HealthChangedEventHandler();
}
```

The naming convention is important and required:

- The delegate must end with `EventHandler`.
- Godot strips the `EventHandler` suffix to create the signal name. So `HealthChangedEventHandler` becomes the signal `HealthChanged`.

After declaring the signal and building (Alt+B), Godot's source generator creates the machinery behind the scenes. The signal appears in the editor's **Node** tab alongside the built-in signals.

### Emitting a Custom Signal

To fire the signal, call `EmitSignal()` with the signal's name:

```csharp
public partial class Player : CharacterBody2D
{
    [Signal]
    public delegate void HealthChangedEventHandler();

    private int _health = 100;

    public void TakeDamage(int amount)
    {
        _health -= amount;
        EmitSignal(SignalName.HealthChanged);
        GD.Print($"Player took {amount} damage! Health: {_health}");
    }
}
```

`SignalName.HealthChanged` is auto-generated by Godot — it's a type-safe way to reference the signal name. No magic strings. If you rename the delegate, the compiler catches any mismatches.

### Connecting to a Custom Signal

Other nodes connect to your custom signal exactly like built-in signals:

```csharp
public partial class HUD : CanvasLayer
{
    private Player _player;
    private Label _healthLabel;

    public override void _Ready()
    {
        _player = GetNode<Player>("../Player");
        _healthLabel = GetNode<Label>("HealthLabel");

        _player.HealthChanged += OnPlayerHealthChanged;
    }

    private void OnPlayerHealthChanged()
    {
        _healthLabel.Text = $"Health: {_player.Health}";
    }
}
```

The HUD listens for the player's `HealthChanged` signal and updates the label when it fires. The player doesn't know the HUD exists. If you remove the HUD, the player code doesn't change. If you add a sound manager that also listens for `HealthChanged`, neither the player nor the HUD needs to change.

That's the power of signals — **loose coupling**.

### A Complete Example: Collectible Coin

Let's build a coin that disappears when the player touches it and notifies anyone listening:

```csharp
public partial class Coin : Area2D
{
    [Signal]
    public delegate void CollectedEventHandler();

    public override void _Ready()
    {
        BodyEntered += OnBodyEntered;
    }

    private void OnBodyEntered(Node2D body)
    {
        if (body is Player)
        {
            EmitSignal(SignalName.Collected);
            QueueFree();  // destroy the coin
        }
    }
}
```

The scene tree:

```
Coin (Area2D) — Coin.cs
├── Sprite2D (the coin image)
└── CollisionShape2D (the detection area)
```

And a score manager that listens:

```csharp
public partial class ScoreManager : Node
{
    private int _score = 0;

    public void RegisterCoin(Coin coin)
    {
        coin.Collected += () =>
        {
            _score += 10;
            GD.Print($"Score: {_score}");
        };
    }
}
```

Notice the score manager uses a `RegisterCoin` method. You'd call this when spawning or initializing coins. Each coin has no idea who's tracking the score — it just emits `Collected` and disappears.

---

## 6.5 Signal Parameters and Delegates

Signals can carry data. When the player's health changes, the signal should include the new health value. When an enemy dies, the signal should include how many points the kill is worth. Signal parameters make this possible.

### Declaring Signals with Parameters

Add parameters to the delegate:

```csharp
public partial class Player : CharacterBody2D
{
    [Signal]
    public delegate void HealthChangedEventHandler(int newHealth);

    [Signal]
    public delegate void DiedEventHandler();

    [Signal]
    public delegate void DamageReceivedEventHandler(int amount, string source);

    private int _health = 100;

    public void TakeDamage(int amount, string source = "unknown")
    {
        _health = Mathf.Max(0, _health - amount);
        EmitSignal(SignalName.HealthChanged, _health);
        EmitSignal(SignalName.DamageReceived, amount, source);

        if (_health <= 0)
        {
            EmitSignal(SignalName.Died);
        }
    }
}
```

When emitting, pass the parameter values after the signal name. The order must match the delegate's parameter order.

### Connecting to Signals with Parameters

The handler method must accept the same parameters:

```csharp
public partial class HUD : CanvasLayer
{
    private Label _healthLabel;
    private Label _damageLog;

    public override void _Ready()
    {
        _healthLabel = GetNode<Label>("HealthLabel");
        _damageLog = GetNode<Label>("DamageLog");

        var player = GetNode<Player>("../Player");
        player.HealthChanged += OnHealthChanged;
        player.DamageReceived += OnDamageReceived;
        player.Died += OnPlayerDied;
    }

    private void OnHealthChanged(int newHealth)
    {
        _healthLabel.Text = $"Health: {newHealth}";
    }

    private void OnDamageReceived(int amount, string source)
    {
        _damageLog.Text = $"Took {amount} damage from {source}!";
    }

    private void OnPlayerDied()
    {
        _healthLabel.Text = "DEAD";
        _healthLabel.Modulate = Colors.Red;
    }
}
```

### Supported Parameter Types

Signal parameters can be:

- **Primitives:** `int`, `float`, `double`, `bool`, `string`
- **Godot types:** `Vector2`, `Vector3`, `Color`, `StringName`, `NodePath`
- **Godot objects:** `Node`, `Resource`, or any subclass
- **Enums** (as `int` — Godot converts them)

Arrays and custom C# classes (non-Godot types) are not supported as signal parameters. If you need to pass complex data, pass a `Resource` or `GodotObject` subclass, or break it into multiple primitive parameters.

### Built-in Signals with Parameters

Many built-in signals already include parameters. For example:

```csharp
// Area2D.BodyEntered passes the body that entered
area.BodyEntered += OnBodyEntered;

private void OnBodyEntered(Node2D body)
{
    GD.Print($"{body.Name} entered the area");
}
```

```csharp
// AnimationPlayer.AnimationFinished passes the animation name
animPlayer.AnimationFinished += OnAnimationFinished;

private void OnAnimationFinished(StringName animName)
{
    GD.Print($"Animation '{animName}' finished");
    if (animName == "death")
    {
        QueueFree();
    }
}
```

```csharp
// Timer.Timeout has no parameters
timer.Timeout += OnTimeout;

private void OnTimeout()
{
    GD.Print("Time's up!");
}
```

To know what parameters a built-in signal provides, check the **Node** tab in the editor or the Godot API documentation. The editor shows the signal signature, including parameter names and types.

---

## 6.6 When to Use Signals vs Direct References

You now have two ways for nodes to communicate:

1. **Direct references** — node A calls a method on node B directly (using `GetNode<T>()`).
2. **Signals** — node A emits a signal, and node B responds.

Both are valid. Choosing the right one depends on the relationship between the nodes.

### Use Signals When…

**The sender doesn't need to know who's listening.**

A coin emits `Collected`. It doesn't care whether a score manager, a sound system, an achievement tracker, or all three are listening. It just broadcasts "I was collected."

**Multiple nodes might need to respond.**

A player's `Died` signal might be connected to the HUD (show game over), the music manager (play sad music), and the enemy spawner (stop spawning). Signals make one-to-many communication natural.

**You want to decouple systems.**

If the coin script imports the score manager type, deleting the score manager breaks the coin. With signals, the coin has zero dependencies on anything outside itself.

**The communication goes "up" the tree or "sideways."**

A child node should not reach up to find its parent and call methods on it. Instead, it emits a signal, and the parent (who created the child and knows it exists) connects to it.

### Use Direct References When…

**The sender needs a response or value.**

Signals are fire-and-forget. If you need to ask "what's the player's health?" you need a direct reference: `_player.Health`. Signals can't return values.

**The communication goes "down" the tree.**

A parent accessing its own children is natural and expected. A `Player` script calling `_sprite.FlipH = true` on its child `Sprite2D` is perfectly fine — the parent owns the child, knows it exists, and should control it.

**There's a clear, permanent dependency.**

A `Player` script will always need its `Sprite2D`, `CollisionShape2D`, and `AnimationPlayer` children. Using `GetNode<T>()` for these direct children is simpler and clearer than setting up signal chains.

**Performance matters (rare).**

Direct method calls are faster than signal emissions. In practice, this almost never matters — signals are fast. But in a tight loop called thousands of times per frame, a direct call might be better.

### The Rule of Thumb

Think about the **direction** and **coupling**:

| Direction | Approach | Example |
|---|---|---|
| **Parent → Child** | Direct reference | Player flips its own Sprite2D |
| **Child → Parent** | Signal | HurtBox tells Player it was hit |
| **Sibling → Sibling** | Signal (via parent) | Enemy emits `Died`, ScoreManager listens |
| **Unrelated nodes** | Signal (via manager/autoload) | UI listens to game state changes |

A helpful analogy from web development: direct references are like `props` passed down from parent to child. Signals are like **events** that bubble up (or out) from children. Just as React discourages children from reaching into parent state, Godot discourages children from calling methods on parent nodes directly. Emit a signal instead, and let the parent decide how to respond.

### Anti-Patterns to Avoid

**Don't use signals for everything.** If a Player script needs to access its own Sprite2D child, just use `GetNode<Sprite2D>("Sprite2D")`. Adding a signal for `SpriteNeedsFlipping` is over-engineering.

**Don't chain signals for data flow.** If node A emits to B, and B re-emits to C, and C re-emits to D — you've got a chain that's hard to trace. Consider whether A should emit directly to a shared manager, or whether a direct reference is simpler.

**Don't emit signals in `_Process()` every frame.** Signals are meant for events — things that *happen*. "The player moved" is not an event; it's continuous state. Use direct references for reading continuous state, and signals for discrete events like "the player started moving" or "the player stopped."

---

## 6.7 The Observer Pattern in Game Design

You've already been using it — signals *are* the Observer pattern. But let's name it explicitly and see why it's so fundamental to game architecture.

### The Pattern

The Observer pattern defines a one-to-many dependency between objects. When one object (the **subject**) changes state, all its dependents (the **observers**) are notified and updated automatically.

In Godot terms:

- **Subject** = the node that declares and emits the signal.
- **Observer** = any node that connects to the signal.
- **Notification** = the signal emission.

```
                    emits signal
   [Subject] ─────────────────────> [Observer 1]
       │                            [Observer 2]
       └──────────────────────────> [Observer 3]
```

The subject doesn't know how many observers there are, or what they do. Observers can be added or removed at any time.

### Why This Matters for Games

Games are complex systems with many interacting parts. A single game event can trigger cascading effects:

**"The player picked up a health potion":**
- Health system: increase player health.
- HUD: update the health bar.
- Audio: play a pickup sound.
- Inventory: remove the potion.
- Particle system: play a sparkle effect.
- Achievement tracker: check if "collect 100 items" is done.

Without signals, the potion node would need direct references to *all six systems*. Adding a seventh system (say, analytics) means modifying the potion code.

With signals, the potion emits `Collected` and doesn't care. Each system connects independently. Adding analytics means adding one line in the analytics manager — no other code changes.

### Designing Signal Architecture

When planning a new feature, think about **who needs to know** and **who should emit**:

**Step 1:** Identify the event. What happened? "Enemy died," "Level completed," "Item crafted."

**Step 2:** Decide who emits. Usually the node where the event originates. The enemy emits `Died`, not the player who killed it.

**Step 3:** Decide what data to include. The `Died` signal might include points value. Keep it minimal — only include data the emitter naturally has.

**Step 4:** Identify the listeners. Who needs to react? Each listener connects independently.

### Example: Game Event Flow

Here's how signals might flow in a simple game:

```csharp
// Enemy.cs — emits when killed
public partial class Enemy : CharacterBody2D
{
    [Signal]
    public delegate void DiedEventHandler(int pointsValue);

    [Export] public int PointsValue = 100;

    public void Die()
    {
        EmitSignal(SignalName.Died, PointsValue);
        QueueFree();
    }
}
```

```csharp
// ScoreManager.cs — listens for enemy deaths
public partial class ScoreManager : Node
{
    [Signal]
    public delegate void ScoreChangedEventHandler(int newScore);

    private int _score = 0;

    public void TrackEnemy(Enemy enemy)
    {
        enemy.Died += OnEnemyDied;
    }

    private void OnEnemyDied(int points)
    {
        _score += points;
        EmitSignal(SignalName.ScoreChanged, _score);
    }
}
```

```csharp
// HUD.cs — listens for score changes
public partial class HUD : CanvasLayer
{
    private Label _scoreLabel;

    public override void _Ready()
    {
        _scoreLabel = GetNode<Label>("ScoreLabel");

        var scoreManager = GetNode<ScoreManager>("/root/ScoreManager");
        scoreManager.ScoreChanged += OnScoreChanged;
    }

    private void OnScoreChanged(int newScore)
    {
        _scoreLabel.Text = $"Score: {newScore}";
    }
}
```

Notice the layering: `Enemy → ScoreManager → HUD`. Each node only knows about the thing it connects to, not the whole chain. The enemy doesn't know about the HUD. The HUD doesn't know about enemies. Each piece can be tested, modified, or replaced independently.

### Signals and Autoloads

You might wonder: how does the ScoreManager connect to every enemy, including enemies that spawn later? One common approach is **Autoloads** (singletons) — global nodes that persist across scenes. We'll cover Autoloads in Chapter 21, but here's the concept:

An Autoload like `ScoreManager` is always in the tree at `/root/ScoreManager`. When an enemy spawns, the spawner (or the enemy itself in `_Ready()`) calls `ScoreManager.TrackEnemy(this)`. The ScoreManager connects to the enemy's `Died` signal, and the chain is set up.

For now, just know that signals + autoloads is a very common pattern for game-wide event systems.

### Common Signal Patterns in Games

Here are patterns you'll see and use repeatedly:

**Health system:**
```csharp
[Signal] public delegate void HealthChangedEventHandler(int current, int max);
[Signal] public delegate void DiedEventHandler();
[Signal] public delegate void HealedEventHandler(int amount);
```

**State changes:**
```csharp
[Signal] public delegate void StateChangedEventHandler(string newState);
[Signal] public delegate void GamePausedEventHandler();
[Signal] public delegate void GameResumedEventHandler();
```

**Interactions:**
```csharp
[Signal] public delegate void ItemPickedUpEventHandler(string itemId);
[Signal] public delegate void DialogueStartedEventHandler(string npcName);
[Signal] public delegate void LevelCompletedEventHandler(float completionTime);
```

Keep your signals focused. Each signal should represent one clear event. If a signal needs five parameters, consider whether it's really one event or several.

---

## Summary

- **Signals are Godot's event system** — a node emits a signal, and any connected node responds. The emitter doesn't know or care who's listening.
- **Built-in signals** cover common node events: `Pressed`, `Timeout`, `BodyEntered`, `AnimationFinished`, and many more. Check the Node tab to see them all.
- **Connect signals in the editor** for permanent, same-scene connections. Double-click a signal in the Node tab and pick a receiver.
- **Connect signals from code** using `+=` for full control. Disconnect with `-=`. Prefer named methods over lambdas for connections you might need to disconnect.
- **Custom signals** are declared with `[Signal]` on a delegate ending in `EventHandler`. Emit them with `EmitSignal(SignalName.YourSignal)`.
- **Signal parameters** carry data with the event. Declare parameters on the delegate, pass values in `EmitSignal()`, and receive them in the handler method.
- **Signals vs direct references:** use signals when communication goes up/sideways and you want loose coupling. Use direct references when going down the tree or when you need return values.
- **The Observer pattern** is the design principle behind signals — one-to-many notification with loose coupling. It keeps your game systems independent and composable.

**Next up: Chapter 7 — Input Handling.** Your nodes can now talk to each other, but they can't listen to the player yet. You'll learn to read keyboard, mouse, and gamepad input — and build responsive controls that feel good to play.
