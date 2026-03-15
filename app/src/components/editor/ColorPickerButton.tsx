import { useRef } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

interface ColorPickerButtonProps {
  icon: ReactNode;
  label: string;
  currentColor?: string;
  onChange: (color: string) => void;
}

export function ColorPickerButton({
  icon,
  label,
  currentColor = "#000000",
  onChange,
}: ColorPickerButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative"
          onClick={() => inputRef.current?.click()}
        >
          {icon}
          <div
            className="absolute bottom-0.5 left-1 right-1 h-1 rounded-full"
            style={{ backgroundColor: currentColor }}
          />
          <input
            ref={inputRef}
            type="color"
            value={currentColor}
            onChange={(e) => onChange(e.target.value)}
            className="sr-only"
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}
