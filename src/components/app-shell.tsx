import { Link, Outlet, useNavigate } from '@tanstack/react-router';
import { Search } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { AppDock } from '@/components/app-dock';
import { NotificationBell, SyncButton, UserMenu } from '@/components/app-header';
import { ERPProvider } from '@/lib/erp-store';
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

export function AppShell() {

  return (
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

      </ERPProvider>

  );
}
