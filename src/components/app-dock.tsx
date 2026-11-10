import { Link, useRouterState } from "@tanstack/react-router";
import { ClipboardList, LayoutGrid, Package, SlidersHorizontal, Sparkles, ShoppingCart } from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
  { title: "Visão Geral", url: "/", icon: LayoutGrid },
  { title: "Gestão de Estoque", url: "/estoque", icon: Package },
  { title: "Ordens de Compra", url: "/compras", icon: ClipboardList },
  { title: "Módulo de IA", url: "/ia", icon: Sparkles },
  { title: "Vendas", url: "/vendas", icon: ShoppingCart },
  { title: "Configurações", url: "/configuracoes", icon: SlidersHorizontal },
] as const;

export function AppDock() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  return (
    <div className="pointer-events-none sticky bottom-5 z-20 flex justify-center px-4 pt-3 pb-5">
      <nav
        aria-label="Principal"
        className="pointer-events-auto flex flex-wrap justify-center gap-1 rounded-full bg-black p-1.5 shadow-[0_14px_40px_rgba(0,0,0,0.3)]"
      >
        {items.map((item) => {
          const ativo = pathname === item.url;
          return (
            <Link
              key={item.url}
              to={item.url}
              aria-current={ativo ? "page" : undefined}
              className={cn(
                "inline-flex min-h-10 items-center gap-2 rounded-full px-5 py-3 text-sm transition-colors",
                ativo
                  ? "bg-amber font-bold text-black"
                  : "font-medium text-white hover:bg-white/15",
              )}
            >
              <item.icon className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
