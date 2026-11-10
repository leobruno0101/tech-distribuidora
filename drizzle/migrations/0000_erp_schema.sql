CREATE TABLE public.produtos (
  id text PRIMARY KEY,
  nome text NOT NULL,
  sku text NOT NULL,
  estoque integer NOT NULL DEFAULT 0,
  reservado integer NOT NULL DEFAULT 0,
  consumo_medio numeric NOT NULL DEFAULT 0,
  lead_time integer NOT NULL DEFAULT 0,
  estoque_seguranca integer NOT NULL DEFAULT 0,
  ponto_pedido integer NOT NULL DEFAULT 0,
  custo_unitario numeric NOT NULL DEFAULT 0,
  fornecedor text NOT NULL DEFAULT '',
  ordem integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.ordens_compra (
  id text PRIMARY KEY,
  produto_id text NOT NULL,
  produto text NOT NULL,
  quantidade integer NOT NULL,
  fornecedor text NOT NULL,
  valor numeric NOT NULL,
  previsao_dias integer NOT NULL DEFAULT 0,
  origem text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pendente',
  motivo_rejeicao text,
  criada_em bigint NOT NULL,
  atualizada_em bigint NOT NULL
);
CREATE TABLE public.notificacoes (
  id text PRIMARY KEY,
  titulo text NOT NULL,
  descricao text NOT NULL DEFAULT '',
  tipo text NOT NULL DEFAULT 'info',
  link text NOT NULL DEFAULT '/',
  lida boolean NOT NULL DEFAULT false,
  data bigint NOT NULL,
  automatica boolean NOT NULL DEFAULT false
);
CREATE TABLE public.configuracoes_erp (
  id integer PRIMARY KEY DEFAULT 1,
  dados jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.produtos, public.ordens_compra, public.notificacoes, public.configuracoes_erp TO anon, authenticated;
GRANT ALL ON public.produtos, public.ordens_compra, public.notificacoes, public.configuracoes_erp TO service_role;

ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordens_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes_erp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "acesso erp produtos" ON public.produtos FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso erp ordens" ON public.ordens_compra FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso erp notificacoes" ON public.notificacoes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso erp config" ON public.configuracoes_erp FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO public.produtos (id,nome,sku,estoque,reservado,consumo_medio,lead_time,estoque_seguranca,ponto_pedido,custo_unitario,fornecedor,ordem) VALUES
('p1','Smart TV 50" 4K UHD','TV-50-4K',118,0,10,7,20,90,2120,'VisionTech Ltda',1),
('p2','Notebook Ultra 14 i7','NB-14-I7',92,0,8,9,20,90,3890,'CompuMax Distribuidora',2),
('p3','Smartphone Neo 256GB','SP-NEO-256',74,0,14,5,20,90,2116.67,'MobileOne Distribuição',3),
('p4','Monitor 27 QHD 165Hz','MN-27-QHD',26,0,6,7,20,90,1479,'PixelPro Import',4),
('p5','Fone Bluetooth ANC Pro','FN-ANC-PRO',148,0,12,4,20,90,420,'SoundWave Import',5),
('p6','Console Play X 1TB','CS-PX-1TB',21,0,9,11,20,90,2390,'GameSupply SA',6);

INSERT INTO public.ordens_compra (id,produto_id,produto,quantidade,fornecedor,valor,previsao_dias,origem,status,criada_em,atualizada_em) VALUES
('OC-2041','p1','Smart TV 50" 4K UHD',120,'VisionTech Ltda',254400,7,'Ponto de pedido atingido','pendente',1794222000000,1794222000000),
('OC-2042','p6','Console Play X 1TB',80,'GameSupply SA',191200,11,'Risco de ruptura','pendente',1794222000000,1794222000000),
('OC-2043','p4','Monitor 27 QHD 165Hz',60,'PixelPro Import',88740,7,'Previsão de demanda (IA)','pendente',1794222000000,1794222000000),
('OC-2044','p3','Smartphone Neo 256GB',150,'MobileOne Distribuição',317500,5,'Ponto de pedido atingido','pendente',1794222000000,1794222000000);

INSERT INTO public.notificacoes (id,titulo,descricao,tipo,link,lida,data) VALUES
('n1','Console Play X 1TB em risco de ruptura','Ruptura prevista em 2 dias. OC-2042 aguarda aprovação.','critico','/compras',false,1794222000000),
('n2','Monitor 27 QHD 165Hz abaixo do estoque de segurança','Lead time de 7 dias não cobre a demanda atual.','critico','/estoque',false,1794222000000),
('n3','ERP Fiscal aguardando credenciais','Conecte a integração para emitir notas automaticamente.','alerta','/configuracoes',false,1794222000000);

INSERT INTO public.configuracoes_erp (id, dados) VALUES (1, '{}'::jsonb);