import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: { btn: "w-7 h-7", icon: "w-3.5 h-3.5", text: "text-sm w-5", gap: "gap-1.5" },
  md: { btn: "w-8 h-8", icon: "w-4 h-4", text: "text-sm w-6", gap: "gap-2" },
  lg: { btn: "w-10 h-10", icon: "w-4 h-4", text: "text-base w-7", gap: "gap-2.5" },
};

export function QtyStepper({ value, onChange, min = 0, max = 99, size = "md", className }: Props) {
  const s = SIZES[size];
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  return (
    <div className={cn("inline-flex items-center bg-paper rounded-full p-0.5", s.gap, className)}>
      <button
        onClick={(e) => { e.stopPropagation(); dec(); }}
        disabled={value <= min}
        aria-label="Kamaytirish"
        className={cn(
          "tap rounded-full bg-surface grid place-items-center shadow-xs active:scale-90 transition-transform disabled:opacity-40",
          s.btn
        )}
      >
        <Minus className={s.icon} strokeWidth={2.5} />
      </button>
      <span className={cn("font-bold text-center tabular-nums", s.text)}>{value}</span>
      <button
        onClick={(e) => { e.stopPropagation(); inc(); }}
        disabled={value >= max}
        aria-label="Ko'paytirish"
        className={cn(
          "tap rounded-full bg-primary text-primary-foreground grid place-items-center shadow-xs active:scale-90 transition-transform disabled:opacity-40",
          s.btn
        )}
      >
        <Plus className={s.icon} strokeWidth={2.5} />
      </button>
    </div>
  );
}
