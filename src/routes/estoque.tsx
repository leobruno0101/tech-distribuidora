import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Search, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { produtos as base, statusDoEstoque, type Produto } from "@/lib/erp-data";

export const Route = createFileRoute("/estoque")({
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

function Estoque() {
  const [itens, setItens] = useState<Produto[]>(base);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    const id = setInterval(() => {
      setItens((prev) =>
        prev.map((p) => {
          const delta = Math.floor(Math.random() * 5) - 3;
          return { ...p, estoque: Math.max(8, p.estoque + delta) };
        }),
      );
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const filtrados = itens.filter((p) => p.nome.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Gestão de Estoque</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Política vigente: consumo médio 10 un/dia · lead time 7 dias · estoque de segurança 20
            un · ponto de pedido 90 un.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar produto..."
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Produtos monitorados</CardTitle>
          <CardDescription>Posições atualizadas automaticamente a cada 5 segundos.</CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Produto</TableHead>
                  <TableHead className="text-right">Estoque Atual</TableHead>
                  <TableHead className="text-right">Consumo Médio</TableHead>
                  <TableHead className="text-right">Lead Time</TableHead>
                  <TableHead className="text-right">Estoque de Segurança</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <p className="font-medium">{p.nome}</p>
                      <p className="text-xs text-muted-foreground">SKU {p.sku}</p>
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {p.estoque} un
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.consumoMedio} un/dia
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{p.leadTime} dias</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.estoqueSeguranca} un
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={statusDoEstoque(p)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          toast.success("Reserva automática criada", {
                            description: `${p.nome} · lote reservado para pedidos em aberto.`,
                          })
                        }
                      >
                        <Zap className="h-4 w-4" />
                        Reserva Automática
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
