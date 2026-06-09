# Plano de Implementação — Frontend

Interface web da Borgonha Confeitaria: PDV, gestão de produtos, estoque e relatórios financeiros.

---

## Stack

| Camada | Tecnologia | Versão |
|--------|------------|--------|
| Framework | React | 18 |
| Linguagem | TypeScript | 5 |
| Build tool | Vite | 5 |
| Roteamento | React Router | v6 |
| Dados / cache | TanStack Query (React Query) | v5 |
| HTTP | Axios | latest |
| SSO | keycloak-js | 24 |
| Contêiner | Docker (nginx:alpine) | — |

---

## Estrutura de Pastas

```
src/
├── auth/
│   ├── keycloak.ts          # instância singleton do keycloak-js
│   ├── KeycloakProvider.tsx  # inicialização + contexto
│   ├── useAuth.ts            # hook: token, roles, user info
│   └── ProtectedRoute.tsx    # guard por role
├── api/
│   ├── client.ts             # instância Axios com interceptor de token
│   ├── produtos.ts
│   ├── vendas.ts
│   ├── estoque.ts
│   └── relatorios.ts
├── features/
│   ├── pdv/                  # tela de caixa (role: atendente, admin)
│   ├── produtos/             # CRUD de produtos (role: admin)
│   ├── estoque/              # ingredientes + entradas (role: admin)
│   └── relatorios/           # relatório diário e mensal (role: admin)
├── components/               # componentes reutilizáveis (Badge, KpiCard, etc.)
├── layouts/
│   └── AppLayout.tsx         # navbar + alertas de estoque
└── main.tsx
```

---

## Autenticação (Keycloak)

### Inicialização
O Keycloak **deve ser inicializado antes** do React renderizar qualquer coisa.

```ts
// src/auth/keycloak.ts
import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL,     // ex: http://localhost:8080
  realm: 'borgonha',
  clientId: 'borgonha-frontend',
});

export default keycloak;
```

```tsx
// src/main.tsx
keycloak.init({ onLoad: 'login-required', pkceMethod: 'S256' }).then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <KeycloakProvider><App /></KeycloakProvider>
  );
});
```

### Token nas requisições
```ts
// src/api/client.ts
axios.interceptors.request.use(config => {
  if (keycloak.token) {
    config.headers.Authorization = `Bearer ${keycloak.token}`;
  }
  return config;
});

// Renovar token expirado antes de cada requisição
axios.interceptors.request.use(async config => {
  await keycloak.updateToken(30); // renova se expira em < 30s
  return config;
});
```

### Roles e Guards
| Role Keycloak | Acesso |
|---------------|--------|
| `admin` | Todas as telas |
| `atendente` | Somente PDV |

```tsx
// src/auth/ProtectedRoute.tsx
// Se role requerida não estiver em keycloak.realmAccess.roles → redirecionar para /sem-acesso
```

---

## Features

### PDV — Caixa (`/pdv`)
**Regra crítica: fluxo completo de venda em ≤ 3 cliques**

Fluxo:
1. **Clique 1** — seleciona produto no grid (adiciona ao carrinho com `quantidade = 1`)
2. **Clique 2** — ajusta quantidade no carrinho (se necessário) + informa valor pago
3. **Clique 3** — confirma venda

Componentes:
- `ProdutoGrid` — grid de cards com nome e preço; busca por nome via `input` (não conta como clique)
- `Carrinho` — lista de itens, subtotal, campo valor pago, troco calculado em tempo real
- `BotaoConfirmar` — chama `POST /vendas`; mostra spinner + resultado (sucesso com troco ou erro de estoque)

Regras de UI:
- Produto indisponível (estoque zerado) aparece desabilitado e marcado visualmente
- Erro de estoque da API → mostrar quais ingredientes estão em falta
- Após confirmação com sucesso → limpar carrinho automaticamente

```ts
// React Query mutation
const { mutate: registrarVenda } = useMutation({
  mutationFn: (payload: NovaVendaDto) => vendasApi.criar(payload),
  onSuccess: () => { limparCarrinho(); toast.success('Venda registrada'); },
  onError: (err) => { toast.error(extrairMensagem(err)); },
});
```

---

### Produtos (`/produtos`) — admin
- Listagem com busca e toggle ativo/inativo
- `ProdutoForm` — nome, preço, e seção de receita: lista dinâmica de `{ ingrediente, quantidade }`
  - Ingrediente selecionado via combobox (`GET /ingredientes`)
  - Adicionar/remover linha de receita dinamicamente
