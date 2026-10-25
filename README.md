# Borgonha Confeitaria — site

Landing page oficial da Borgonha Confeitaria (Santa Luzia, São Gonçalo – RJ): cardápio de cookies, doces e salgados, botão "Faça seu pedido" (WhatsApp, iFood e loja física), dúvidas frequentes e endereço da loja. Os dados vêm da API [borgonha-backend](https://github.com/MPedreen/borgonha-backend).

Angular 22 (standalone, signals, zoneless) · pré-renderização (SSG) com hidratação incremental · Vitest · Playwright + axe

## Como rodar

Pré-requisitos: Node.js 24 (ou 22.22+) e, para a API, o [.NET SDK 10](https://dotnet.microsoft.com/download/dotnet/10.0) e o [Docker](https://www.docker.com/products/docker-desktop/), que roda o banco PostgreSQL.

Os dois repositórios ficam lado a lado, nas pastas `frontend/` e `backend/`:

```bash
git clone https://github.com/MPedreen/borgonha-frontend.git frontend
git clone https://github.com/MPedreen/borgonha-backend.git backend
```

```bash
# Terminal 1: banco e API em http://localhost:5170
# (na primeira vez, configure a senha do banco como explica o README do backend)
cd backend
docker compose up -d
dotnet run --project src/Borgonha.Api

# Terminal 2: site em http://localhost:4200
cd frontend
npm install
npm start
```

## Scripts

| Comando | O que faz |
|---|---|
| `npm start` | Servidor de desenvolvimento |
| `npm test` | Testes unitários (Vitest) |
| `npm run lint` | ESLint, incluindo as regras de acessibilidade dos templates |
| `npm run format` / `npm run format:check` | Prettier (formata / só verifica) |
| `npm run e2e` | Testes de ponta a ponta (Playwright, computador e celular) e de acessibilidade (axe, WCAG 2.2 AA); sobe a API e o site se não estiverem rodando |
| `npm run build` | Build de produção (veja abaixo) |
| `npm run imagens` | Gera as fotos em WebP (7 larguras) a partir de `design/originais/`; os recortes ficam configurados em `scripts/otimizar-imagens.mjs` |
| `npm run icones` | Gera o sprite de ícones (Lucide e Simple Icons) |
| `npm run ruas-entrega` | Gera `public/entrega/ruas.json`, a lista de ruas usada quando a conferência pela API está indisponível (precisa da API rodando; veja "Entrega e pedido mínimo") |

O CI (`.github/workflows/ci.yml`) roda formatação, lint, testes unitários, build e testes de ponta a ponta a cada push na `main` e em cada pull request.

## Build de produção

Com a API rodando: `npm run build`. A página inicial sai pré-renderizada, com o cardápio no HTML, em `dist/borgonha-confeitaria/browser/`, pronta para hospedagem estática. Para buscar os dados em outra API durante o build, use a variável `BORGONHA_API_URL`.

Em produção, o navegador chama a API em `/api`, no mesmo domínio do site (veja `src/environments/environment.ts`).

Na hospedagem, configure o fallback: endereços que não são arquivos (como `/admin` e a página "não encontrada") devem receber o `index.csr.html`, que é renderizado no navegador. O `index.html` é só a página inicial pré-renderizada.

## Cardápio semanal e área do administrador

O cardápio muda toda semana: o site avisa, logo acima dos cookies, que tudo o que aparece ali está disponível hoje. A página pré-renderizada traz o cardápio da hora do build, e o navegador busca a versão do dia assim que a página carrega.

O botão **Área do administrador**, no fim do rodapé, leva a `/admin`. Depois do login, os proprietários podem:

- marcar cada produto como **No cardápio**, **Esgotado** (aparece com o aviso "Esgotado hoje") ou **Oculto** (sai do site);
- trocar nome, descrição, preço, gramatura, frase e sabores, e enviar ou remover as fotos;
- cadastrar e excluir produtos.

As mudanças valem na hora. O código da área do administrador fica em `src/app/admin/`, carregado só quando alguém abre `/admin`, e as páginas não são indexadas pelos buscadores. O usuário e a senha ficam só na API: veja o README do [borgonha-backend](https://github.com/MPedreen/borgonha-backend).

## Entrega e pedido mínimo

A seção **Entrega** explica a regra e deixa o cliente conferir o endereço: até 1,5 km da loja, pelo trajeto de entrega, a entrega é grátis e sem pedido mínimo; mais longe, grátis com pedido mínimo de R$ 30. O raio e o valor vêm da API (`entrega` em `/api/loja`), e o painel "Faça seu pedido" também mostra a regra.

A consulta funciona de três jeitos:

- **Digitando o endereço:** o cliente escreve rua e número e escolhe a sugestão (combobox acessível por teclado). O site só pergunta à API depois de uma pausa na digitação e com 4 letras ou mais, e guarda as respostas enquanto a página está aberta. A API (`/api/entrega/*`) fala com o Geoapify; o navegador nunca chama serviço de mapas.
- **Localização do aparelho:** o navegador informa onde a pessoa está e a API confere o trajeto. A localização não é guardada.
- **Quando a API não consegue** (serviço de mapas fora do ar, sem chave ou limite do dia): o site mostra o aviso "Conferência de endereço temporariamente indisponível" com o botão do WhatsApp e, enquanto isso, deixa procurar pelo nome da rua em `public/entrega/ruas.json` (ruas e bairros até 5 km da loja, do OpenStreetMap; cerca de 80 KB, só baixado nessa situação). O resultado vira uma estimativa em linha reta. Depois de um minuto, o site volta a tentar a API.

Como o mapa gratuito não tem precisão de casa em casa, a API dá 250 m de tolerância a favor do cliente: até 1,75 km pelo trajeto, sem pedido mínimo. Além de 5 km em linha reta, o site manda perguntar pelo WhatsApp, com o endereço já escrito na mensagem. Os limites de uso, a chave e as regras de decisão estão no README do [borgonha-backend](https://github.com/MPedreen/borgonha-backend).

O arquivo de ruas é gerado por `npm run ruas-entrega` (precisa da API rodando). Rode de novo se a loja mudar de endereço ou se o raio mudar. Os testes de ponta a ponta simulam `/api/entrega/*` no navegador (`e2e/entrega-simulada.ts`), então não gastam crédito do Geoapify.

## Organização de `src/app`

| Pasta | Conteúdo |
|---|---|
| `core/` | Sem interface: modelos, acesso à API, estado com signals, pedido (links do WhatsApp), consulta de entrega (API, busca de ruas e distâncias), navegação, SEO e imagens |
| `ui/` | Componentes visuais reutilizáveis: botão, ícone, selo, etiqueta, cartão e imagem de produto, diálogo, acordeão, trilho, esqueleto, revelação e logo |
| `layout/` | Estrutura das páginas do site: barra de aviso, cabeçalho (menu de sabores e menu do celular), rodapé e barra fixa de pedido do celular |
| `pedido/` | Painel e opções de "Faça seu pedido" |
| `secoes/` | As seções da página inicial, na ordem: hero, cookies (com o aviso de cardápio semanal), por dentro, doces, salgados, diferenciais, entrega (com a consulta de endereço), como pedir e dúvidas |
| `paginas/` | Página inicial e página não encontrada |
| `admin/` | Área do administrador: login, lista de produtos, editor e envio de fotos |

Os estilos globais (tokens de cor, tipografia, mixins e botões) ficam em `src/styles/`; os testes de ponta a ponta, em `e2e/`; os scripts, em `scripts/`; e as fotos originais, em `design/originais/`.

## Pendências

- **Logo**: espaço em branco reservado em `src/app/ui/logo/logo.ts`; o favicon é provisório.
- **Fonte Pacaembu**: comprar a licença web, colocar os `.woff2` em `public/fontes/` e descomentar o bloco em `src/styles/_fontes.scss`. Até lá, o site usa a Gabarito.
- **Fotos**: salgados; cookie Tradicional partido; brookie, brownie e bolos de pote sem texto; fachada da loja; e, principalmente, as **fotos dos cookies vistos de cima em alta resolução**. Hoje elas são recortadas das placas do cardápio, com ~170 px por cookie, e ampliadas 4× por um filtro que só interpola os pixels reais (sem IA, para não inventar detalhes). Fica nítido o suficiente no tamanho do card, mas fotos originais trariam detalhe de verdade.
- **Domínio e hospedagem**: definir `siteUrl` e `apiUrl` em `src/environments/environment.ts`, as origens do CORS na API e o `Sitemap` em `public/robots.txt`.
