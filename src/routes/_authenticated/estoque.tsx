import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  MoreHorizontal,
  PackagePlus,
  Pencil,
  Search,
  ShoppingCart,
  Trash2,
  Unlock,
  Warehouse,
  X,
  Zap,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  cobertura,
  disponivel,
  quantidadeSugerida,
  statusDoEstoque,
  statusLabel,
  type Produto,
  type StockStatus,
} from "@/lib/erp-data";
import { useERP } from "@/lib/erp-store";
import { cn } from "@/lib/utils";

type EstoqueSearch = { q?: string | undefined; status?: StockStatus | undefined };

export const Route = createFileRoute("/_authenticated/estoque")({
  validateSearch: (s: Record<string, unknown>): EstoqueSearch => ({
    q: typeof s["q"] === "string" && s["q"] ? s["q"] : undefined,
    status:
      s["status"] === "saudavel" || s["status"] === "alerta" || s["status"] === "ruptura"
        ? s["status"]
        : undefined,
  }),
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Gestão de Estoque | TechDistribuidora ERP" },
      {
        name: "description",
        content: "Estoque em tempo real com ponto de pedido, estoque de segurança e reserva.",
      },
      { property: "og:title", content: "Gestão de Estoque | TechDistribuidora ERP" },
      {
        property: "og:description",
        content: "Estoque em tempo real com ponto de pedido, estoque de segurança e reserva.",
      },
    ],
  }),
  component: Estoque,
});

type Modal =
  | { tipo: "reservar"; produto: Produto }
  | { tipo: "ajustar"; produto: Produto }
  | { tipo: "editar"; produto: Produto }
  | { tipo: "novo" }
  | { tipo: "remover"; produto: Produto }
  | null;

