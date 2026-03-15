/**
 * GDScript language grammar for highlight.js / lowlight
 * Covers GDScript 2.0 (Godot 4.x) syntax
 */
export function gdscript(hljs: any) {
  return {
    name: "GDScript",
    aliases: ["gdscript", "gd"],
    keywords: {
      keyword:
        "if elif else for while match when break continue pass return " +
        "class class_name extends is as in not and or func signal var const " +
        "enum static await yield self super true false null",
      built_in:
        "print print_rich printerr push_error push_warning " +
        "abs absf absi acos asin atan atan2 ceil clamp cos deg_to_rad " +
        "exp floor fmod fposmod inverse_lerp is_equal_approx is_inf " +
        "is_nan is_zero_approx lerp lerp_angle lerpf linear_to_db " +
        "log max maxf maxi min minf mini move_toward nearest_po2 " +
        "pow rad_to_deg randf randf_range randi randi_range randomize " +
        "remap round seed sign signf signi sin snapped sqrt " +
        "step_decimals str tan typeof wrap wrapf wrapi " +
        "preload load",
      type:
        "bool int float String Vector2 Vector2i Vector3 Vector3i Vector4 " +
        "Rect2 Transform2D Transform3D Color NodePath Array Dictionary " +
        "PackedByteArray PackedInt32Array PackedFloat32Array " +
        "PackedStringArray PackedVector2Array PackedVector3Array " +
        "PackedColorArray Signal Callable StringName Basis AABB " +
        "Quaternion Projection RID Object Node Resource",
      literal: "true false null INF NAN PI TAU",
    },
    contains: [
      hljs.HASH_COMMENT_MODE,
      hljs.QUOTE_STRING_MODE,
      hljs.APOS_STRING_MODE,
      hljs.C_NUMBER_MODE,
      {
        className: "function",
        beginKeywords: "func",
        end: /:/,
        excludeEnd: true,
        contains: [
          hljs.UNDERSCORE_TITLE_MODE,
          {
            begin: /\(/,
            end: /\)/,
            contains: [hljs.UNDERSCORE_TITLE_MODE, hljs.C_NUMBER_MODE],
          },
        ],
      },
      {
        className: "meta",
        begin: /@(export|onready|tool|icon|warning_ignore)\b/,
      },
      {
        className: "string",
        begin: /"""/,
        end: /"""/,
      },
      {
        className: "symbol",
        begin: /\$\w+/,
      },
    ],
  };
}
