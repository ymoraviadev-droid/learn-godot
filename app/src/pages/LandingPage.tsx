import { Link } from "react-router-dom";
import { getAllChapters } from "@/lib/content";
import {
  BookOpen,
  Gamepad2,
  Code2,
  Layers,
  Swords,
  Box,
  Sparkles,
  Globe,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";

const PARTS = [
  {
    title: "צעדים ראשונים",
    icon: BookOpen,
    color: "text-blue-400",
    chapters: [
      "מבוא",
      "התקנת סביבת הפיתוח",
      "עורך Godot",
    ],
  },
  {
    title: "מושגי יסוד",
    icon: Layers,
    color: "text-purple-400",
    chapters: [
      "Nodes וסצנות",
      "C# ב-Godot — היסודות",
      "Signals ותקשורת",
      "קלט משתמש",
    ],
  },
  {
    title: "פיתוח משחקי 2D",
    icon: Gamepad2,
    color: "text-green-400",
    chapters: [
      "Sprites וטקסטורות",
      "תנועה ופיזיקה",
      "התנגשויות",
      "TileMaps",
      "מצלמה ו-Viewport",
    ],
  },
  {
    title: "פרויקט — משחק פלטפורמה",
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
    title: "מערכות חיוניות",
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
    title: "טכניקות מתקדמות",
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
    title: "פרויקט — RPG מלמעלה",
    icon: Swords,
    color: "text-orange-400",
    chapters: [
      "הקמת הפרויקט",
      "מערכת קרב",
      "מערכות RPG",
    ],
  },
  {
    title: "יסודות 3D",
    icon: Box,
    color: "text-indigo-400",
    chapters: [
      "מבוא ל-3D ב-Godot",
      "תנועה ופיזיקה 3D",
      "פרויקט — סייר בגוף ראשון",
    ],
  },
  {
    title: "נושאים מתקדמים",
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
    title: "פרויקט גמר",
    icon: Globe,
    color: "text-emerald-400",
    chapters: [
      "תכנון המשחק שלך",
      "בנייה",
      "שיגור",
    ],
  },
];

export function LandingPage() {
  const chapters = getAllChapters();
  const firstSlug = chapters.length > 0 ? chapters[0].slug : null;

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      {/* Hero */}
      <section className="relative px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <img
            src="/images/logo.png"
            alt="Godot C# Logo"
            className="mx-auto h-32 md:h-40 lg:h-48 w-auto drop-shadow-lg"
          />

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
            למד לפתח משחקים
            <br />
            <span className="text-primary">עם Godot ו-C#</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            מדריך מקיף בעברית שלוקח אותך מאפס ועד פרסום משחק.
            <br className="hidden md:block" />
            למד על ידי בנייה — כל פרק מבוסס על הקודם, עם דוגמאות קוד ופרויקטים מעשיים.
          </p>

          {firstSlug && (
            <div className="pt-4">
              <Link
                to={`/chapter/${firstSlug}`}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-lg hover:bg-primary/90 transition-colors"
              >
                <span>התחל לקרוא</span>
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <p className="text-sm text-muted-foreground mt-3">
                {chapters.length} פרקים זמינים לקריאה
              </p>
            </div>
          )}
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce text-muted-foreground/30">
          <ChevronDown className="h-6 w-6" />
        </div>
      </section>

      {/* What you'll learn */}
      <section className="px-6 py-16 border-t border-border/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            מה תלמדו
          </h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
            המדריך מכסה את כל מה שצריך כדי לבנות משחקים דו-ממדיים ותלת-ממדיים —
            מההתקנה ועד הפרסום.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: Code2,
                title: "C# ב-Godot",
                desc: "סקריפטים, signals, input, ועוד — הכל ב-C# עם דוגמאות מעשיות",
              },
              {
                icon: Gamepad2,
                title: "משחקי 2D ו-3D",
                desc: "פיזיקה, תנועה, התנגשויות, TileMaps, מצלמה, ושליטה מלאה",
              },
              {
                icon: Swords,
                title: "פרויקטים מעשיים",
                desc: "משחק פלטפורמה, RPG מלמעלה, וסייר בגוף ראשון — מאפס עד סוף",
              },
              {
                icon: Layers,
                title: "ארכיטקטורה נכונה",
                desc: "State machines, design patterns, ניהול סצנות, ושמירה/טעינה",
              },
              {
                icon: Sparkles,
                title: "ליטוש ואפקטים",
                desc: "חלקיקים, אנימציות, אודיו, UI, ו-juice שהופך משחק לחוויה",
              },
              {
                icon: Globe,
                title: "ייצוא ופרסום",
                desc: "ייצוא ל-Windows, Linux, Web, ו-Android. פרסום ב-itch.io ו-Steam",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="p-5 rounded-xl bg-card border border-border/50 space-y-2"
              >
                <item.icon className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Full Table of Contents */}
      <section className="px-6 py-16 border-t border-border/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            תוכן עניינים
          </h2>
          <p className="text-muted-foreground text-center max-w-xl mx-auto mb-12">
            10 חלקים, 39 פרקים, ו-3 פרויקטים מעשיים.
            <br />
            כל חלק בונה על הקודם.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PARTS.map((part, i) => (
              <div
                key={part.title}
                className="p-5 rounded-xl bg-card/50 border border-border/30"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex items-center justify-center w-7 h-7 rounded-md bg-secondary text-xs font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <part.icon className={`h-4 w-4 ${part.color}`} />
                  <h3 className="font-semibold">{part.title}</h3>
                </div>
                <ul className="space-y-1 pr-10">
                  {part.chapters.map((ch) => (
                    <li
                      key={ch}
                      className="text-sm text-muted-foreground"
                    >
                      {ch}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Prerequisites */}
      <section className="px-6 py-16 border-t border-border/50">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold">דרישות קדם</h2>
          <p className="text-muted-foreground leading-relaxed">
            המדריך מניח ידע בסיסי בתכנות — משתנים, לולאות, פונקציות, ומחלקות.
            לא חייב ניסיון ב-C# או בפיתוח משחקים. הכל מוסבר מאפס.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {["Godot 4.x (.NET)", "C#", ".NET SDK", "VS Code / Rider"].map(
              (tool) => (
                <span
                  key={tool}
                  className="px-3 py-1 text-sm rounded-full bg-secondary text-muted-foreground border border-border/50"
                >
                  {tool}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      {firstSlug && (
        <section className="px-6 py-16 border-t border-border/50">
          <div className="max-w-xl mx-auto text-center space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold">מוכן להתחיל?</h2>
            <Link
              to={`/chapter/${firstSlug}`}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-lg hover:bg-primary/90 transition-colors"
            >
              <span>לפרק הראשון</span>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-border/30 text-center text-sm text-muted-foreground/60">
        <p>
          נבנה עם Godot 4, C#, ואהבה למשחקים.
        </p>
      </footer>
    </div>
  );
}
