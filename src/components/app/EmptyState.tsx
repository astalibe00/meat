import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface Props {
  icon: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, body, action, className }: Props) {
  return (
    <div className={cn("flex flex-col items-center text-center px-8 py-12", className)}>
      <div className="w-20 h-20 rounded-full bg-primary-soft text-primary grid place-items-center mb-5">
        {icon}
      </div>
      <h3 className="font-serif text-xl font-semibold mb-1.5 text-foreground">{title}</h3>
      {body && <p className="text-sm text-muted-foreground max-w-[260px] leading-relaxed">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
