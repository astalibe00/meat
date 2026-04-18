import { cn } from "@/lib/utils";
import type { Tag } from "@/data/products";

const TAG_STYLES: Record<Tag | "Halal" | "Save", string> = {
  Halal: "bg-primary text-primary-foreground",
  Sale: "bg-sale text-destructive-foreground",
  Save: "bg-sale/10 text-sale",
  Popular: "bg-foreground/90 text-background",
  Premium: "bg-gold/15 text-gold",
  Fresh: "bg-primary-soft text-primary-soft-foreground",
  "Best Value": "bg-primary/10 text-primary",
  Traditional: "bg-paper text-foreground",
  "Wild Caught": "bg-primary-soft text-primary-soft-foreground",
  "Best Deal": "bg-sale text-destructive-foreground",
};

interface Props {
  label: string;
  variant?: keyof typeof TAG_STYLES;
  className?: string;
}

export function ProductBadge({ label, variant, className }: Props) {
  const style = TAG_STYLES[(variant ?? label) as keyof typeof TAG_STYLES] ?? "bg-paper text-foreground";
  return <span className={cn("chip", style, className)}>{label}</span>;
}
