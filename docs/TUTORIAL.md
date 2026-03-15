# Tutorial Structure — Godot with C# (Hebrew)

A detailed, project-based tutorial that takes the reader from zero to publishing a game.
Each part builds on the previous one. By the end, the reader will have built several small games and one complete project.

---

## Part 1: Getting Started

### Chapter 1: Introduction
- 1.1 What is Godot?
- 1.2 Why Godot + C#?
- 1.3 What you'll build in this tutorial
- 1.4 Prerequisites (basic programming knowledge)
- 1.5 How to use this tutorial

### Chapter 2: Setting Up Your Environment
- 2.1 Downloading Godot (.NET version)
- 2.2 Installing the .NET SDK
- 2.3 Setting up an IDE (VS Code / Rider)
- 2.4 Creating your first Godot project
- 2.5 The Godot editor — first look
- 2.6 Running "Hello World" from C#

### Chapter 3: The Godot Editor
- 3.1 The main panels (Scene, Inspector, FileSystem, Output)
- 3.2 2D and 3D viewports
- 3.3 The scene tree and node hierarchy
- 3.4 Creating and saving scenes
- 3.5 Project settings overview
- 3.6 Keyboard shortcuts and workflow tips

---

## Part 2: Core Concepts

### Chapter 4: Nodes & Scenes
- 4.1 What is a Node?
- 4.2 The node tree and parent-child relationships
- 4.3 Built-in node types overview
- 4.4 What is a Scene?
- 4.5 Scene composition — scenes within scenes
- 4.6 Instancing scenes at runtime
- 4.7 Practical exercise: building a scene hierarchy

### Chapter 5: C# in Godot — The Basics
- 5.1 How C# integrates with Godot
- 5.2 Your first script — attaching C# to a node
- 5.3 `_Ready()`, `_Process()`, `_PhysicsProcess()`
- 5.4 Accessing node properties from code
- 5.5 `GetNode<T>()` and `[Export]` attributes
- 5.6 Logging and debugging
- 5.7 C# vs GDScript — key differences

### Chapter 6: Signals & Communication
- 6.1 What are signals?
- 6.2 Connecting signals in the editor
- 6.3 Connecting signals from C# code
- 6.4 Custom signals with `[Signal]`
- 6.5 Signal parameters and delegates
- 6.6 When to use signals vs direct references
- 6.7 The Observer pattern in game design

### Chapter 7: Input Handling
- 7.1 The Input Map — defining actions
- 7.2 Polling input with `Input.IsActionPressed()`
- 7.3 Event-driven input with `_Input()` and `_UnhandledInput()`
- 7.4 Keyboard, mouse, and gamepad input
- 7.5 Input actions vs raw key codes
- 7.6 Building a reusable input manager

---

## Part 3: 2D Game Development

### Chapter 8: Sprites & Textures
- 8.1 Importing images and assets
- 8.2 Sprite2D node
- 8.3 Texture regions and atlas textures
- 8.4 Flipping, scaling, and modulating sprites
- 8.5 AnimatedSprite2D — sprite sheet animations
- 8.6 Organizing art assets in the project

### Chapter 9: Movement & Physics (2D)
- 9.1 Moving a node with code (position, velocity)
- 9.2 CharacterBody2D — the player controller
- 9.3 `MoveAndSlide()` — collision-aware movement
- 9.4 RigidBody2D — physics-driven objects
- 9.5 StaticBody2D — walls and floors
- 9.6 Area2D — triggers and detection zones
- 9.7 Gravity, friction, and bounce

### Chapter 10: Collisions & Physics Shapes
- 10.1 CollisionShape2D and collision polygons
- 10.2 Collision layers and masks
- 10.3 Detecting collisions in code
- 10.4 Area2D overlap detection
- 10.5 Raycasting in 2D
- 10.6 One-way platforms and slopes

### Chapter 11: TileMaps
- 11.1 What is a TileMap?
- 11.2 Creating a TileSet
- 11.3 Painting tiles in the editor
- 11.4 Auto-tiling and terrain rules
- 11.5 Tile collisions and physics layers
- 11.6 Multiple tile layers
- 11.7 Procedural tile placement from code

### Chapter 12: Camera & Viewport
- 12.1 Camera2D setup and following
- 12.2 Camera limits and smoothing
- 12.3 Camera zoom and shake effects
- 12.4 Viewport and resolution settings
- 12.5 Pixel-perfect rendering
- 12.6 Split-screen basics

---

## Part 4: Mini-Project — 2D Platformer

