import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-bold cursor-pointer transition-colors disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /* âmbar com texto preto: ação principal */
        default: "bg-primary text-primary-foreground hover:bg-primary/85",
        primary: "bg-primary text-primary-foreground hover:bg-primary/85",
        /* preto com texto branco */
        dark: "bg-black text-white hover:bg-black/80",
        /* navy com texto branco */
        navy: "bg-ink text-white hover:bg-ink/85",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/85",
        /* a paleta não tem vermelho: ação destrutiva usa preto */
        destructive: "bg-destructive text-destructive-foreground hover:bg-black/80",
        outline: "border-2 border-ink bg-transparent text-ink hover:bg-ink/10",
        "outline-on-dark": "border-2 border-white bg-transparent text-white hover:bg-white/15",
        ghost: "text-ink hover:bg-ink/10",
        link: "text-ink underline underline-offset-4 hover:no-underline",
      },
      size: {
        default: "min-h-11 px-6 py-2.5 text-sm",
        sm: "min-h-10 px-4 py-2 text-[13px]",
        lg: "min-h-12 px-8 py-3.5 text-base",
        icon: "h-11 w-11 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
