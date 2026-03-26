import {
  BookOpen,
  Gamepad2,
  Code2,
  Layers,
  Swords,
  Box,
  Sparkles,
  Globe,
  Hammer,
  Crosshair,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Chapter } from "../types/chapter";

export interface PartDef {
  slug: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  /** Chapter titles (Hebrew) — order matters, maps to chapter.order */
  chapters: string[];
}

export const PARTS: PartDef[] = [
  {
    slug: "getting-started",
    title: "צעדים ראשונים",
    description:
      "הכירו את Godot, התקינו את סביבת הפיתוח, ולמדו להתמצא בעורך. בסוף החלק הזה תדעו ליצור פרויקט חדש ולהריץ את השורה הראשונה של C# בתוך Godot.",
    icon: BookOpen,
    color: "text-blue-400",
    chapters: ["מבוא", "התקנת סביבת הפיתוח", "עורך Godot"],
  },
  {
    slug: "core-concepts",
    title: "מושגי יסוד",
    description:
      "Nodes, סצנות, סקריפטים, signals וקלט — ארבעת עמודי התווך של כל משחק ב-Godot. בחלק הזה תבנו את הבסיס התיאורטי והמעשי לכל מה שיבוא אחר כך.",
    icon: Layers,
    color: "text-purple-400",
    chapters: [
      "Nodes וסצנות",
      "#C ב-Godot",
      "Signals ותקשורת",
      "קלט משתמש (Input Handling)",
    ],
  },
  {
    slug: "2d-game-dev",
    title: "פיתוח משחקי 2D",
    description:
      "Sprites, תנועה, פיזיקה, התנגשויות, TileMaps ומצלמה — כל הכלים שצריך כדי לבנות משחק דו-ממדי מלא. כל פרק מלווה בדוגמאות קוד מעשיות.",
    icon: Gamepad2,
    color: "text-green-400",
    chapters: [
      "Sprites וטקסטורות",
      "פיזיקה ותנועה",
      "התנגשויות וצורות פיזיקה",
      "TileMaps",
      "מצלמה ו-Viewport",
    ],
  },
  {
    slug: "platformer-project",
    title: "פרויקט — משחק פלטפורמה",
    description:
      "הפרויקט המעשי הראשון! תכננו, בנו וליטשו משחק פלטפורמה שלם — עם דמות שחקן, עיצוב שלבים, אויבים, ומערכות ניקוד.",
    icon: Swords,
    color: "text-amber-400",
    chapters: [
      "תכנון המשחק",
      "דמות השחקן",
      "עיצוב שלבים",
      "אויבים ובינה מלאכותית",
      "ליטוש ופולישינג",
    ],
  },
  {
    slug: "essential-systems",
    title: "מערכות חיוניות",
    description:
      "אנימציה, אודיו, ממשק משתמש, ניהול סצנות, ושמירה/טעינה — המערכות שכל משחק צריך. למדו לבנות אותן נכון מההתחלה.",
    icon: Code2,
    color: "text-cyan-400",
    chapters: [
      "מערכת אנימציה",
      "אודיו",
      "ממשק משתמש (UI)",
      "ניהול סצנות",
      "שמירה וטעינה",
    ],
  },
  {
    slug: "advanced-techniques",
    title: "טכניקות מתקדמות",
    description:
      "חלקיקים, אפקטים ויזואליים, State Machines, Design Patterns ו-Resources — כלים מתקדמים שייקחו את המשחקים שלכם לרמה הבאה.",
    icon: Sparkles,
    color: "text-pink-400",
    chapters: [
      "חלקיקים ואפקטים",
      "State Machines",
      "Design Patterns",
      "Resources ונתונים",
    ],
  },
  {
    slug: "rpg-project",
    title: "פרויקט — RPG מלמעלה",
    description:
      "הפרויקט השני — משחק RPG במבט מלמעלה עם מערכת קרב, אינוונטורי, דיאלוגים ומשימות. שילוב של כל מה שלמדתם עד כה.",
    icon: Swords,
    color: "text-orange-400",
    chapters: ["הקמת הפרויקט", "מערכת קרב", "מערכות RPG"],
  },
  {
    slug: "capstone",
    title: "פרויקט גמר",
    description:
      "הפרויקט הסופי בעולם ה-2D — תכננו, בנו ושגרו משחק דו-ממדי משלכם מאפס. תכנון, בנייה, ליטוש, ופרסום ב-itch.io או Steam.",
    icon: Globe,
    color: "text-emerald-400",
    chapters: ["תכנון המשחק שלך", "בנייה", "שיגור"],
  },
  {
    slug: "advanced-topics",
    title: "נושאים מתקדמים",
    description:
      "רשת ומולטיפלייר, ביצועים ואופטימיזציה, בדיקות ודיבאג, ייצוא ופרסום — הנושאים שישלימו את הידע שלכם כמפתחי משחקים.",
    icon: Code2,
    color: "text-red-400",
    chapters: [
      "רשת ומולטיפלייר",
      "ביצועים ואופטימיזציה",
      "בדיקות ודיבאג",
      "ייצוא ופרסום",
    ],
  },
  {
    slug: "3d-fundamentals",
    title: "יסודות 3D",
    description:
      "מעבר לעולם התלת-ממדי — viewport, מודלים, תאורה, חומרים, תנועה ופיזיקה, מצלמה, ניווט ואנימציה. הבסיס לכל פיתוח 3D ב-Godot.",
    icon: Box,
    color: "text-indigo-400",
    chapters: [
      "מבוא ל-3D ב-Godot",
      "חומרים ותאורה",
      "תנועה ופיזיקה 3D",
      "מצלמה, ניווט ו-Raycasting",
      "אנימציה ב-3D",
    ],
  },
  {
    slug: "3d-worlds-and-systems",
    title: "עולמות ומערכות 3D",
    description:
      "CSG, GridMap, מש פרוצדורלי, אפקטים ויזואליים, פיזיקה מתקדמת וביצועים — כל מה שצריך כדי לבנות עולמות תלת-ממדיים מלאים ומורכבים.",
    icon: Hammer,
    color: "text-violet-400",
    chapters: [
      "CSG ופרוטוטייפינג",
      "GridMap ובניית שלבים",
      "מש פרוצדורלי",
      "אפקטים ויזואליים ב-3D",
      "פיזיקה מתקדמת",
      "ביצועים ואופטימיזציה 3D",
    ],
  },
  {
    slug: "3d-fps-project",
    title: "פרויקט — סייר בגוף ראשון",
    description:
      "הפרויקט הסופי — משחק FPS Explorer שלם. בקרה בגוף ראשון, בניית עולם תלת-ממדי, אינטראקציה עם עצמים, אויבים, ליטוש ופרסום.",
    icon: Crosshair,
    color: "text-sky-400",
    chapters: [
      "תכנון הפרויקט",
      "שליטה בגוף ראשון",
      "בניית עולם תלת-ממדי",
      "אינטראקציה ואויבים",
      "ליטוש ופרסום",
    ],
  },
];

