import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-4",
  {
    variants: {
      variant: {
        default: "border-primary/20 bg-primary/10 text-primary",
        gold: "border-gold/40 bg-gold/15 text-gold-deep",
        success: "border-mint/30 bg-mint/10 text-emerald-700",
        warn: "border-amber-500/35 bg-amber-500/10 text-amber-700",
        danger: "border-destructive/30 bg-destructive/10 text-destructive",
        outline: "border-border text-foreground",
        muted: "border-transparent bg-secondary text-secondary-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
