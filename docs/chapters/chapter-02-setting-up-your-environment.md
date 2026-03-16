# Chapter 2: Setting Up Your Environment

---

## 2.1 Downloading Godot (.NET Version)

Godot comes in two flavors:

- **Godot (Standard)** — includes GDScript support only.
- **Godot (.NET)** — includes both GDScript and C# support.

Since we're using C#, you need the **.NET version**. This is critical — if you download the standard version, you won't be able to create or run C# scripts.

### Step by Step

1. Go to **https://godotengine.org/download**
2. You'll see download buttons for your operating system. Look for the version labeled **".NET"** — it will say something like "Godot Engine - .NET" or have a ".NET" badge next to it.
3. Download the appropriate file:
   - **Windows**: a `.zip` file (e.g., `Godot_v4.4-stable_mono_win64.zip`)
   - **macOS**: a `.zip` file (e.g., `Godot_v4.4-stable_mono_macos.universal.zip`)
   - **Linux**: a `.zip` file (e.g., `Godot_v4.4-stable_mono_linux_x86_64.zip`)

### Installing Godot

Godot is a **portable application** — it doesn't need a traditional installer. This is one of its charming qualities.

**Windows:**
1. Extract the `.zip` file to a folder of your choice. A good location is `C:\Godot\` or `C:\Tools\Godot\`.
2. Inside the extracted folder, you'll find the Godot executable (e.g., `Godot_v4.4-stable_mono_win64.exe`).
3. Double-click it. That's it — Godot is running.
4. Optional but recommended: right-click the executable and select "Pin to taskbar" or create a desktop shortcut.

**macOS:**
1. Extract the `.zip` file.
2. Drag the `Godot.app` into your `/Applications` folder.
3. The first time you open it, macOS may warn you that it's from an unidentified developer. Go to **System Settings → Privacy & Security** and click "Open Anyway."

**Linux:**
1. Extract the `.zip` file to a folder like `~/Godot/` or `/opt/godot/`.
2. Make the binary executable: `chmod +x Godot_v4.4-stable_mono_linux_x86_64`
3. Run it from the terminal or create a `.desktop` file for your application menu.

### Version Note

This tutorial is written for **Godot 4.4** and should work with any Godot 4.x version. If you're reading this in the future and Godot 4.5 or 4.6 is out, that's fine — the core concepts haven't changed. If Godot 5.x is out, some APIs may have changed, but the principles will still apply.

When you first launch Godot, you'll see the **Project Manager** — a window that lists your projects. It will be empty. Don't worry about it yet — we'll create our first project in section 2.4.

---

## 2.2 Installing the .NET SDK

C# runs on the **.NET platform**. To compile and run C# code, you need the .NET SDK (Software Development Kit) installed on your machine.

### What is the .NET SDK?

The .NET SDK provides:

- **The C# compiler** — translates your C# code into executable instructions.
- **The .NET runtime** — runs your compiled code.
- **The `dotnet` command-line tool** — used to build, run, and manage .NET projects.
- **The Base Class Library (BCL)** — thousands of built-in classes for strings, collections, file I/O, networking, and more.

Godot uses the .NET SDK behind the scenes every time you build your C# scripts. You don't interact with it directly most of the time, but it must be installed.

### Step by Step

1. Go to **https://dotnet.microsoft.com/download**
2. Download the **.NET 8 SDK** (or newer — .NET 9 also works). Make sure you download the **SDK**, not just the "Runtime."
3. Run the installer.

**Windows:**
The installer is straightforward. Click through the wizard and accept the defaults.

**macOS:**
Download the `.pkg` installer and run it. If you're on Apple Silicon (M1/M2/M3/M4), make sure you download the "Arm64" version.

**Linux:**
The installation method varies by distribution. For Ubuntu/Debian:
```bash
sudo apt-get update
sudo apt-get install -y dotnet-sdk-8.0
```

For Fedora:
```bash
sudo dnf install dotnet-sdk-8.0
```

For other distributions, check the official .NET documentation for instructions specific to your distro.

### Verifying the Installation

Open a terminal (Command Prompt or PowerShell on Windows, Terminal on macOS/Linux) and run:

```bash
dotnet --version
```

You should see something like `8.0.401` or similar. Any `8.x.x` or `9.x.x` version is fine.

If you get "command not found" or an error, the SDK didn't install correctly. Try restarting your terminal or computer, then check again. If it still doesn't work, revisit the installation steps.

### A Note on Versions

Godot 4.4 requires **.NET 8** or newer. Don't install .NET 6 or 7 — they won't work with the current version of Godot's C# integration. If you already have an older .NET version installed, you can install .NET 8 alongside it without conflicts.

---

## 2.3 Setting Up an IDE (VS Code / Rider)

You *can* write C# directly in Godot's built-in script editor. But you shouldn't. The built-in editor is designed for GDScript and provides minimal C# support — no real IntelliSense, no refactoring, no debugging.

For C# development, you want a proper IDE (Integrated Development Environment). There are two good options:

### Option A: Visual Studio Code (Free)

VS Code is a free, lightweight code editor by Microsoft. With the right extensions, it becomes a solid C# development environment.

**Installation:**
1. Download VS Code from **https://code.visualstudio.com**
2. Install it normally.

**Required Extensions:**
Open VS Code, go to the Extensions panel (Ctrl+Shift+X / Cmd+Shift+X), and install:

1. **C# Dev Kit** (by Microsoft) — provides IntelliSense, debugging, refactoring, and project management for C#. This extension will automatically install the "C#" base extension as well.
2. **godot-tools** (by Geequlim) — provides integration between VS Code and the Godot editor, including scene/resource previewing and GDScript support.

**Connecting VS Code to Godot:**
1. Open Godot.
2. Go to **Editor → Editor Settings**.
3. Search for "External Editor" or navigate to **Text Editor → External**.
4. Set **Exec Path** to the path of your VS Code executable:
   - Windows: `C:\Users\{YourUsername}\AppData\Local\Programs\Microsoft VS Code\Code.exe`
   - macOS: `/Applications/Visual Studio Code.app/Contents/MacOS/Electron`
   - Linux: `/usr/bin/code` or wherever `code` is installed
5. Set **Exec Flags** to: `{project} --goto {file}:{line}:{col}`

Now when you double-click a C# script in Godot, it will open in VS Code automatically.

### Option B: JetBrains Rider (Paid, with Free Options)

Rider is a professional C# IDE by JetBrains. It's the best C# editing experience available — period. It provides:

- Best-in-class IntelliSense and code analysis
- Powerful refactoring tools
- Built-in Godot plugin with direct integration
- Excellent debugger

**Pricing:**
- **Free for non-commercial use** (as of 2024, JetBrains offers a free non-commercial license)
- **Free for students** (with a valid student email)
- **Paid for commercial use** (~$15/month)

**Installation:**
1. Download Rider from **https://www.jetbrains.com/rider/**
2. Install it and activate with your license.

**Connecting Rider to Godot:**
1. In Rider, install the **Godot Support** plugin: go to **Settings → Plugins**, search for "Godot", and install it.
2. In Godot, go to **Editor → Editor Settings → Text Editor → External**.
3. Set **Exec Path** to your Rider executable path.
4. Set **Exec Flags** to: `{project} --line {line} {file}`

### Which Should You Choose?

| | VS Code | Rider |
|---|---|---|
| **Price** | Free | Free (non-commercial) or paid |
| **Setup effort** | Medium (need extensions) | Low (works out of the box) |
| **C# experience** | Good | Excellent |
| **Speed** | Fast startup | Slower startup, faster once loaded |
| **Resource usage** | Lower | Higher |

**My recommendation:** If you're just starting out, use VS Code — it's free, lightweight, and good enough. If you're serious about C# development and want the best tooling, try Rider's free license. You can always switch later.

Either way, **do not skip this step**. Writing C# without IntelliSense is like driving without headlights. You'll survive for a while, but you'll crash eventually.

---

## 2.4 Creating Your First Godot Project

Time to create something. Launch Godot — you'll see the **Project Manager**.

### Creating the Project

1. Click the **"+ New"** button (or "Create New Project" — the label varies by version).
2. In the dialog:
   - **Project Name**: Enter `HelloGodot`
   - **Project Path**: Choose a folder where you want to store your projects. Create a dedicated folder like `~/GodotProjects/` or `C:\GodotProjects\`. The project manager will create a subfolder with the project name.
   - **Renderer**: Select **"Forward+"** for now. (This is the default and best option for most cases. You can change it later if needed.)
   - **Version Control Metadata**: Select **"Git"** if you plan to use Git (recommended), or **"None"** if you don't care about version control yet.
3. Click **"Create & Edit"**.

Godot will create the project folder, generate some configuration files, and open the editor.

### What Godot Created

If you look inside the `HelloGodot` folder, you'll see:

```
HelloGodot/
├── .godot/              # Internal Godot files (don't touch)
├── HelloGodot.csproj    # C# project file
├── HelloGodot.sln       # C# solution file
├── project.godot        # Godot project configuration
```

- **`project.godot`** — the main project configuration file. It stores settings like window size, input mappings, and physics parameters. You'll rarely edit this directly — the Godot editor manages it.
- **`HelloGodot.csproj`** — tells .NET how to build your C# code, what references to include, and what version of Godot's C# bindings to use.
- **`HelloGodot.sln`** — a "solution" file that groups one or more `.csproj` files. Your IDE uses this to open the project.
- **`.godot/`** — internal cache and import data. This folder is auto-generated and should be added to `.gitignore` if you use Git.

### First Build

Before writing any code, let's verify that the C# build pipeline works:

1. In the Godot editor, look at the bottom panel. You should see a **"Build"** button (or you can use the menu **Build → Build Solution**).
2. Click **Build**.
3. The Output panel at the bottom should show something like: `Build succeeded.`

If it fails, the most common causes are:
- The .NET SDK is not installed or not in your PATH. Go back to section 2.2.
- You downloaded the non-.NET version of Godot. Go back to section 2.1.

Once the build succeeds, you're ready to write code.

---

## 2.5 The Godot Editor — First Look

The Godot editor can be intimidating at first. There are panels everywhere, buttons with cryptic icons, and docks you didn't ask for. Let's get oriented.

Don't try to memorize everything here — this is a quick overview to help you navigate. We'll cover the editor in depth in Chapter 3.

### The Main Layout

The editor is divided into several key areas:

```
┌──────────────────────────────────────────────────────────┐
│                      Toolbar                             │
├──────────┬───────────────────────────────┬────────────────┤
│          │                               │                │
│  Scene   │        Viewport               │   Inspector    │
│  Tree    │     (2D / 3D / Script)        │                │
│          │                               │                │
│          │                               │                │
├──────────┴───────────────────────────────┴────────────────┤
│                   Bottom Panel                            │
│              (Output / Debugger / Audio)                  │
└──────────────────────────────────────────────────────────┘
```

**Scene Tree (left):** Shows the hierarchy of nodes in your current scene. This is where you see what your scene is made of and how nodes are organized.

**Viewport (center):** The main editing area. At the top, you'll see tabs to switch between:
- **2D** — the 2D scene editor
- **3D** — the 3D scene editor
- **Script** — the built-in code editor (we'll use our external IDE instead, but it's here)
- **AssetLib** — a library of free community assets and plugins

**Inspector (right):** When you select a node, the Inspector shows all of its properties. This is where you tweak values — position, color, texture, speed, and hundreds of other settings depending on the node type.

**Bottom Panel:** Contains the Output log, Debugger, and other tools. The Output panel is especially important — it's where `GD.Print()` messages and error messages appear.

**FileSystem (bottom-left):** Shows all files in your project directory. You'll use this to navigate assets, scenes, and scripts.

### The Toolbar

The top toolbar has several important buttons:

- **Play buttons** (top-right area):
  - ▶ **Run Project** (F5) — runs the entire game starting from the main scene.
  - ▶ **Run Current Scene** (F6) — runs just the scene you're currently editing.
  - ■ **Stop** (F8) — stops the running game.

- **Scene tabs** — at the top of the viewport, you'll see tabs for each open scene. You can have multiple scenes open at once.

### The Important Takeaway

You don't need to understand every panel and button right now. The three things you need for the next section are:

1. **How to create a new scene** (Scene → New Scene, or Ctrl+N)
2. **How to add a node** (click the "+" icon at the top of the Scene Tree)
3. **How to run the project** (F5 or the Play button)

That's enough. Let's write some code.

---

## 2.6 Running "Hello World" from C#

Every programming journey starts with "Hello World." Ours will too — but in a way that teaches you the basic workflow you'll use for the rest of this tutorial.

### Step 1: Create a Scene

1. In the Godot editor, go to **Scene → New Scene** (or press Ctrl+N).
2. You'll be asked to choose a root node. Click **"Other Node"** to see the full list.
3. Search for **"Node"** (just the base `Node` type) and select it. Click **"Create"**.
4. You now have a scene with a single `Node` as the root. In the Scene Tree on the left, you'll see it listed as "Node."
5. Right-click the node and select **"Rename"** (or press F2). Rename it to `Main`.
6. Save the scene: **Scene → Save Scene** (Ctrl+S). Save it as `Main.tscn` in the root of your project.

### Step 2: Set It as the Main Scene

When you press F5 (Run Project), Godot needs to know which scene to start with. Let's set our new scene as the main scene:

1. Go to **Project → Project Settings**.
2. Under the **General** tab, find **Application → Run**.
3. Next to **Main Scene**, click the folder icon and select `Main.tscn`.
4. Close the Project Settings.

Alternatively, if you just press F5 now, Godot will ask you to select a main scene — just pick `Main.tscn`.

### Step 3: Attach a C# Script

1. In the Scene Tree, select the `Main` node.
2. Click the **"Attach Script"** button (the scroll icon with a green "+" at the top of the Scene Tree), or right-click the node and select **"Attach Script"**.
3. In the dialog:
   - **Language**: Make sure **C#** is selected.
   - **Path**: It should default to `res://Main.cs`. That's fine.
   - **Template**: Keep the default.
