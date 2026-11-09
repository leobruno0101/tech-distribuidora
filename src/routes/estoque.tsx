import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  Download,
  MoreHorizontal,
  PackagePlus,
  Pencil,
  Plus,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

type EstoqueSearch = { q?: string | undefined; status?: StockStatus | undefined };

export const Route = createFileRoute("/estoque")({
  validateSearch: (s: Record<string, unknown>): EstoqueSearch => ({
    q: typeof s["q"] === "string" && s["q"] ? s["q"] : undefined,
    status:
      s["status"] === "saudavel" || s["status"] === "alerta" || s["status"] === "ruptura"
        ? s["status"]
        : undefined,
  }),
  head: () => ({
    meta: [
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

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Gestão de Estoque</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Política padrão: consumo médio {politica.consumoMedio} un/dia · lead time{" "}
            {politica.leadTime} dias · estoque de segurança {politica.estoqueSeguranca} un · ponto
            de pedido {politica.pontoPedido} un.{" "}
            <Link to="/configuracoes" className="text-primary hover:underline">
              Alterar
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => {
              exportarCSV(filtrados);
              toast.success("Planilha exportada", {
                description: `${filtrados.length} produtos em CSV.`,
              });
            }}
          >
            <Download />
            Exportar CSV
          </Button>
          <Button onClick={() => setModal({ tipo: "novo" })}>
            <Plus />
            Novo produto
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {(["saudavel", "alerta", "ruptura"] as StockStatus[]).map((s) => {
          const n = state.produtos.filter((p) => statusDoEstoque(p) === s).length;
          const ativo = status === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(ativo ? "todos" : s)}
              className={
                "flex items-center justify-between rounded-xl border bg-card p-4 text-left transition-all hover:shadow-md " +
                (ativo ? "border-primary/60 ring-2 ring-primary/20" : "")
              }
            >
              <StatusBadge status={s} />
              <span className="text-2xl font-semibold tabular-nums">{n}</span>
            </button>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle>Produtos monitorados</CardTitle>
            <CardDescription className="mt-1">
              Posições atualizadas automaticamente a cada 5 segundos
              {state.automacoes.autoReserva ? " · reserva automática ativa" : ""}.
            </CardDescription>
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar produto ou SKU..."
                className="pr-8 pl-9"
              />
              {q && (
                <button
                  type="button"
                  onClick={() => setBusca("")}
                  aria-label="Limpar busca"
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Select value={status ?? "todos"} onValueChange={setStatus}>
              <SelectTrigger className="w-48">
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
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Produto</TableHead>
                  <TableHead className="text-right">Estoque</TableHead>
                  <TableHead className="text-right">Reservado</TableHead>
                  <TableHead className="text-right">Disponível</TableHead>
                  <TableHead className="text-right">Consumo Médio</TableHead>
                  <TableHead className="text-right">Lead Time</TableHead>
                  <TableHead className="text-right">Est. Segurança</TableHead>
                  <TableHead className="text-right">Cobertura</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="py-10 text-center text-muted-foreground">
                      Nenhum produto encontrado com esses filtros.
                    </TableCell>
                  </TableRow>
                )}
                {filtrados.map((p) => {
                  const oc = ordemAberta(p.id);
                  const dias = cobertura(p);
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <p className="font-medium">{p.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          SKU {p.sku}
                          {oc && (
                            <>
                              {" · "}
                              <Link to="/compras" className="text-primary hover:underline">
                                {oc.id} {oc.status === "aprovada" ? "em trânsito" : "pendente"}
                              </Link>
                            </>
                          )}
                        </p>
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {p.estoque} un
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {p.reservado} un
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
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
                        className={
                          "text-right tabular-nums " +
                          (dias < p.leadTime ? "font-medium text-danger" : "")
                        }
                      >
                        {Number.isFinite(dias) ? `${dias.toFixed(1).replace(".", ",")} dias` : "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={statusDoEstoque(p)} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={disponivel(p) === 0}
                            onClick={() => setModal({ tipo: "reservar", produto: p })}
                          >
                            <Zap className="h-4 w-4" />
                            Reservar
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost" aria-label="Mais ações">
                                <MoreHorizontal />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onSelect={() => setModal({ tipo: "ajustar", produto: p })}
                              >
                                <Warehouse />
                                Ajustar estoque
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => setModal({ tipo: "editar", produto: p })}
                              >
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
                              <DropdownMenuItem
                                className="text-danger focus:text-danger"
                                onSelect={() => setModal({ tipo: "remover", produto: p })}
                              >
                                <Trash2 />
                                Remover produto
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

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
              className="bg-danger text-danger-foreground hover:bg-danger/90"
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
              <p className="text-xs text-danger">Informe um valor entre 1 e {max}.</p>
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
              <PackagePlus className="h-5 w-5 text-primary" />
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
