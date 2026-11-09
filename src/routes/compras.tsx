import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Check, CheckCheck, PackageCheck, Plus, RotateCcw, Truck, X } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  brl,
  disponivel,
  quantidadeSugerida,
  type OrdemCompra,
  type OrdemStatus,
} from "@/lib/erp-data";
import { useERP } from "@/lib/erp-store";

export const Route = createFileRoute("/compras")({
  head: () => ({
    meta: [
      { title: "Ordens de Compra | TechDistribuidora ERP" },
      {
        name: "description",
        content: "Ordens geradas automaticamente no ponto de pedido, com aprovação do gestor.",
      },
      { property: "og:title", content: "Ordens de Compra | TechDistribuidora ERP" },
      {
        property: "og:description",
        content: "Ordens geradas automaticamente no ponto de pedido, com aprovação do gestor.",
      },
    ],
  }),
  component: Compras,
});

const statusInfo: Record<OrdemStatus, { label: string; cls: string }> = {
  pendente: {
    label: "Pendente",
    cls: "border-warning/40 bg-warning-soft text-warning-foreground",
  },
  aprovada: { label: "Em trânsito", cls: "border-primary/30 bg-primary/10 text-primary" },
  recebida: { label: "Recebida", cls: "border-success/30 bg-success-soft text-success" },
  rejeitada: { label: "Rejeitada", cls: "border-danger/30 bg-danger-soft text-danger" },
};

type Filtro = "todas" | OrdemStatus;