4. Click **"Create"**.

Godot creates a new C# file and opens it. If you configured an external editor in section 2.3, it should open there. Otherwise, it opens in Godot's built-in script editor.

### Step 4: Write the Code

The generated file will look something like this:

```csharp
using Godot;
using System;

public partial class Main : Node
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

Let's break this down:

- **`using Godot;`** — imports the Godot namespace, giving you access to all Godot classes and types.
- **`public partial class Main : Node`** — declares a class called `Main` that inherits from `Node`. The `partial` keyword is required by Godot's C# integration (it generates additional code behind the scenes for signal binding and exports).
- **`_Ready()`** — a built-in Godot method called **once** when the node is first added to the scene tree. This is where you put initialization code.
- **`_Process(double delta)`** — a built-in Godot method called **every frame** (typically 60 times per second). The `delta` parameter is the time elapsed since the last frame, in seconds. This is where you put game logic that needs to run continuously.

Now modify the `_Ready()` method:

```csharp
public override void _Ready()
{
    GD.Print("Hello, Godot!");
    GD.Print("C# is working!");
    GD.Print($"Godot version: {Engine.GetVersionInfo()["string"]}");
}
```

`GD.Print()` is Godot's equivalent of `Console.WriteLine()`. It prints to the Output panel at the bottom of the editor.

### Step 5: Build and Run

1. First, **build** the project: click the Build button or press Alt+B (Ctrl+B on macOS). You should see "Build succeeded" in the output.
2. Then **run** the project: press F5.

A game window will appear — it will be a blank, gray window. That's expected — we haven't added any visual elements. But look at the **Output panel** in the Godot editor:

```
Hello, Godot!
C# is working!
Godot version: 4.4.stable.mono
```

If you see those messages — **congratulations.** Your development environment is fully set up. Godot, .NET, your IDE, and C# are all talking to each other correctly.

Close the game window (click the X or press F8 in the editor).

### Step 6: Experiment

Before moving on, try a few things:

**Add some logic to `_Process()`:**

```csharp
private double _timer = 0;

