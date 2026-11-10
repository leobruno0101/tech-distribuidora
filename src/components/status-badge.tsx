import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import type { StockStatus } from "@/lib/erp-data";
import { statusLabel } from "@/lib/erp-data";
import { cn } from "@/lib/utils";

// Sem verde/vermelho na paleta: ruptura = preto, alerta = âmbar, saudável = navy (sempre com texto).
const styles: Record<StockStatus, string> = {
  saudavel: "bg-ink text-white",
  alerta: "bg-amber text-black",
  ruptura: "bg-black text-white",
};

const icons: Record<StockStatus, typeof CheckCircle2> = {
  saudavel: CheckCircle2,
  alerta: AlertTriangle,
  ruptura: ShieldAlert,
};

export function StatusBadge({ status, className }: { status: StockStatus; className?: string }) {
  const Icon = icons[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap",
        styles[status],
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {statusLabel[status]}
    </span>
  );
}
