import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  eyebrow?: string;
  onSeeAll?: () => void;
  className?: string;
  inline?: boolean;
}

export function SectionHeader({ title, eyebrow, onSeeAll, className, inline }: Props) {
  return (
    <div className={cn("flex items-end justify-between mb-3", !inline && "px-5", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-primary mb-0.5">
            {eyebrow}
          </p>
        )}
        <h2 className="font-serif text-[22px] leading-[1.05] font-semibold text-foreground tracking-tight">
          {title}
        </h2>
      </div>
      {onSeeAll && (
        <button
          onClick={onSeeAll}
          className="tap shrink-0 flex items-center text-xs font-semibold text-foreground/70 hover:text-primary active:scale-95 transition-all"
        >
          See all <ChevronRight className="w-3.5 h-3.5 -mr-1" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