function exportarCSV(produtos: Produto[]) {
  const cab = [
    "SKU",
    "Produto",
    "Estoque",
    "Reservado",
    "Disponivel",
    "Consumo medio (un/dia)",
    "Lead time (dias)",
    "Estoque de seguranca",
    "Ponto de pedido",
    "Status",
  ];
  const linhas = produtos.map((p) => [
    p.sku,
    p.nome,
    p.estoque,
    p.reservado,
    disponivel(p),
    p.consumoMedio,
    p.leadTime,
    p.estoqueSeguranca,
    p.pontoPedido,
    statusLabel[statusDoEstoque(p)],
  ]);
  const csv = [cab, ...linhas]
    .map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
    .join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `estoque-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function Estoque() {
  const { state, dispatch } = useERP();
  const { q = "", status } = Route.useSearch();
  const navigate = useNavigate({ from: "/estoque" });
  const [modal, setModal] = useState<Modal>(null);
  const [visao, setVisao] = useState<"quadro" | "tabela">("quadro");

  const setBusca = (valor: string) =>
    navigate({ search: (s) => ({ ...s, q: valor || undefined }), replace: true });
  const setStatus = (valor: string) =>
    navigate({
      search: (s) => ({ ...s, status: valor === "todos" ? undefined : (valor as StockStatus) }),
      replace: true,
    });

  const filtrados = state.produtos.filter(
    (p) =>
      (p.nome.toLowerCase().includes(q.toLowerCase()) ||
        p.sku.toLowerCase().includes(q.toLowerCase())) &&
      (!status || statusDoEstoque(p) === status),
  );

  const ordemAberta = (id: string) =>
    state.ordens.find(
      (o) => o.produtoId === id && (o.status === "pendente" || o.status === "aprovada"),
    );

  const gerarOrdem = (p: Produto) => {
    const qtd = quantidadeSugerida(p);
    dispatch({
      type: "criarOrdem",
      agora: Date.now(),
      ordem: { produtoId: p.id, quantidade: qtd, origem: "Solicitação manual (estoque)" },
    });
    toast.success("Ordem de compra criada", {
      description: `${p.nome} · ${qtd} un aguardando aprovação.`,
      action: { label: "Ver", onClick: () => navigate({ to: "/compras" }) },
    });
  };

  const { politica } = state;

  const menuAcoes = (p: Produto, oc: ReturnType<typeof ordemAberta>) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="outline" aria-label={`Mais ações: ${p.nome}`}>
          <MoreHorizontal aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => setModal({ tipo: "ajustar", produto: p })}>
          <Warehouse />
          Ajustar estoque
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setModal({ tipo: "editar", produto: p })}>
          <Pencil />
          Editar política
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!!oc} onSelect={() => gerarOrdem(p)}>
          <ShoppingCart />
          {oc ? "Ordem já em aberto" : "Gerar ordem de compra"}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={p.reservado === 0}
          onSelect={() => {
            dispatch({ type: "liberarReserva", produtoId: p.id });
            toast.success("Reserva liberada", {
              description: `${p.reservado} un de ${p.nome} voltaram ao disponível.`,
            });
          }}
        >
          <Unlock />
          Liberar reservas
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setModal({ tipo: "remover", produto: p })}>
          <Trash2 />
          Remover produto
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const colunas: {
    status: StockStatus;
    titulo: string;
    pill: string;
    contador: string;
  }[] = [
    {
      status: "ruptura",
      titulo: statusLabel.ruptura,
      pill: "bg-black text-white",
      contador: "bg-amber text-black",
    },
    {
      status: "alerta",
      titulo: statusLabel.alerta,
      pill: "bg-amber text-black",
      contador: "bg-black text-white",
    },
    {
      status: "saudavel",
      titulo: statusLabel.saudavel,
      pill: "bg-ink text-white",
      contador: "bg-white text-ink",
    },
  ];
  const diasTxt = (d: number) =>
    Number.isFinite(d) ? `${d.toFixed(1).replace(".", ",")} dias` : "—";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0 flex-[1_1_442px]">
          <h1 className="text-[34px] leading-none font-bold tracking-[-0.04em] sm:text-[54px]">
            Gestão de Estoque
          </h1>
          <p className="mt-3 text-[13px] text-ink/80">
            Posições atualizadas automaticamente a cada 5 segundos
            {state.automacoes.autoReserva ? " · reserva automática ativa" : ""}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SegmentedControl
            aria-label="Modo de visualização"
            value={visao}
            onChange={setVisao}
            options={[
              { value: "quadro", label: "Quadro" },
              { value: "tabela", label: "Tabela" },
            ]}
          />
          <Button
            variant="outline"
            onClick={() => {
              exportarCSV(filtrados);
              toast.success("Planilha exportada", {
                description: `${filtrados.length} produtos em CSV.`,
              });
            }}
          >
            Exportar CSV
          </Button>
          <Button onClick={() => setModal({ tipo: "novo" })}>Novo produto</Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-2.5 rounded-3xl bg-white px-4 py-3.5 sm:rounded-full sm:px-[15px]">
          <span className="text-sm font-bold">Política padrão</span>
          <span className="rounded-full bg-muted px-3.5 py-1.5 text-[11px]">
            consumo médio {politica.consumoMedio} un/dia
          </span>
          <span className="rounded-full bg-muted px-3.5 py-1.5 text-[11px]">
            lead time {politica.leadTime} dias
          </span>
          <span className="rounded-full bg-muted px-3.5 py-1.5 text-[11px]">
            estoque de segurança {politica.estoqueSeguranca} un
          </span>
          <span className="rounded-full bg-ink px-3.5 py-1.5 text-[11px] font-bold text-white">
            ponto de pedido {politica.pontoPedido} un
          </span>
          <Link to="/configuracoes" className="px-2 text-[11px] font-bold underline">
            Alterar
          </Link>
        </div>
        <div className="relative w-full sm:w-72">
          <Search
            className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-ink/70"
            aria-hidden="true"
          />
          <Input
            value={q}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar produto ou SKU..."
            aria-label="Buscar produto ou SKU"
            className="rounded-full border-0 pr-10 pl-10"
          />
          {q && (
            <button
              type="button"
              onClick={() => setBusca("")}
              aria-label="Limpar busca"
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-ink/70 hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select value={status ?? "todos"} onValueChange={setStatus}>
          <SelectTrigger className="w-52 border-0" aria-label="Filtrar por status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="saudavel">{statusLabel.saudavel}</SelectItem>
            <SelectItem value="alerta">{statusLabel.alerta}</SelectItem>
            <SelectItem value="ruptura">{statusLabel.ruptura}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {visao === "quadro" ? (
        <section className="flex flex-wrap items-start gap-5">
          {colunas
            .filter((c) => !status || c.status === status)
            .map((col) => {
              const itens = filtrados
                .filter((p) => statusDoEstoque(p) === col.status)
                .sort((a, b) => cobertura(a) - cobertura(b));
              return (
                <div
                  key={col.status}
                  className="flex min-w-0 flex-[1_1_340px] flex-col gap-3.5 rounded-card bg-white/55 p-3.5"
                >
                  <h2
                    className={cn(
                      "flex items-center justify-between rounded-full py-3 pr-3.5 pl-6 text-lg font-bold",
                      col.pill,
                    )}
                  >
                    {col.titulo}
                    <span
                      className={cn(
                        "flex h-[29px] w-[29px] items-center justify-center rounded-full text-base",
                        col.contador,
                      )}
                    >
                      {itens.length}
                    </span>
                  </h2>
                  {itens.length === 0 && (
                    <p className="px-3 pb-2 text-center text-sm text-ink/80">
                      Nenhum produto neste status.
                    </p>
                  )}
                  {itens.map((p) => {
                    const oc = ordemAberta(p.id);
                    const dias = cobertura(p);
                    const wCob = Number.isFinite(dias) ? Math.min(260, dias * 20) : 260;
                    const wLead = Math.min(260, p.leadTime * 20);
                    return (
                      <article
                        key={p.id}
                        className="flex flex-col gap-4 rounded-tile bg-white p-[19px]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="break-words text-[16px] font-bold tracking-[-0.01em]">
                              {p.nome}
                            </h3>
                            <p className="mt-0.5 text-xs text-ink/70">SKU {p.sku}</p>
                            {oc && (
                              <Link
                                to="/compras"
                                className="mt-2 inline-block rounded-full bg-black px-3 py-1 text-xs font-bold text-white"
                              >
                                {oc.id} {oc.status === "aprovada" ? "em trânsito" : "pendente"}
                              </Link>
                            )}
                          </div>
                          <div className="shrink-0 text-right">
                            <div className="text-[37px] leading-none font-bold tracking-[-0.04em]">
                              {disponivel(p)}
                            </div>
                            <div className="mt-0.5 text-xs text-ink/70">un disponíveis</div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2.5">
                          <div>
                            <div className="flex justify-between text-[11px]">
                              <span>Cobertura</span>
                              <span className="font-bold">{diasTxt(dias)}</span>
                            </div>
                            <svg
                              width="100%"
                              height="10"
                              viewBox="0 0 260 10"
                              preserveAspectRatio="none"
                              role="img"
                              aria-label={`Cobertura de ${diasTxt(dias)}`}
                              className="mt-1 block"
                            >
                              <rect width="260" height="10" rx="5" fill="#E5E5E5" />
                              <rect
                                x="0.75"
                                y="0.75"
                                width={Math.max(wCob - 1.5, 0)}
                                height="8.5"
                                rx="4.25"
                                fill="#FCA311"
                                stroke="#14213D"
                                strokeWidth="1.5"
                              />
                            </svg>
                          </div>
                          <div>
                            <div className="flex justify-between text-[11px]">
                              <span>Lead time</span>
                              <span className="font-bold">{p.leadTime} dias</span>
                            </div>
                            <svg
                              width="100%"
                              height="10"
                              viewBox="0 0 260 10"
                              preserveAspectRatio="none"
                              role="img"
                              aria-label={`Lead time de ${p.leadTime} dias`}
                              className="mt-1 block"
                            >
                              <rect width="260" height="10" rx="5" fill="#E5E5E5" />
                              <rect width={wLead} height="10" rx="5" fill="#14213D" />
                            </svg>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-ink/80">
                          <span>
                            Estoque <b className="text-ink">{p.estoque}</b>
                          </span>
                          <span>
                            Reservado <b className="text-ink">{p.reservado}</b>
                          </span>
                          <span>
                            Consumo <b className="text-ink">{p.consumoMedio} un/dia</b>
                          </span>
                          <span>
                            Segurança <b className="text-ink">{p.estoqueSeguranca}</b>
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="navy"
                            className="flex-1"
                            disabled={disponivel(p) === 0}
                            onClick={() => setModal({ tipo: "reservar", produto: p })}
                          >
                            Reservar
                          </Button>
                          {menuAcoes(p, oc)}
                        </div>
                      </article>
                    );
                  })}
                </div>
              );
            })}
          {filtrados.length === 0 && (
            <p className="w-full rounded-card-md bg-white py-10 text-center text-ink/80">
              Nenhum produto encontrado com esses filtros.
            </p>
          )}
        </section>
      ) : (
        <div className="overflow-x-auto rounded-card bg-white p-4 sm:p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[170px] text-[11px] text-ink/70">Produto</TableHead>
                <TableHead className="text-right text-[11px] text-ink/70">Estoque</TableHead>
                <TableHead className="text-right text-[11px] text-ink/70">Reservado</TableHead>
                <TableHead className="text-right text-[11px] text-ink/70">Disponível</TableHead>
                <TableHead className="text-right text-[11px] text-ink/70">Consumo Médio</TableHead>
                <TableHead className="text-right text-[11px] text-ink/70">Lead Time</TableHead>
                <TableHead className="text-right text-[11px] text-ink/70">Est. Segurança</TableHead>
                <TableHead className="text-right text-[11px] text-ink/70">Cobertura</TableHead>
                <TableHead className="text-[11px] text-ink/70">Status</TableHead>
                <TableHead className="text-right text-[11px] text-ink/70">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="py-10 text-center text-ink/80">
                    Nenhum produto encontrado com esses filtros.
                  </TableCell>
                </TableRow>
              )}
              {filtrados.map((p) => {
                const oc = ordemAberta(p.id);
                const dias = cobertura(p);
                return (
                  <TableRow key={p.id} className="border-t border-muted">
                    <TableCell>
                      <p className="font-bold">{p.nome}</p>
                      <p className="text-xs text-ink/70">
                        SKU {p.sku}
                        {oc && (
                          <>
                            {" · "}
                            <Link to="/compras" className="font-bold underline">
                              {oc.id} {oc.status === "aprovada" ? "em trânsito" : "pendente"}
                            </Link>
                          </>
                        )}
                      </p>
                    </TableCell>
                    <TableCell className="text-right font-bold tabular-nums">
                      {p.estoque} un
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-ink/80">
                      {p.reservado} un
                    </TableCell>
                    <TableCell className="text-right font-bold tabular-nums">
                      {disponivel(p)} un
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.consumoMedio} un/dia
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{p.leadTime} dias</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.estoqueSeguranca} un
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right tabular-nums",
                        dias < p.leadTime && "font-bold underline",
                      )}
                    >
                      {diasTxt(dias)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={statusDoEstoque(p)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="navy"
                          disabled={disponivel(p) === 0}
                          onClick={() => setModal({ tipo: "reservar", produto: p })}
                        >
                          Reservar
                        </Button>
                        {menuAcoes(p, oc)}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <ReservarDialog modal={modal} onClose={() => setModal(null)} />
      <AjustarDialog modal={modal} onClose={() => setModal(null)} />
      <ProdutoDialog modal={modal} onClose={() => setModal(null)} />

      <AlertDialog open={modal?.tipo === "remover"} onOpenChange={(o) => !o && setModal(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remover {modal?.tipo === "remover" ? modal.produto.nome : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              O produto deixa de ser monitorado e suas ordens de compra em aberto são canceladas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (modal?.tipo !== "remover") return;
                dispatch({ type: "removerProduto", produtoId: modal.produto.id });
                toast.success("Produto removido", { description: modal.produto.nome });
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function inteiro(v: string) {
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? Math.round(n) : NaN;
}

function ReservarDialog({ modal, onClose }: { modal: Modal; onClose: () => void }) {
  const { dispatch } = useERP();
  const aberto = modal?.tipo === "reservar";
  const p = aberto ? modal.produto : null;
  const [qtd, setQtd] = useState("10");
  const max = p ? disponivel(p) : 0;
  const n = inteiro(qtd);
  const valido = n > 0 && n <= max;

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (!p || !valido) return;
    dispatch({ type: "reservar", produtoId: p.id, quantidade: n });
    toast.success("Reserva criada", {
      description: `${n} un de ${p.nome} reservadas para pedidos em aberto.`,
    });
    onClose();
  };

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <form onSubmit={enviar}>
          <DialogHeader>
            <DialogTitle>Reservar estoque</DialogTitle>
            <DialogDescription>
              {p?.nome} · {max} un disponíveis para reserva.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4 space-y-2">
            <Label htmlFor="qtd-reserva">Quantidade (un)</Label>
            <Input
              id="qtd-reserva"
              inputMode="numeric"
              value={qtd}
              onChange={(e) => setQtd(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2">
              {[5, 10, 25].map((v) => (
                <Button
                  key={v}
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={v > max}
                  onClick={() => setQtd(String(v))}
                >
                  {v} un
                </Button>
              ))}
            </div>
            {!valido && qtd !== "" && (
              <p className="text-xs font-medium">Informe um valor entre 1 e {max}.</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!valido}>
              <Zap />
              Reservar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AjustarDialog({ modal, onClose }: { modal: Modal; onClose: () => void }) {
  const { dispatch } = useERP();
  const aberto = modal?.tipo === "ajustar";
  const p = aberto ? modal.produto : null;
  const [tipo, setTipo] = useState<"entrada" | "saida">("entrada");
  const [qtd, setQtd] = useState("");
  const [motivo, setMotivo] = useState("Inventário");
  const n = inteiro(qtd);
  const valido = n > 0 && (tipo === "entrada" || (p ? n <= p.estoque : false));

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (!p || !valido) return;
    dispatch({
      type: "ajustarEstoque",
      produtoId: p.id,
      quantidade: tipo === "entrada" ? n : -n,
    });
    toast.success("Estoque ajustado", {
      description: `${tipo === "entrada" ? "+" : "-"}${n} un · ${p.nome} (${motivo}).`,
    });
    setQtd("");
    onClose();
  };

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <form onSubmit={enviar}>
          <DialogHeader>
            <DialogTitle>Ajustar estoque</DialogTitle>
            <DialogDescription>
              {p?.nome} · estoque atual {p?.estoque} un.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Movimento</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as "entrada" | "saida")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada (+)</SelectItem>
                  <SelectItem value="saida">Saída (−)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="qtd-ajuste">Quantidade (un)</Label>
              <Input
                id="qtd-ajuste"
                inputMode="numeric"
                value={qtd}
                onChange={(e) => setQtd(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Motivo</Label>
              <Select value={motivo} onValueChange={setMotivo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inventário">Inventário</SelectItem>
                  <SelectItem value="Avaria">Avaria</SelectItem>
                  <SelectItem value="Devolução de cliente">Devolução de cliente</SelectItem>
                  <SelectItem value="Transferência entre CDs">Transferência entre CDs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!valido}>
              Confirmar ajuste
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type CamposProduto = {
  nome: string;
  sku: string;
  fornecedor: string;
  estoque: string;
  custoUnitario: string;
  consumoMedio: string;
  leadTime: string;
  estoqueSeguranca: string;
  pontoPedido: string;
};

function ProdutoDialog({ modal, onClose }: { modal: Modal; onClose: () => void }) {
  const { state, dispatch } = useERP();
  const aberto = modal?.tipo === "novo" || modal?.tipo === "editar";
  const editando = modal?.tipo === "editar" ? modal.produto : null;
  const [campos, setCampos] = useState<CamposProduto | null>(null);
  const [chave, setChave] = useState<string | null>(null);

  // Reinicia o formulário sempre que o diálogo abre para um alvo diferente.
  const chaveAtual = aberto ? (editando?.id ?? "novo") : null;
  if (chaveAtual !== chave) {
    setChave(chaveAtual);
    const base = editando ?? {
      ...state.politica,
      nome: "",
      sku: "",
      fornecedor: "",
      estoque: 0,
      custoUnitario: 0,
    };
    setCampos(
      chaveAtual
        ? {
            nome: base.nome,
            sku: base.sku,
            fornecedor: base.fornecedor,
            estoque: String(base.estoque),
            custoUnitario: String(base.custoUnitario || ""),
            consumoMedio: String(base.consumoMedio),
            leadTime: String(base.leadTime),
            estoqueSeguranca: String(base.estoqueSeguranca),
            pontoPedido: String(base.pontoPedido),
          }
        : null,
    );
  }

  if (!campos) return null;

  const set = (k: keyof CamposProduto) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setCampos({ ...campos, [k]: e.target.value });

  const num = (v: string) => Number(v.replace(",", "."));
  const numericos = [
    "estoque",
    "custoUnitario",
    "consumoMedio",
    "leadTime",
    "estoqueSeguranca",
    "pontoPedido",
  ] as const;
  const invalidos = numericos.filter((k) => !(num(campos[k]) >= 0) || campos[k] === "");
  const valido = campos.nome.trim() && campos.sku.trim() && invalidos.length === 0;

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (!valido) return;
    const dados = {
      nome: campos.nome.trim(),
      sku: campos.sku.trim().toUpperCase(),
      fornecedor: campos.fornecedor.trim() || "A definir",
      estoque: Math.round(num(campos.estoque)),
      custoUnitario: num(campos.custoUnitario),
      consumoMedio: num(campos.consumoMedio),
      leadTime: Math.round(num(campos.leadTime)),
      estoqueSeguranca: Math.round(num(campos.estoqueSeguranca)),
      pontoPedido: Math.round(num(campos.pontoPedido)),
    };
    if (editando) {
      dispatch({ type: "atualizarProduto", produtoId: editando.id, dados });
      toast.success("Produto atualizado", { description: dados.nome });
    } else {
      dispatch({ type: "adicionarProduto", produto: dados });
      toast.success("Produto cadastrado", {
        description: `${dados.nome} agora é monitorado em tempo real.`,
      });
    }
    onClose();
  };

  const campo = (
    k: keyof CamposProduto,
    label: string,
    extra?: { colSpan?: boolean; numeric?: boolean },
  ) => (
    <div className={"space-y-1.5 " + (extra?.colSpan ? "sm:col-span-2" : "")}>
      <Label htmlFor={`prod-${k}`}>{label}</Label>
      <Input
        id={`prod-${k}`}
        value={campos[k]}
        onChange={set(k)}
        inputMode={extra?.numeric ? "decimal" : undefined}
        aria-invalid={invalidos.includes(k as (typeof numericos)[number])}
      />
    </div>
  );

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={enviar}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackagePlus className="h-5 w-5" aria-hidden="true" />
              {editando ? "Editar produto e política" : "Novo produto"}
            </DialogTitle>
            <DialogDescription>
              {editando
                ? "Altere os parâmetros de reposição deste produto."
                : "Os parâmetros de reposição vêm da política padrão e podem ser ajustados."}
            </DialogDescription>
          </DialogHeader>
          <div className="my-4 grid gap-3 sm:grid-cols-2">
            {campo("nome", "Nome do produto", { colSpan: true })}
            {campo("sku", "SKU")}
            {campo("fornecedor", "Fornecedor")}
            {!editando && campo("estoque", "Estoque inicial (un)", { numeric: true })}
            {campo("custoUnitario", "Custo unitário (R$)", { numeric: true })}
            {campo("consumoMedio", "Consumo médio (un/dia)", { numeric: true })}
            {campo("leadTime", "Lead time (dias)", { numeric: true })}
            {campo("estoqueSeguranca", "Estoque de segurança (un)", { numeric: true })}
            {campo("pontoPedido", "Ponto de pedido (un)", { numeric: true })}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!valido}>
              {editando ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
