import { cn } from "@/lib/utils";

interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  "aria-label": string;
  /** "light": trilha branca, ativo navy · "dark": trilha navy/preta, ativo âmbar */
  tone?: "light" | "dark";
  className?: string;
}

/** Controle segmentado em pílula (botões com aria-pressed). */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  tone = "light",
  className,
  ...rest
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={rest["aria-label"]}
      className={cn(
        "inline-flex items-center gap-1 rounded-full p-1.5",
        tone === "light" ? "bg-white" : "bg-ink",
        className,
      )}
    >
      {options.map((o) => {
        const ativo = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={ativo}
            onClick={() => onChange(o.value)}
            className={cn(
              "min-h-10 rounded-full px-4 py-2 text-sm transition-colors",
              tone === "light"
                ? ativo
                  ? "bg-ink font-bold text-white"
                  : "font-medium text-ink hover:bg-ink/10"
                : ativo
                  ? "bg-amber font-bold text-black"
                  : "font-medium text-white hover:bg-white/15",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
