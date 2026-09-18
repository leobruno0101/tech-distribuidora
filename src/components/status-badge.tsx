import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import type { StockStatus } from "@/lib/erp-data";
import { statusLabel } from "@/lib/erp-data";
import { cn } from "@/lib/utils";

const styles: Record<StockStatus, string> = {
  saudavel: "bg-success-soft text-success border-success/30",
  alerta: "bg-warning-soft text-warning-foreground border-warning/40",
  ruptura: "bg-danger-soft text-danger border-danger/30",
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
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        styles[status],
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {statusLabel[status]}
    </span>
  );
}
