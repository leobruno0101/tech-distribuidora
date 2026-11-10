import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border-2 border-transparent px-3 py-1 text-xs font-bold transition-colors",
  {
    variants: {
      variant: {
        /* âmbar/preto: atenção */
        default: "bg-primary text-primary-foreground",
        /* navy/branco */
        secondary: "bg-secondary text-secondary-foreground",
        /* preto/branco */
        destructive: "bg-black text-white",
        /* cinza/navy: delta e chips neutros */
        muted: "bg-muted text-ink",
        /* borda navy, sem preenchimento (ex.: "Pendente") */
        outline: "border-ink text-ink",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
