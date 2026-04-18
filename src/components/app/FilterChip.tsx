import { cn } from "@/lib/utils";

interface Props {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  count?: number;
}

export function FilterChip({ active, onClick, children, className, count }: Props) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "tap shrink-0 inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full text-xs font-semibold border transition-all active:scale-95",
        active
          ? "bg-foreground text-background border-foreground"
          : "bg-surface text-foreground/70 border-border hover:border-foreground/30",
        className
      )}
    >
      {children}
      {typeof count === "number" && (
        <span className={cn("text-[10px] tabular-nums", active ? "text-background/70" : "text-muted-foreground")}>
          {count}
        </span>
      )}
    </button>
  );
}