### Chapter 13: Planning the Platformer
- 13.1 Game design document (scope)
- 13.2 Project structure and folder conventions
- 13.3 Gathering free assets
- 13.4 Setting up the project

### Chapter 14: Player Character
- 14.1 Player scene setup (CharacterBody2D)
- 14.2 Movement — run, jump, fall
- 14.3 Animations — idle, run, jump, fall
- 14.4 Coyote time and jump buffering
- 14.5 Double jump and wall jump
- 14.6 Dust particles and juice

### Chapter 15: Level Design
- 15.1 Building levels with TileMap
- 15.2 Platforms, spikes, and hazards
- 15.3 Checkpoints and respawn
- 15.4 Collectibles (coins, gems)
- 15.5 Level transitions and doors
- 15.6 Parallax background layers

### Chapter 16: Enemies & AI
- 16.1 Basic enemy scene (patrol left-right)
- 16.2 Enemy-player interaction (damage, stomp)
- 16.3 Chasing AI with raycasts
- 16.4 Enemy spawners
- 16.5 Boss fight basics

### Chapter 17: Polishing the Platformer
- 17.1 Health system and lives
- 17.2 Score and HUD
- 17.3 Game over and restart
- 17.4 Main menu and pause menu
- 17.5 Sound effects and background music
- 17.6 Screen transitions and fade effects

---

## Part 5: Essential Systems

### Chapter 18: Animation System
- 18.1 AnimationPlayer node
- 18.2 Keyframe animation — properties, methods, signals
- 18.3 Animation tracks and blending
- 18.4 AnimationTree and state machines
- 18.5 Tweens — procedural animations with `CreateTween()`
- 18.6 Easing functions and chaining

### Chapter 19: Audio
- 19.1 AudioStreamPlayer and AudioStreamPlayer2D
- 19.2 Importing and organizing audio files
- 19.3 Playing sounds from code
- 19.4 Audio buses and mixing
- 19.5 Background music with crossfade
- 19.6 Spatial audio basics (2D)
- 19.7 Building an AudioManager singleton

### Chapter 20: UI System (Control Nodes)
- 20.1 Control nodes overview
- 20.2 Anchors, margins, and containers
- 20.3 Labels, buttons, and text input
- 20.4 Themes and styling
- 20.5 HBoxContainer, VBoxContainer, GridContainer
- 20.6 Building a settings menu (volume, fullscreen)
- 20.7 Responsive UI and RTL considerations
- 20.8 Custom UI components

### Chapter 21: Scene Management
- 21.1 Changing scenes with `GetTree().ChangeSceneToFile()`
- 21.2 Autoloads (singletons) — global managers
- 21.3 Scene preloading and resource management
- 21.4 Loading screens and async loading
- 21.5 Scene transition animations
- 21.6 Managing game state across scenes

### Chapter 22: Saving & Loading
- 22.1 FileAccess — reading and writing files
- 22.2 JSON serialization for save data
- 22.3 Saving game state (player position, inventory, progress)
- 22.4 Multiple save slots
- 22.5 Settings persistence (user preferences)
- 22.6 Save file versioning and migration

---

## Part 6: Intermediate Techniques

### Chapter 23: Particles & Visual Effects
- 23.1 GPUParticles2D — fire, smoke, sparkles
- 23.2 Particle parameters and curves
- 23.3 CPUParticles2D — when to use
- 23.4 Shaders introduction — what they are
- 23.5 Simple 2D shaders (outline, flash, dissolve)
- 23.6 CanvasLayer and visual layering

### Chapter 24: State Machines
- 24.1 Why state machines?
- 24.2 Simple enum-based state machine
- 24.3 State machine with classes (State pattern)
- 24.4 Player states — idle, run, jump, attack, hurt
- 24.5 Enemy states — patrol, chase, attack, die
- 24.6 Hierarchical state machines

### Chapter 25: Design Patterns in Godot
- 25.1 Singleton (Autoload)
- 25.2 Observer (Signals)
- 25.3 Command pattern (input buffering, undo)
- 25.4 Object pooling (bullets, particles)
- 25.5 Component pattern (modular behaviors)
- 25.6 When to use which pattern

### Chapter 26: Resources & Data
- 26.1 What is a Resource in Godot?
- 26.2 Custom resources with `[GlobalClass]`
- 26.3 Item databases and configuration files
- 26.4 Resource-based inventory system
- 26.5 Scriptable object pattern (stats, abilities)
- 26.6 Exporting resources and editor integration

---

## Part 7: Mini-Project — Top-Down RPG

### Chapter 27: RPG Project Setup
- 27.1 Planning scope and mechanics
- 27.2 Top-down movement (8-directional)
- 27.3 Animated character with directional sprites
- 27.4 TileMap world building

