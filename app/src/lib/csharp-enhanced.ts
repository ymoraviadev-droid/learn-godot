/**
 * Enhanced C# grammar for highlight.js / lowlight
 *
 * Standalone grammar optimized for C# with Godot APIs.
 * Much richer highlighting than the built-in hljs csharp grammar:
 * - Method calls, properties, generic types
 * - PascalCase type recognition
 * - Godot-specific types as keywords
 *
 * Uses highlight.js v11 multi-scope array syntax for capture groups.
 */
export function csharpEnhanced(hljs: any) {
  const KEYWORDS = {
    keyword:
      "abstract as async await base break case catch checked class const " +
      "continue default delegate do else enum event explicit extern finally " +
      "fixed for foreach goto if implicit in interface internal is lock " +
      "namespace new null operator out override params partial private protected " +
      "public readonly ref return sealed sizeof stackalloc static struct " +
      "switch this throw try typeof unchecked unsafe using var virtual " +
      "volatile while yield dynamic nameof when where get set " +
      "init value add remove record required scoped file",
    type:
      // C# primitives
      "bool byte char decimal double float int long object sbyte short string uint ulong ushort void " +
      // .NET types
      "List Dictionary HashSet Queue Stack IEnumerable IEnumerator Task Action Func " +
      "Tuple ValueTuple Nullable Span Memory Exception " +
      // Godot types
      "Node Node2D Node3D CharacterBody2D CharacterBody3D RigidBody2D RigidBody3D " +
      "StaticBody2D StaticBody3D Area2D Area3D CollisionShape2D CollisionShape3D " +
      "Sprite2D Sprite3D AnimatedSprite2D AnimatedSprite3D Camera2D Camera3D " +
      "TileMap TileMapLayer Label Button Control Panel HBoxContainer VBoxContainer " +
      "MarginContainer CenterContainer GridContainer LineEdit TextEdit RichTextLabel " +
      "ProgressBar TextureRect ColorRect AudioStreamPlayer Timer SceneTree " +
      "PackedScene Resource Texture2D Vector2 Vector2I Vector3 Vector3I Vector4 " +
      "Color Rect2 Transform2D Transform3D Basis Quaternion AABB Projection " +
      "GD Input InputEvent InputEventKey InputEventMouse InputEventAction " +
      "ProjectSettings OS Engine ResourceLoader Signal Callable StringName " +
      "Array Dictionary Godot Tween Shader ShaderMaterial CanvasLayer Viewport " +
      "World2D World3D PhysicsBody2D PhysicsBody3D KinematicCollision2D " +
      "RayCast2D RayCast3D NavigationAgent2D NavigationAgent3D GPUParticles2D " +
      "AnimationPlayer AnimationTree StateMachine PathFollow2D PathFollow3D",
    literal: "true false null",
  };

  const STRING_MODES = [
    // Verbatim string @"..."
    { scope: "string", begin: /@"/, end: /"/, contains: [{ begin: /""/ }] },
    // Interpolated verbatim $@"..."
    { scope: "string", begin: /(\$@|@\$)"/, end: /"/, contains: [{ begin: /""/ }, { begin: /\{/, end: /\}/ }] },
    // Interpolated string $"..."
    { scope: "string", begin: /\$"/, end: /"/, contains: [{ begin: /\\[\\nrt"]/ }, { begin: /\{/, end: /\}/ }] },
    // Regular strings
    hljs.QUOTE_STRING_MODE,
    // Char literal
    { scope: "string", begin: /'/, end: /'/, contains: [{ begin: /\\./ }] },
  ];

  return {
    name: "C#",
    aliases: ["cs", "csharp", "c#"],
    keywords: KEYWORDS,
    contains: [
      // XML doc comment (before regular comments)
      {
        scope: "comment",
        begin: /\/\/\//,
        end: /$/,
        contains: [{ scope: "doctag", begin: /<\/?/, end: />/ }],
      },
      // Line and block comments
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,

      // Strings
      ...STRING_MODES,

      // Preprocessor: #region, #if, etc.
      {
        scope: "meta",
        begin: /^\s*#\s*(?:if|else|elif|endif|define|undef|region|endregion|pragma|nullable)\b/,
        end: /$/,
      },

      // Attributes: [Export], [Signal("name")]
      {
        scope: "meta",
        begin: /\[/,
        end: /\]/,
        contains: [
          { scope: "title.class", match: /[A-Z]\w*/ },
          ...STRING_MODES,
          hljs.C_NUMBER_MODE,
        ],
        relevance: 0,
      },

      // Generic type arguments: <PackedScene>, <Node2D>
      {
        begin: /</,
        end: />/,
        contains: [
          { scope: "title.class", match: /[A-Z]\w*/ },
          { scope: "keyword", match: /\b(?:int|string|float|double|bool|object|byte|char|long|short|decimal|void)\b/ },
        ],
        relevance: 0,
      },

      // using directive: using Godot;
      {
        begin: [/\busing/, /\s+/, /[\w.]+/, /\s*;/],
        scope: { 1: "keyword", 3: "title.class" },
      },

      // namespace declaration
      {
        begin: [/\bnamespace/, /\s+/, /[\w.]+/],
        scope: { 1: "keyword", 3: "title.class" },
      },

      // class/struct/interface/enum declaration
      {
        begin: [/\b(?:class|struct|interface|enum|record)/, /\s+/, /[A-Z]\w*/],
        scope: { 1: "keyword", 3: "title.class" },
      },

      // new Type(
      {
        begin: [/\bnew/, /\s+/, /[A-Z]\w*/],
        scope: { 1: "keyword", 3: "title.class" },
      },

      // .MethodCall( or .MethodCall<T>( — dot + PascalCase + open paren or generic
      {
        begin: [/\./, /[A-Z]\w*/, /\s*(?:<[^>]*>)?\s*\(/],
        scope: { 2: "title.function" },
      },

      // .Property — dot + PascalCase (everything else after dot)
      {
        match: [/\./, /[A-Z]\w*/],
        scope: { 2: "variable" },
      },

      // StandaloneMethod( or Method<T>( — PascalCase at word boundary
      {
        begin: [/\b[A-Z]\w*/, /\s*(?:<[^>]*>)?\s*\(/],
        scope: { 1: "title.function" },
      },

      // Type before dot (static access): GD.Print, Input.GetAxis
      {
        match: [/\b[A-Z]\w*/, /\./],
        scope: { 1: "type" },
      },

      // Numbers
      { scope: "number", match: /\b0[xX][0-9a-fA-F_]+[lLuU]*\b/ },
      { scope: "number", match: /\b0[bB][01_]+[lLuU]*\b/ },
      { scope: "number", match: /\b\d[\d_]*\.?[\d_]*(?:[eE][+-]?\d+)?[fFdDmMlLuU]*\b/ },
    ],
  };
}
