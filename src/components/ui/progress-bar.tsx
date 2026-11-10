import { cn } from "@/lib/utils";

interface ProgressBarProps {
  /** 0–100 */
  percent: number;
  /** largura em px (padrão: 100%) */
  width?: number;
  height?: number;
  label?: string;
  /** "navy": preenchimento navy · "amber": âmbar com contorno navy (cobertura) */
  tone?: "navy" | "amber";
  className?: string;
}

/** Barra em SVG: trilha cinza e preenchimento arredondado (rx = metade da altura). */
export function ProgressBar({
  percent,
  width,
  height = 8,
  label,
  tone = "navy",
  className,
}: ProgressBarProps) {
  const W = 260;
  const p = Math.min(100, Math.max(0, percent));
  const fill = (p / 100) * W;
  const rx = height / 2;
  return (
    <svg
      viewBox={`0 0 ${W} ${height}`}
      preserveAspectRatio="none"
      width={width ?? "100%"}
      height={height}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("block", className)}
    >
      <rect width={W} height={height} rx={rx} className="fill-muted" />
      {fill > 0 &&
        (tone === "amber" ? (
          <rect
            x={0.75}
            y={0.75}
            width={Math.max(fill - 1.5, 0)}
            height={height - 1.5}
            rx={rx}
            className="fill-amber stroke-ink"
            strokeWidth={1.5}
          />
        ) : (
          <rect width={fill} height={height} rx={rx} className="fill-ink" />
        ))}
    </svg>
  );
}