function Compras() {
  const { state, dispatch } = useERP();
  const [filtro, setFiltro] = useState<Filtro>("pendente");
  const [rejeitando, setRejeitando] = useState<OrdemCompra | null>(null);
  const [novaAberta, setNovaAberta] = useState(false);

  const contagem = (s: OrdemStatus) => state.ordens.filter((o) => o.status === s).length;
  const pendentes = state.ordens.filter((o) => o.status === "pendente");
  const lista = filtro === "todas" ? state.ordens : state.ordens.filter((o) => o.status === filtro);

  const aprovar = (oc: OrdemCompra) => {
    dispatch({ type: "aprovarOrdem", id: oc.id, agora: Date.now() });
    toast.success(`${oc.id} aprovada`, {
      description: `Enviada ao fornecedor ${oc.fornecedor}. Previsão de entrega: ${oc.previsaoDias} dias.`,
    });
  };

  const aprovarTodas = () => {
    const agora = Date.now();
    pendentes.forEach((o) => dispatch({ type: "aprovarOrdem", id: o.id, agora }));
    toast.success(`${pendentes.length} ordens aprovadas`, {
      description: `Total enviado aos fornecedores: ${brl(pendentes.reduce((s, o) => s + o.valor, 0))}.`,
    });
  };

  const receber = (oc: OrdemCompra) => {
    dispatch({ type: "receberOrdem", id: oc.id, agora: Date.now() });
    toast.success(`${oc.id} recebida`, {
      description: `+${oc.quantidade} un de ${oc.produto} no estoque.`,
    });
  };

  const reabrir = (oc: OrdemCompra) => {
    dispatch({ type: "reabrirOrdem", id: oc.id, agora: Date.now() });
    toast.info(`${oc.id} reaberta para aprovação`);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ordens de Compra</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {pendentes.length} ordens aguardando aprovação ·{" "}
            {state.automacoes.autoOC
              ? "geração automática pelo ponto de pedido ativa."
              : "geração automática desativada."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={pendentes.length === 0} onClick={aprovarTodas}>
            <CheckCheck />
            Aprovar todas
          </Button>
          <Button onClick={() => setNovaAberta(true)}>
            <Plus />
            Nova ordem
          </Button>
        </div>
      </div>

      <Tabs value={filtro} onValueChange={(v) => setFiltro(v as Filtro)}>
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="pendente">Pendentes ({contagem("pendente")})</TabsTrigger>
          <TabsTrigger value="aprovada">Em trânsito ({contagem("aprovada")})</TabsTrigger>
          <TabsTrigger value="recebida">Recebidas ({contagem("recebida")})</TabsTrigger>
          <TabsTrigger value="rejeitada">Rejeitadas ({contagem("rejeitada")})</TabsTrigger>
          <TabsTrigger value="todas">Todas ({state.ordens.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {lista.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nenhuma ordem neste status.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {lista.map((oc) => {
            const info = statusInfo[oc.status];
            return (
              <Card key={oc.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="text-base">
                        {oc.id} · {oc.produto}
                      </CardTitle>
                      <CardDescription>
                        {oc.origem} · criada em {new Date(oc.criadaEm).toLocaleDateString("pt-BR")}
                      </CardDescription>
                    </div>
                    <span
                      className={
                        "shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium " + info.cls
                      }
                    >
                      {info.label}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Quantidade</p>
                      <p className="font-medium">{oc.quantidade} un</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Fornecedor</p>
                      <p className="font-medium">{oc.fornecedor}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Valor</p>
                      <p className="font-medium">{brl(oc.valor)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Previsão</p>
                      <p className="inline-flex items-center gap-1 font-medium">
                        <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                        {oc.previsaoDias} dias
                      </p>
                    </div>
                  </div>

                  {oc.status === "rejeitada" && oc.motivoRejeicao && (
                    <p className="rounded-md bg-danger-soft/60 px-3 py-2 text-xs text-danger">
                      Motivo: {oc.motivoRejeicao}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {oc.status === "pendente" && (
                      <>
                        <Button size="sm" onClick={() => aprovar(oc)}>
                          <Check className="h-4 w-4" />
                          Aprovar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setRejeitando(oc)}>
                          <X className="h-4 w-4" />
                          Rejeitar
                        </Button>
                      </>
                    )}
                    {oc.status === "aprovada" && (
                      <Button size="sm" onClick={() => receber(oc)}>
                        <PackageCheck className="h-4 w-4" />
                        Registrar recebimento
                      </Button>
                    )}
                    {oc.status === "rejeitada" && (
                      <Button size="sm" variant="outline" onClick={() => reabrir(oc)}>
                        <RotateCcw className="h-4 w-4" />
                        Reabrir
                      </Button>
                    )}
                    <Button asChild size="sm" variant="ghost">
                      <Link to="/estoque" search={{ q: oc.produto }}>
                        Ver no estoque
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <RejeitarDialog ordem={rejeitando} onClose={() => setRejeitando(null)} />
      <NovaOrdemDialog aberto={novaAberta} onClose={() => setNovaAberta(false)} />
    </div>
  );
}

const motivosRapidos = ["Preço acima do orçamento", "Quantidade excessiva", "Trocar fornecedor"];

function RejeitarDialog({ ordem, onClose }: { ordem: OrdemCompra | null; onClose: () => void }) {
  const { dispatch } = useERP();
  const [motivo, setMotivo] = useState("");

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (!ordem || !motivo.trim()) return;
    dispatch({ type: "rejeitarOrdem", id: ordem.id, motivo: motivo.trim(), agora: Date.now() });
    toast.error(`${ordem.id} rejeitada`, { description: "Ordem devolvida para revisão." });
    setMotivo("");
    onClose();
  };

  return (
    <Dialog open={!!ordem} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <form onSubmit={enviar}>
          <DialogHeader>
            <DialogTitle>Rejeitar {ordem?.id}</DialogTitle>
            <DialogDescription>
              {ordem?.produto} · {ordem && brl(ordem.valor)}. Informe o motivo para o comprador.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4 space-y-2">
            <Label htmlFor="motivo">Motivo</Label>
            <Textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex.: negociar novo preço com o fornecedor"
              autoFocus
            />
            <div className="flex flex-wrap gap-2">
              {motivosRapidos.map((m) => (
                <Button
                  key={m}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setMotivo(m)}
                >
                  {m}
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" disabled={!motivo.trim()}>
              Rejeitar ordem
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NovaOrdemDialog({ aberto, onClose }: { aberto: boolean; onClose: () => void }) {
  const { state, dispatch } = useERP();
  const [produtoId, setProdutoId] = useState("");
  const [qtd, setQtd] = useState("");
  const [fornecedor, setFornecedor] = useState("");

  const produto = state.produtos.find((p) => p.id === produtoId);
  const n = Math.round(Number(qtd));
  const valido = !!produto && n > 0;

  const escolherProduto = (id: string) => {
    setProdutoId(id);
    const p = state.produtos.find((x) => x.id === id);
    if (p) {
      setQtd(String(quantidadeSugerida(p)));
      setFornecedor(p.fornecedor);
    }
  };

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (!valido || !produto) return;
    dispatch({
      type: "criarOrdem",
      agora: Date.now(),
      ordem: { produtoId, quantidade: n, fornecedor, origem: "Ordem manual" },
    });
    toast.success("Ordem de compra criada", {
      description: `${produto.nome} · ${n} un · ${brl(n * produto.custoUnitario)}.`,
    });
    setProdutoId("");
    setQtd("");
    setFornecedor("");
    onClose();
  };

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <form onSubmit={enviar}>
          <DialogHeader>
            <DialogTitle>Nova ordem de compra</DialogTitle>
            <DialogDescription>A ordem entra como pendente de aprovação.</DialogDescription>
          </DialogHeader>
          <div className="my-4 space-y-3">
            <div className="space-y-1.5">
              <Label>Produto</Label>
              <Select value={produtoId} onValueChange={escolherProduto}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {state.produtos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome} · {disponivel(p)} un disp.
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="oc-qtd">Quantidade (un)</Label>
                <Input
                  id="oc-qtd"
                  inputMode="numeric"
                  value={qtd}
                  onChange={(e) => setQtd(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="oc-forn">Fornecedor</Label>
                <Input
                  id="oc-forn"
                  value={fornecedor}
                  onChange={(e) => setFornecedor(e.target.value)}
                />
              </div>
            </div>
            {produto && n > 0 && (
              <p className="rounded-md bg-secondary px-3 py-2 text-sm">
                Valor estimado: <strong>{brl(n * produto.custoUnitario)}</strong> · entrega em{" "}
                {produto.leadTime} dias
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!valido}>
              Criar ordem
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
