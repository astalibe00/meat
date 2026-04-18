import { cn } from "@/lib/utils";
import { Truck } from "lucide-react";
import { FREE_SHIPPING_THRESHOLD } from "@/data/products";

interface Props {
  subtotal: number;
  className?: string;
  variant?: "card" | "inline";
}

export function FreeShipBar({ subtotal, className, variant = "card" }: Props) {
  const freeShip = subtotal >= FREE_SHIPPING_THRESHOLD;
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  if (variant === "inline") {
    return (
      <div className={cn("space-y-1.5", className)}>
        <div className="flex items-center gap-2 text-xs">
          <Truck className="w-3.5 h-3.5 text-primary shrink-0" strokeWidth={2.5} />
          <span className="font-semibold text-foreground/80">
            {freeShip ? "Free delivery unlocked" : `$${remaining.toFixed(2)} to free delivery`}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-paper overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl bg-primary-soft p-4 shadow-xs", className)}>
      <div className="flex items-center gap-2 mb-2.5">
        <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground grid place-items-center shrink-0">
          <Truck className="w-3.5 h-3.5" strokeWidth={2.5} />
        </span>
        <p className="text-[13px] font-semibold text-primary-soft-foreground flex-1 leading-tight">
          {freeShip ? (
            <>You unlocked <span className="font-bold">FREE</span> delivery</>
          ) : (
            <>Add <span className="font-bold tabular-nums">${remaining.toFixed(2)}</span> more for free delivery</>
          )}
        </p>
      </div>
      <div className="h-2 rounded-full bg-surface/70 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
