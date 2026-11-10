import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

/* 60×34. Ligado: trilha âmbar + bolinha preta de 26px à direita.
   Desligado: trilha branca com borda navy 2px + bolinha navy de 24px à esquerda. */
const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-[34px] w-[60px] shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-amber data-[state=checked]:bg-amber data-[state=unchecked]:border-ink data-[state=unchecked]:bg-white",
      className,
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb className="pointer-events-none block rounded-full transition-transform data-[state=checked]:h-[26px] data-[state=checked]:w-[26px] data-[state=checked]:translate-x-[27px] data-[state=checked]:bg-black data-[state=unchecked]:h-6 data-[state=unchecked]:w-6 data-[state=unchecked]:translate-x-[3px] data-[state=unchecked]:bg-ink" />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