### Chapter 28: RPG Combat
- 28.1 Hitboxes and hurtboxes
- 28.2 Melee attack with animation
- 28.3 Health and damage system
- 28.4 Knockback effect
- 28.5 Enemy AI — wander, chase, attack
- 28.6 Loot drops

### Chapter 29: RPG Systems
- 29.1 Inventory UI and item management
- 29.2 Dialogue system (text boxes, NPC talk)
- 29.3 Quest system basics (objectives, completion)
- 29.4 Transition between areas (rooms/zones)
- 29.5 Saving and loading RPG state

---

## Part 8: 3D Fundamentals

### Chapter 30: Introduction to 3D in Godot
- 30.1 3D viewport and navigation
- 30.2 Node3D, MeshInstance3D, Camera3D
- 30.3 Importing 3D models (.glb, .gltf)
- 30.4 Materials and textures in 3D
- 30.5 Lighting basics (DirectionalLight3D, OmniLight3D, SpotLight3D)
- 30.6 Environment and sky

### Chapter 31: 3D Movement & Physics
- 31.1 CharacterBody3D — first-person and third-person
- 31.2 3D collision shapes
- 31.3 RigidBody3D in 3D
- 31.4 Raycasting in 3D
- 31.5 Navigation and pathfinding (NavigationAgent3D)
- 31.6 Basic 3D camera controller (orbit, follow)

### Chapter 32: 3D Mini-Project — First Person Explorer
- 32.1 First-person controller (mouse look + WASD)
- 32.2 Interacting with objects (raycast + signals)
- 32.3 Picking up and inspecting items
- 32.4 Simple 3D environment with lighting
- 32.5 Basic 3D UI (crosshair, interaction prompts)

---

## Part 9: Advanced Topics

### Chapter 33: Networking Basics
- 33.1 Multiplayer architecture overview (client-server, P2P)
- 33.2 Godot's multiplayer API — ENetMultiplayerPeer
- 33.3 RPCs and `[Rpc]` attribute
- 33.4 Synchronizing state
- 33.5 Building a simple multiplayer demo

### Chapter 34: Performance & Optimization
- 34.1 The Godot profiler
- 34.2 Node count and draw calls
- 34.3 Object pooling in practice
- 34.4 LOD and culling
- 34.5 C# performance tips (avoiding allocations, structs vs classes)
- 34.6 GDScript vs C# performance comparison

### Chapter 35: Testing & Debugging
- 35.1 Debugging in Godot (breakpoints, remote inspector)
- 35.2 Logging strategies
- 35.3 Unit testing C# in Godot (GdUnit, Chickensoft)
- 35.4 Common bugs and how to diagnose them
- 35.5 Editor plugins for productivity

### Chapter 36: Exporting & Publishing
- 36.1 Export templates and presets
- 36.2 Exporting for Windows, Linux, macOS
- 36.3 Exporting for Web (HTML5)
- 36.4 Exporting for Android (overview)
- 36.5 itch.io publishing workflow
- 36.6 Steam publishing overview
- 36.7 Versioning and update strategies

---

## Part 10: Capstone Project

### Chapter 37: Designing Your Game
- 37.1 Brainstorming and scoping
- 37.2 Writing a one-page design document
- 37.3 Choosing art style and sourcing assets
- 37.4 Planning milestones

### Chapter 38: Building the Capstone
- 38.1 Project setup and architecture
- 38.2 Core gameplay loop
- 38.3 Menus, UI, and polish
- 38.4 Sound design and music
- 38.5 Playtesting and iteration
- 38.6 Final polish — particles, juice, screen shake

### Chapter 39: Shipping It
- 39.1 Bug fixing and QA checklist
- 39.2 Building the final export
- 39.3 Creating a store page (itch.io)
- 39.4 Marketing basics — screenshots, trailer, description
- 39.5 Post-launch — feedback and patches

---

## Appendices

### Appendix A: C# Quick Reference
- Common types and syntax
- Generics, LINQ, async/await
- C# features used in Godot

### Appendix B: Godot Node Cheat Sheet
- Common 2D nodes and when to use them
- Common 3D nodes and when to use them
- Control nodes reference

### Appendix C: Math for Games
- Vectors and vector math
- Trigonometry basics
- Lerp, easing, and interpolation
- Random number generation

### Appendix D: Glossary
- Hebrew-English glossary of game development terms

### Appendix E: Resources & Community
- Official Godot documentation
- Recommended YouTube channels and courses
- Godot communities (Discord, Reddit, forums)
- Free asset sources
