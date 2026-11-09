import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  CheckCircle2,
  Info,
  RefreshCw,
  RotateCcw,
  Settings,
  ShieldAlert,
  Trash2,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useERP } from "@/lib/erp-store";
import type { Notificacao } from "@/lib/erp-data";
import { cn } from "@/lib/utils";

const iconeTipo: Record<Notificacao["tipo"], { icon: typeof Info; cls: string }> = {
  critico: { icon: ShieldAlert, cls: "text-danger" },
  alerta: { icon: AlertTriangle, cls: "text-warning" },
  info: { icon: Info, cls: "text-primary" },
  sucesso: { icon: CheckCircle2, cls: "text-success" },
};

function tempoRelativo(ts: number, agora: number) {
  const s = Math.max(0, Math.round((agora - ts) / 1000));
  if (s < 60) return "agora";
  const m = Math.round(s / 60);
  if (m < 60) return `há ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `há ${h} h`;
  return new Date(ts).toLocaleDateString("pt-BR");
}

function useAgora(intervalo = 5000) {
  const [agora, setAgora] = useState<number | null>(null);
  useEffect(() => {
    setAgora(Date.now());
    const id = setInterval(() => setAgora(Date.now()), intervalo);
    return () => clearInterval(id);
  }, [intervalo]);
  return agora;
}

export function SyncButton() {
  const { state, dispatch } = useERP();
  const [sincronizando, setSincronizando] = useState(false);
  const hora = state.ultimaSync
    ? new Date(state.ultimaSync).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "--:--:--";

  const sincronizar = () => {
    setSincronizando(true);
    setTimeout(() => {
      dispatch({ type: "sincronizar", agora: Date.now() });
      setSincronizando(false);
      const ativas = state.integracoes.filter((i) => i.status === "conectada").length;
      toast.success("Sincronização concluída", {
        description: `${ativas} integrações atualizadas.`,
      });
    }, 900);
  };

  return (
    <button
      type="button"
      onClick={sincronizar}
      disabled={sincronizando}
      title="Forçar sincronização com as integrações"
      className="hidden items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:inline-flex"
    >
      <RefreshCw
        className={cn(
          "h-3.5 w-3.5 animate-spin",
          sincronizando ? "[animation-duration:0.6s]" : "[animation-duration:4s]",
        )}
      />
      {sincronizando ? "Sincronizando..." : `API sincronizada ${hora}`}
    </button>
  );
}

export function NotificationBell() {
  const { state, dispatch } = useERP();
  const navigate = useNavigate();
  const [aberto, setAberto] = useState(false);
  const agora = useAgora();
  const naoLidas = state.notificacoes.filter((n) => !n.lida).length;

  const abrir = (n: Notificacao) => {
    dispatch({ type: "marcarLida", id: n.id });
    setAberto(false);
    navigate({ to: n.link });
  };

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Notificações (${naoLidas} não lidas)`}
          className="relative inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors hover:bg-accent"
        >
          <Bell className="h-4 w-4 text-muted-foreground" />
          {naoLidas > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-danger-foreground">
              {naoLidas > 9 ? "9+" : naoLidas}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notificações</p>
            <p className="text-xs text-muted-foreground">{naoLidas} não lidas</p>
          </div>
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              title="Marcar todas como lidas"
              disabled={naoLidas === 0}
              onClick={() => dispatch({ type: "marcarTodasLidas" })}
            >
              <CheckCheck />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              title="Limpar notificações"
              disabled={state.notificacoes.length === 0}
              onClick={() => dispatch({ type: "limparNotificacoes" })}
            >
              <Trash2 />
            </Button>
          </div>
        </div>
        {state.notificacoes.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhuma notificação por aqui.
          </p>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <ul className="divide-y">
              {state.notificacoes.map((n) => {
                const { icon: Icon, cls } = iconeTipo[n.tipo];
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => abrir(n)}
                      className={cn(
                        "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-accent",
                        !n.lida && "bg-primary/5",
                      )}
                    >
                      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", cls)} />
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-sm", !n.lida && "font-medium")}>{n.titulo}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{n.descricao}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {agora ? tempoRelativo(n.data, agora) : ""}
                        </p>
                      </div>
                      {!n.lida && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function UserMenu() {
  const { dispatch } = useERP();
  const navigate = useNavigate();
  const [confirmarReset, setConfirmarReset] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Menu do usuário"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            LB
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <p className="text-sm font-medium">Lucas</p>
            <p className="text-xs font-normal text-muted-foreground">Gestor de suprimentos</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => navigate({ to: "/configuracoes" })}>
            <Settings />
            Configurações
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setConfirmarReset(true)}>
            <RotateCcw />
            Restaurar dados de demonstração
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmarReset} onOpenChange={setConfirmarReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar dados de demonstração?</AlertDialogTitle>
            <AlertDialogDescription>
              Estoque, ordens de compra, configurações e notificações voltam ao estado inicial. Essa
              ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                dispatch({ type: "reset" });
                toast.success("Dados restaurados");
              }}
            >
              Restaurar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
