import { Link } from "react-router-dom";
import { getAllChapters, getPartsOverrides } from "@/lib/content";
import { PARTS, groupChaptersByPart } from "@/lib/parts";
import {
  Code2,
  Gamepad2,
  Layers,
  Swords,
  Sparkles,
  Globe,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";

export function LandingPage() {
  const chapters = getAllChapters();
  const firstSlug = chapters.length > 0 ? chapters[0].slug : null;
  const overrides = getPartsOverrides();
  const grouped = groupChaptersByPart(chapters, overrides);

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
            12 חלקים, 52 פרקים, ו-4 פרויקטים מעשיים.
            <br />
            כל חלק בונה על הקודם.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {grouped.map((partGroup, i) => {
              const hasChapters = partGroup.chapters.length > 0;
              const PartIcon = partGroup.icon;

              return (
                <div
                  key={partGroup.slug}
                  className="p-5 rounded-xl bg-card/50 border border-border/30"
                >
                  <Link
                    to={`/part/${partGroup.slug}`}
                    className="flex items-center gap-3 mb-3 group"
                  >
                    <span className="flex items-center justify-center w-7 h-7 rounded-md bg-secondary text-xs font-bold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      {i + 1}
                    </span>
                    <PartIcon className={`h-4 w-4 ${partGroup.color}`} />
                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                      {partGroup.title}
                    </h3>
                  </Link>

                  <ul className="space-y-1 pr-10">
                    {PARTS[i].chapters.map((ch, chIdx) => {
                      const chapterObj =
                        hasChapters && partGroup.chapters[chIdx];

                      return chapterObj ? (
                        <li key={ch}>
                          <Link
                            to={`/chapter/${chapterObj.slug}`}
                            className="text-sm text-muted-foreground hover:text-primary transition-colors"
                          >
                            {ch}
                          </Link>
                        </li>
                      ) : (
                        <li
                          key={ch}
                          className="text-sm text-muted-foreground/50"
                        >
                          {ch}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
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
