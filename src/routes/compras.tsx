import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Check, Truck, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ordensIniciais, type OrdemCompra } from "@/lib/erp-data";

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

type Decisao = "aprovada" | "rejeitada";

function Compras() {
  const [decisoes, setDecisoes] = useState<Record<string, Decisao>>({});

  const decidir = (oc: OrdemCompra, decisao: Decisao) => {
    setDecisoes((d) => ({ ...d, [oc.id]: decisao }));
    if (decisao === "aprovada") {
      toast.success(`${oc.id} aprovada`, {
        description: `Enviada ao fornecedor ${oc.fornecedor}.`,
      });
    } else {
      toast.error(`${oc.id} rejeitada`, { description: "Ordem devolvida para revisão." });
    }
  };

  const pendentes = ordensIniciais.filter((o) => !decisoes[o.id]).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ordens de Compra</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {pendentes} ordens aguardando aprovação · geradas automaticamente pelo ponto de pedido.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {ordensIniciais.map((oc) => {
          const decisao = decisoes[oc.id];
          return (
            <Card key={oc.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">
                      {oc.id} · {oc.produto}
                    </CardTitle>
                    <CardDescription>{oc.origem}</CardDescription>
                  </div>
                  <span
                    className={
                      decisao === "aprovada"
                        ? "rounded-full border border-success/30 bg-success-soft px-2.5 py-1 text-xs font-medium text-success"
                        : decisao === "rejeitada"
                          ? "rounded-full border border-danger/30 bg-danger-soft px-2.5 py-1 text-xs font-medium text-danger"
                          : "rounded-full border border-warning/40 bg-warning-soft px-2.5 py-1 text-xs font-medium text-warning-foreground"
                    }
                  >
                    {decisao === "aprovada"
                      ? "Aprovada"
                      : decisao === "rejeitada"
                        ? "Rejeitada"
                        : "Pendente"}
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
                    <p className="font-medium">{oc.valor}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Previsão</p>
                    <p className="inline-flex items-center gap-1 font-medium">
                      <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                      {oc.previsao}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" disabled={!!decisao} onClick={() => decidir(oc, "aprovada")}>
                    <Check className="h-4 w-4" />
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!!decisao}
                    onClick={() => decidir(oc, "rejeitada")}
                  >
                    <X className="h-4 w-4" />
                    Rejeitar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