/**
 * Given a flat list of chapters (sorted by order),
 * returns parts with their matching chapter objects.
 * Matches by order range (not sequential slicing) for robustness.
 */
export function groupChaptersByPart(
  chapters: Chapter[],
  overrides?: Record<string, { title?: string; description?: string }>
) {
  let startOrder = 1;

  return PARTS.map((part, partIndex) => {
    const endOrder = startOrder + part.chapters.length;
    const partChapters = chapters.filter(
      (c) => c.order >= startOrder && c.order < endOrder
    );
    startOrder = endOrder;
    const ov = overrides?.[part.slug];

    return {
      ...part,
      title: ov?.title || part.title,
      description: ov?.description || part.description,
      partNumber: partIndex + 1,
      chapters: partChapters,
    };
  });
}

/** Find a part definition by slug, with optional overrides applied */
export function getPartBySlug(
  slug: string,
  overrides?: Record<string, { title?: string; description?: string }>
): PartDef | undefined {
  const part = PARTS.find((p) => p.slug === slug);
  if (!part) return undefined;
  const ov = overrides?.[slug];
  if (!ov) return part;
  return {
    ...part,
    title: ov.title || part.title,
    description: ov.description || part.description,
  };
}

const HEBREW_LETTERS = ["א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט", "י", "יא", "יב"];

/** Get Hebrew part label like "חלק א׳" for a 1-based part number */
export function hebrewPartLabel(partNumber: number): string {
  return `חלק ${HEBREW_LETTERS[partNumber - 1] ?? partNumber}׳`;
}

/** Get the 1-based part number for a given part slug */
export function getPartNumber(slug: string): number {
  return PARTS.findIndex((p) => p.slug === slug) + 1;
}
