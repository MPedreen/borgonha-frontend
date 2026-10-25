import { Page } from '@playwright/test';

/** O que a API de entrega devolve nos testes, sem chamar o serviço de mapas (que gasta crédito). */
export const ENDERECO_AFRANIO = {
  titulo: 'Rua Afrânio Peixoto 40',
  detalhe: 'Santa Luzia, São Gonçalo - RJ, 24725-270',
  latitude: -22.7997367,
  longitude: -42.9789142,
};

export const ENDERECO_LONGE = {
  titulo: 'Avenida Brasil 1000',
  detalhe: 'Alcântara, São Gonçalo - RJ, 24710-000',
  latitude: -22.8246,
  longitude: -42.9805,
};

interface Simulacao {
  /** Status das duas rotas; 200 (padrão) devolve as respostas abaixo. */
  status?: number;
  conferir?: (latitude: number) => unknown;
}

/** Intercepta `/api/entrega/*` no navegador. Devolve a lista de chamadas feitas, para conferir o gasto. */
export async function simularEntrega(page: Page, { status = 200, conferir }: Simulacao = {}) {
  const chamadas: string[] = [];

  await page.route('**/api/entrega/**', async (rota) => {
    const url = new URL(rota.request().url());
    chamadas.push(`${url.pathname}${url.search}`);

    if (status !== 200) {
      await rota.fulfill({
        status,
        contentType: 'application/problem+json',
        body: JSON.stringify({ status, title: 'Indisponível' }),
      });
      return;
    }

    if (url.pathname.endsWith('/enderecos')) {
      const texto = (url.searchParams.get('texto') ?? '').toLowerCase();
      const lista = texto.includes('brasil') ? [ENDERECO_LONGE] : [ENDERECO_AFRANIO];
      await rota.fulfill({ json: lista });
      return;
    }

    const latitude = Number(url.searchParams.get('latitude'));
    await rota.fulfill({
      json: conferir?.(latitude) ?? {
        situacao: 'sem-minimo',
        distanciaEmMetros: 1200,
        distanciaEmLinhaRetaEmMetros: 900,
      },
    });
  });

  return chamadas;
}
