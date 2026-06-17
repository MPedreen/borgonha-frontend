# Borgonha Confeitaria — Frontend

Interface web para gestão da confeitaria: PDV, estoque de ingredientes e relatórios financeiros.

## Stack

| Camada | Tecnologia |
|--------|------------|
| Framework | React 18 + TypeScript 5 |
| Build | Vite 5 |
| Roteamento | React Router v6 |
| Estado servidor | TanStack Query v5 |
| HTTP | Axios |
| Autenticação | keycloak-js 24 |

## Telas

| Rota | Tela | Roles |
|------|------|-------|
| `/pdv` | PDV — grid de produtos, carrinho e troco em tempo real | `admin`, `atendente` |
| `/vendas/:id` | Recibo da venda | `admin`, `atendente` |
| `/produtos` | CRUD de produtos com receita dinâmica | `admin` |
| `/estoque` | Ingredientes, entrada de estoque e alertas | `admin` |
| `/relatorios` | KPIs diários/mensais e ranking de produtos | `admin` |

## Estrutura

```
src/
├── auth/          # Keycloak singleton, provider, hooks e ProtectedRoute
├── api/           # Funções Axios por domínio (produtos, ingredientes, vendas, relatorios)
├── features/      # Páginas por domínio (pdv, produtos, estoque, relatorios)
├── components/    # Badge, Spinner, KpiCard
├── layouts/       # AppLayout (navbar com alerta de estoque)
├── types/         # Tipos TypeScript por domínio
└── styles/        # Design tokens e estilos base
```

## Como rodar

### Com Docker (recomendado)

```bash
# Na raiz do monorepo
cp .env.example .env        # preencher DB_PASSWORD e KEYCLOAK_ADMIN_PASSWORD
docker compose up -d        # sobe postgres + keycloak
docker compose --profile app up -d --build   # sobe backend + frontend
```

O frontend ficará disponível em `http://localhost:3000`.

### Localmente

```bash
# 1. Criar arquivo de variáveis de ambiente
cp .env.example .env.local
# Preencher VITE_API_URL e VITE_KEYCLOAK_URL

# 2. Instalar dependências e subir
npm install
npm run dev
# Acesse http://localhost:5173
```

## Variáveis de ambiente

| Variável | Exemplo |
|----------|---------|
| `VITE_API_URL` | `http://localhost:5000` |
| `VITE_KEYCLOAK_URL` | `http://localhost:8080` |

## Autenticação

O Keycloak é inicializado antes da montagem do React (`main.tsx`). Todas as rotas exigem autenticação. A role `atendente` acessa apenas o PDV; `admin` acessa tudo. O token é renovado automaticamente via interceptor Axios quando falta menos de 30 segundos para expirar.