public override void _Process(double delta)
{
    _timer += delta;
    if (_timer >= 3.0)
    {
        GD.Print("3 seconds have passed!");
        _timer = 0;
    }
}
```

Run the project again. Every 3 seconds, you'll see a message in the Output panel. This shows that `_Process()` runs every frame and you can use `delta` to track time.

**Try causing an error on purpose:**

```csharp
public override void _Ready()
{
    GD.Print("About to cause an error...");
    int x = 0;
    int y = 10 / x;  // Division by zero!
}
```

Run this and watch the Output panel. You'll see an error with a stack trace telling you exactly which file and line caused the problem. This is your debugging workflow — errors show up in the Output panel with enough information to find and fix them.

After experimenting, revert your code back to the simple "Hello, Godot!" version. We'll build on it in future chapters.

### What You Just Learned

This small exercise established the core workflow you'll use throughout this tutorial:

1. **Create a scene** with nodes.
2. **Attach a C# script** to a node.
3. **Write code** in your IDE.
4. **Build** the project (Alt+B).
5. **Run** the project (F5).
6. **Check the Output panel** for messages and errors.

This loop — edit, build, run, observe — is the heartbeat of game development in Godot.

---

## Summary

- Download the **.NET version** of Godot (not the standard version) from godotengine.org.
- Install the **.NET 8 SDK** (or newer) and verify with `dotnet --version`.
- Set up **VS Code** (with C# Dev Kit and godot-tools extensions) or **JetBrains Rider** as your code editor.
- Configure Godot to open scripts in your external editor.
- Create a project, create a scene, attach a C# script, and run "Hello World."
- The workflow is: **edit → build → run → observe**. Get comfortable with it — you'll repeat it thousands of times.

**Next up: Chapter 3 — The Godot Editor.** We'll take a thorough tour of every panel, dock, and tool in the Godot editor so you can navigate it with confidence.
