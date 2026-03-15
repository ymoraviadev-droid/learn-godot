import { useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getStoredTheme, setStoredTheme } from "@/lib/theme";

const THEME_CYCLE = ["light", "dark", "system"] as const;

const THEME_ICONS = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const;

const THEME_LABELS = {
  light: "מצב בהיר",
  dark: "מצב כהה",
  system: "לפי המערכת",
} as const;

export function ThemeToggle() {
  const [theme, setTheme] = useState(getStoredTheme);

  const cycleTheme = () => {
    const currentIndex = THEME_CYCLE.indexOf(theme);
    const nextTheme = THEME_CYCLE[(currentIndex + 1) % THEME_CYCLE.length];
    setTheme(nextTheme);
    setStoredTheme(nextTheme);
  };

  const Icon = THEME_ICONS[theme];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-sm" onClick={cycleTheme}>
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{THEME_LABELS[theme]}</TooltipContent>
    </Tooltip>
  );
}
