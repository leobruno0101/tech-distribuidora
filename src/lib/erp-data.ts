export type StockStatus = "saudavel" | "alerta" | "ruptura";

export type Produto = {
  id: string;
  nome: string;
  sku: string;
  estoque: number;
  consumoMedio: number;
  leadTime: number;
  estoqueSeguranca: number;
  pontoPedido: number;
};

export const produtos: Produto[] = [
  {
    id: "p1",
    nome: 'Smart TV 50" 4K UHD',
    sku: "TV-50-4K",
    estoque: 118,
    consumoMedio: 10,
    leadTime: 7,
    estoqueSeguranca: 20,
    pontoPedido: 90,
  },
  {
    id: "p2",
    nome: "Notebook Ultra 14 i7",
    sku: "NB-14-I7",
    estoque: 92,
    consumoMedio: 8,
    leadTime: 9,
    estoqueSeguranca: 20,
    pontoPedido: 90,
  },
  {
    id: "p3",
    nome: "Smartphone Neo 256GB",
    sku: "SP-NEO-256",
    estoque: 74,
    consumoMedio: 14,
    leadTime: 5,
    estoqueSeguranca: 20,
    pontoPedido: 90,
  },
  {
    id: "p4",
    nome: "Monitor 27 QHD 165Hz",
    sku: "MN-27-QHD",
    estoque: 26,
    consumoMedio: 6,
    leadTime: 7,
    estoqueSeguranca: 20,
    pontoPedido: 90,
  },
  {
    id: "p5",
    nome: "Fone Bluetooth ANC Pro",
    sku: "FN-ANC-PRO",
    estoque: 148,
    consumoMedio: 12,
    leadTime: 4,
    estoqueSeguranca: 20,
    pontoPedido: 90,
  },
  {
    id: "p6",
    nome: "Console Play X 1TB",
    sku: "CS-PX-1TB",
    estoque: 21,
    consumoMedio: 9,
    leadTime: 11,
    estoqueSeguranca: 20,
    pontoPedido: 90,
  },
];

export function statusDoEstoque(p: Produto): StockStatus {
  if (p.estoque <= p.estoqueSeguranca * 1.5) return "ruptura";
  if (p.estoque <= p.pontoPedido) return "alerta";
  return "saudavel";
}

export const statusLabel: Record<StockStatus, string> = {
  saudavel: "Saudável",
  alerta: "Alerta de Reposição",
  ruptura: "Risco de Ruptura",
};

export const financeiroMensal = [
  { mes: "Abr", faturamento: 118, lucro: 96 },
  { mes: "Mai", faturamento: 126, lucro: 92 },
  { mes: "Jun", faturamento: 132, lucro: 89 },
  { mes: "Jul", faturamento: 138, lucro: 87 },
  { mes: "Ago", faturamento: 140, lucro: 85 },
  { mes: "Set", faturamento: 140, lucro: 85 },
];

export const demandaIA = [
  { produto: 'Smart TV 50" 4K', demanda: 320, variacao: "+28%" },
  { produto: "Smartphone Neo 256GB", demanda: 295, variacao: "+22%" },
  { produto: "Fone Bluetooth ANC Pro", demanda: 240, variacao: "+17%" },
  { produto: "Notebook Ultra 14 i7", demanda: 186, variacao: "+9%" },
  { produto: "Monitor 27 QHD 165Hz", demanda: 140, variacao: "-4%" },
];

export type OrdemCompra = {
  id: string;
  produto: string;
  quantidade: number;
  fornecedor: string;
  valor: string;
  previsao: string;
  origem: string;
};

export const ordensIniciais: OrdemCompra[] = [
  {
    id: "OC-2041",
    produto: 'Smart TV 50" 4K UHD',
    quantidade: 120,
    fornecedor: "VisionTech Ltda",
    valor: "R$ 254.400,00",
    previsao: "7 dias",
    origem: "Ponto de pedido atingido",
  },
  {
    id: "OC-2042",
    produto: "Console Play X 1TB",
    quantidade: 80,
    fornecedor: "GameSupply SA",
    valor: "R$ 191.200,00",
    previsao: "11 dias",
    origem: "Risco de ruptura",
  },
  {
    id: "OC-2043",
    produto: "Monitor 27 QHD 165Hz",
    quantidade: 60,
    fornecedor: "PixelPro Import",
    valor: "R$ 88.740,00",
    previsao: "7 dias",
    origem: "Previsão de demanda (IA)",
  },
  {
    id: "OC-2044",
    produto: "Smartphone Neo 256GB",
    quantidade: 150,
    fornecedor: "MobileOne Distribuição",
    valor: "R$ 317.500,00",
    previsao: "5 dias",
    origem: "Ponto de pedido atingido",
  },
];
