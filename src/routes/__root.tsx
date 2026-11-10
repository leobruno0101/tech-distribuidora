import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  useNavigate,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppDock } from "@/components/app-dock";
import { NotificationBell, SyncButton, UserMenu } from "@/components/app-header";
import { ERPProvider } from "@/lib/erp-store";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          O endereço acessado não existe ou foi movido.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Esta página não carregou
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Algo deu errado. Tente novamente ou volte ao início.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Ir para o início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "TechDistribuidora ERP" },
      {
        name: "description",
        content: "ERP de estoque, compras e previsão com IA da TechDistribuidora.",
      },
      { property: "og:title", content: "TechDistribuidora ERP" },
      {
        property: "og:description",
        content: "ERP de estoque, compras e previsão com IA da TechDistribuidora.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function GlobalSearch() {
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (!busca.trim()) return;
    navigate({ to: "/estoque", search: { q: busca.trim() } });
    setBusca("");
  };

  return (
    <form onSubmit={enviar} className="relative hidden md:block">
      <Search
        className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-ink/70"
        aria-hidden="true"
      />
      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar produto ou SKU..."
        aria-label="Busca global"
        className="h-11 w-56 rounded-full bg-white pr-4 pl-10 text-sm text-ink placeholder:text-ink/70 lg:w-72"
      />
    </form>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ERPProvider>
        <div className="flex min-h-screen w-full flex-col">
          <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 pt-7 pb-2 sm:px-10">
            <Link to="/" className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-ink">
                <svg width="22" height="22" viewBox="0 0 28 28" aria-hidden="true">
                  <path
                    d="M14 2 L16.2 11.8 L26 14 L16.2 16.2 L14 26 L11.8 16.2 L2 14 L11.8 11.8 Z"
                    fill="#FCA311"
                  />
                </svg>
              </span>
              <span className="text-lg font-bold text-ink">
                TechDistribuidora <span className="font-normal text-ink/70">ERP Inteligente</span>
              </span>
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <GlobalSearch />
              <SyncButton />
              <NotificationBell />
              <UserMenu />
            </div>
          </header>
          {/* Required: nested routes render here. */}
          <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 pt-4 pb-6 sm:px-10">
            <Outlet />
          </main>
          <AppDock />
        </div>
        <Toaster />
      </ERPProvider>
    </QueryClientProvider>
  );
}
