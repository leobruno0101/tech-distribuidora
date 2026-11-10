import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface RingGaugeProps {
  /** 0–100 */
  percent: number;
  size?: number;
  stroke?: number;
  /** raio do círculo (padrão: derivado de size/stroke) */
  r?: number;
  label: string;
  /** conteúdo central (ex.: percentual) */
  children?: ReactNode;
  className?: string;
  trackClassName?: string;
  arcClassName?: string;
}

/** Anel de progresso: dois círculos concêntricos, rotacionado -90°.
 *  Comprimento do arco = percentual/100 × 2πr. */
export function RingGauge({
  percent,
  size = 124,
  stroke = 14,
  r,
  label,
  children,
  className,
  trackClassName = "stroke-muted",
  arcClassName = "stroke-ink",
}: RingGaugeProps) {
  const raio = r ?? (size - stroke) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * raio;
  const p = Math.min(100, Math.max(0, percent));
  return (
    <div className={cn("relative inline-flex shrink-0", className)} style={{ width: size, height: size }}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        role="img"
        aria-label={label}
        className="-rotate-90"
      >
        <circle cx={c} cy={c} r={raio} fill="none" strokeWidth={stroke} className={trackClassName} />
        <circle
          cx={c}
          cy={c}
          r={raio}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(p / 100) * circ} ${circ}`}
          className={arcClassName}
        />
      </svg>
      {children && (
        <span className="absolute inset-0 flex items-center justify-center text-[17px] font-bold">
          {children}
        </span>
      )}
    </div>
  );
}
