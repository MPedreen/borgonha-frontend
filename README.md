# Borgonha Confeitaria — Frontend

Interface web responsiva para gestão da confeitaria: PDV, estoque de ingredientes e relatórios financeiros.

## Stack

| Camada | Tecnologia |
|--------|------------|
| Framework | Angular |
| Linguagem | TypeScript |
| Estilo | CSS / Angular Material (ou equivalente) |
| Comunicação | HTTP REST (consumindo o backend .NET) |

## Telas / Módulos

### PDV — Caixa
- Listagem de produtos ativos com nome e preço
- Carrinho de venda: adicionar/remover produtos com quantidade
- Cálculo automático de total e troco (campo "valor recebido")
- Confirmação da venda com feedback imediato (sucesso ou erro de estoque)
- **Regra UX:** fluxo completo de uma venda em no máximo 3 cliques

### Produtos
- Listagem, criação, edição e desativação de produtos
- Cada produto inclui receita (ingredientes + quantidades por unidade)
- Exibe preço de venda e custo calculado automaticamente

### Estoque de Ingredientes
- Listagem com quantidade atual, mínima e unidade de medida
- Destaque visual (badge/alerta) para ingredientes em nível crítico (`atual <= mínimo`)
- Entrada manual de estoque (formulário simples: ingrediente + quantidade)

### Relatórios Financeiros
- Seletor de data para relatório diário
- Seletor de mês/ano para relatório mensal
- Exibe: receita bruta, custo total, lucro, número de vendas, ranking de produtos mais vendidos

## Regras de UX / Interface

| Regra | Detalhe |
|-------|---------|
| Máximo 3 cliques por venda | PDV projetado para ser o fluxo mais rápido do sistema |
| Sem conhecimento técnico | Sem jargões técnicos na interface; linguagem acessível a atendentes |
| Responsiva | Funciona em desktop e tablet sem instalação |
| Feedback imediato | Toda ação retorna confirmação ou mensagem de erro clara |
| Alerta de estoque | Ingredientes críticos são destacados visualmente em todas as telas relevantes |

## Estrutura de Componentes (sugerida)

```
src/app/
├── pdv/                  # Módulo de caixa/venda
├── produtos/             # CRUD de produtos com receita
├── estoque/              # Ingredientes e entradas manuais
├── relatorios/           # Relatório diário e mensal
└── shared/               # Componentes reutilizáveis (alertas, tabelas, etc.)
```

## Comunicação com o Backend

Todos os dados vêm da API REST. Configurar a URL base em `environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000'
};
```

## Como rodar

```bash
# Pré-requisitos: Node.js, Angular CLI

npm install
ng serve
# Acesse http://localhost:4200
```

## Fora do Escopo

- Autenticação/login (MVP)
- App mobile nativo (iOS/Android)
- Integração com WhatsApp ou pedidos online
