# TechFlow Dashboard

Crie uma aplicação web responsiva no estilo Dashboard/SaaS moderno para uma empresa chamada "TechDistribuidora". O sistema deve ser um ERP focado na gestão integrada de estoque, vendas, compras e previsão com Inteligência Artificial. A interface deve ser limpa, profissional e intuitiva (usando Tailwind CSS e shadcn/ui).

**Estrutura de Navegação (Sidebar lateral):**

- Visão Geral (Dashboard)

- Gestão de Estoque

- Ordens de Compra

- Módulo de IA (Previsões e Alertas)

- Configurações

**Requisitos da Tela Principal (Visão Geral):**

- **Cards de KPIs:** Crie 4 cartões interativos no topo mostrando os indicadores de desempenho da gestão: Giro de Estoque, OTIF (%), Tempo de Ciclo do Pedido (dias) e Margem de Contribuição (%).

- **Gráficos Financeiros:** Adicione um gráfico de barras comparando o crescimento comercial (ex: Faturamento +40%) versus o desempenho financeiro (ex: Lucro -15%) para fácil visualização do cenário gerencial.

**Requisitos da Tela de Gestão de Estoque:**

- Crie uma tabela de dados em tempo real exibindo a listagem de produtos (exemplo de produto principal: Smart TV 50" 4K UHD).

- As colunas da tabela devem ser: Produto, Estoque Atual, Consumo Médio, Lead Time, Estoque de Segurança e Status.

- **Regra de Negócio Visual:** Implemente badges de status baseados na seguinte política de estoque: Consumo médio de 10 un/dia, Lead time de 7 dias, Estoque de segurança de 20 un. O Ponto de Pedido é de 90 unidades. Se o estoque em tempo real chegar a 90, exibir um alerta visual amarelo (Alerta de Reposição). Se chegar perto de 20, um alerta vermelho (Risco de Ruptura). Acima de 90, status verde.

- Adicione botões de ação para "Reserva Automática" em cada linha.

**Requisitos da Tela de Compras:**

- Uma interface para visualização de "Ordens de Compra", listando pedidos gerados automaticamente quando os produtos atingem o ponto de pedido, com botões para aprovação ou rejeição pelo gestor.

**Requisitos da Tela do Módulo de Inteligência Artificial:**

- Crie uma interface preditiva com 3 componentes principais:

  1. **Análise de Demanda:** Gráfico ou lista identificando automaticamente os produtos com maior procura baseada no histórico de vendas.

  2. **Sugestões de Compra:** Cards com sugestões automáticas de reposição recomendando quantidades ideais, ajustando a política de estoque com base na previsão.

  3. **Alertas Preventivos:** Um painel de notificações de urgência indicando produtos com risco iminente de ruptura, atuando de forma preditiva.

**Estilo Visual e UX:**

- Cores primárias voltadas para um tema corporativo (azul marinho e cinza claro), com amplo uso de espaço em branco.

- Utilização de badges semânticos (verde para saudável, amarelo para atenção e vermelho para urgência) para indicar a saúde do estoque.

- Design focado na redução de processos manuais e aumento da produtividade do usuário, simulando integrações via API (informações parecendo ser carregadas em tempo real).

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://tech-distribuidora.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4e08f463-d226-45e9-8a71-493c05cac219).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