- Custo calculado pelo backend e exibido como campo read-only no formulário

---

### Estoque (`/estoque`) — admin
Duas seções na mesma página:

**Ingredientes**
- Tabela com: nome, unidade, quantidade atual, mínimo, status (badge `OK` / `CRÍTICO`)
- `Criticobadge` aparece quando `quantidadeAtual <= quantidadeMinima`
- Botão "Entrada" abre modal com campo de quantidade → `PATCH /ingredientes/{id}/entrada`

**Alerta global na navbar**
- `useQuery` para `GET /ingredientes/alertas` com `refetchInterval: 60_000`
- Se houver itens em alerta → exibir ícone com contador vermelho na navbar

---

### Relatórios (`/relatorios`) — admin
Duas abas: **Diário** e **Mensal**

**Diário**
- `DatePicker` → dispara `GET /relatorios/diario?data=YYYY-MM-DD`
- KPI cards: Total de vendas · Receita bruta · Custo total · Lucro

**Mensal**
- Seletores de mês + ano → `GET /relatorios/mensal?ano=YYYY&mes=MM`
- Mesmos KPI cards + tabela de ranking de produtos (nome · unidades vendidas · receita)

```tsx
// Exemplo com React Query
const { data, isLoading } = useQuery({
  queryKey: ['relatorio-diario', data],
  queryFn: () => relatoriosApi.diario(data),
  enabled: !!data,
});
```

---

## Docker

### Dockerfile (multi-stage)
```dockerfile
# Stage 1: build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ARG VITE_KEYCLOAK_URL
RUN npm run build

# Stage 2: serve
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### nginx.conf
```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;  # SPA routing
  }

  location /api/ {
    proxy_pass http://backend:8080/;   # opcional: proxy reverso
  }
}
```

### Serviço no docker-compose raiz
```yaml
# Adicionar ao docker-compose.yml do projeto borgonha-confeitaria
  frontend:
    build:
      context: ./borgonha-frontend
      args:
        VITE_API_URL: http://localhost:5000
        VITE_KEYCLOAK_URL: http://localhost:8080
    ports:
      - "3000:80"
    depends_on:
      - backend
```

---

## Variáveis de Ambiente

```bash
# .env.development (não commitar)
VITE_API_URL=http://localhost:5000
VITE_KEYCLOAK_URL=http://localhost:8080
```

```bash
# .env.example (commitar)
VITE_API_URL=
VITE_KEYCLOAK_URL=
```

---

## Sprint Plan

### Sprint 1 — Setup, Auth e Roteamento (dias 1–7)
- [ ] `npm create vite@latest` com template `react-ts`
- [ ] Instalar dependências: `react-router-dom`, `@tanstack/react-query`, `axios`, `keycloak-js`
- [ ] `keycloak.ts` + `KeycloakProvider` + `useAuth`
- [ ] `App.tsx` com rotas protegidas por role
- [ ] `AppLayout` com navbar (logo, links por role, botão logout, slot de alerta de estoque)
- [ ] `ProtectedRoute` redirecionando para `/sem-acesso` se role insuficiente
- [ ] `client.ts` — Axios com interceptor de token + renovação automática
- [ ] Dockerfile + nginx.conf funcionando

### Sprint 2 — PDV, Produtos e Estoque (dias 8–14)
- [ ] Feature **PDV**: `ProdutoGrid`, `Carrinho`, troco em tempo real, `POST /vendas`, feedback de erro de estoque
- [ ] Feature **Produtos**: listagem, `ProdutoForm` com receita dinâmica, ativar/desativar
- [ ] Feature **Estoque**: tabela com badges, modal de entrada, invalidar cache após entrada
- [ ] Alerta global na navbar (`refetchInterval: 60_000`)
- [ ] Loading states e tratamento de erros em todas as mutations

### Sprint 3 — Relatórios, Polish e Entrega (dias 15–21)
- [ ] Feature **Relatórios**: abas Diário/Mensal, KPI cards, tabela de ranking
- [ ] Responsividade: testar e ajustar em tablet e desktop
- [ ] Teste de usabilidade com as personas (máx 3 cliques no PDV)
- [ ] `.env.example` e variáveis documentadas
- [ ] README atualizado com como rodar localmente e via Docker
