import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações | TechDistribuidora ERP" },
      {
        name: "description",
        content: "Política de estoque, automações e integrações da TechDistribuidora.",
      },
      { property: "og:title", content: "Configurações | TechDistribuidora ERP" },
      {
        property: "og:description",
        content: "Política de estoque, automações e integrações da TechDistribuidora.",
      },
    ],
  }),
  component: Configuracoes,
});

const integracoes = [
  { nome: "API de Vendas (e-commerce)", status: "Conectada", detalhe: "sync a cada 30s" },
  { nome: "WMS Centro de Distribuição", status: "Conectada", detalhe: "sync a cada 60s" },
  { nome: "Portal de Fornecedores (EDI)", status: "Conectada", detalhe: "sync a cada 5min" },
  { nome: "ERP Fiscal", status: "Pendente", detalhe: "aguardando credenciais" },
];

function Configuracoes() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Parâmetros da política de estoque e automações do sistema.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Política de estoque padrão</CardTitle>
          <CardDescription>Aplicada a novos produtos cadastrados.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="consumo">Consumo médio (un/dia)</Label>
            <Input id="consumo" defaultValue="10" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lead">Lead time (dias)</Label>
            <Input id="lead" defaultValue="7" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seguranca">Estoque de segurança (un)</Label>
            <Input id="seguranca" defaultValue="20" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ponto">Ponto de pedido (un)</Label>
            <Input id="ponto" defaultValue="90" />
          </div>
          <div className="sm:col-span-2">
            <Button onClick={() => toast.success("Política de estoque salva")}>
              Salvar alterações
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Automações</CardTitle>
          <CardDescription>Reduza processos manuais da operação.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            ["Gerar ordem de compra ao atingir o ponto de pedido", true],
            ["Reserva automática de estoque para pedidos confirmados", true],
            ["Alertas preditivos de ruptura por e-mail", true],
            ["Ajustar política de estoque com as sugestões da IA", false],
          ].map(([texto, ativo]) => (
            <div key={texto as string} className="flex items-center justify-between gap-4">
              <span className="text-sm">{texto}</span>
              <Switch defaultChecked={ativo as boolean} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integrações</CardTitle>
          <CardDescription>Fontes de dados em tempo real.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {integracoes.map((i) => (
            <div
              key={i.nome}
              className="flex items-center justify-between gap-3 rounded-lg border p-3"
            >
              <div>
                <p className="text-sm font-medium">{i.nome}</p>
                <p className="text-xs text-muted-foreground">{i.detalhe}</p>
              </div>
              <span
                className={
                  i.status === "Conectada"
                    ? "rounded-full border border-success/30 bg-success-soft px-2.5 py-1 text-xs font-medium text-success"
                    : "rounded-full border border-warning/40 bg-warning-soft px-2.5 py-1 text-xs font-medium text-warning-foreground"
                }
              >
                {i.status}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
