import { expect, Page, test } from '@playwright/test';
import { ENDERECO_AFRANIO, ENDERECO_LONGE, simularEntrega } from './entrega-simulada';

const LINK_DO_WHATSAPP =
  'https://wa.me/5521974509789?text=Ol%C3%A1!%0ADesejo%20fazer%20meu%20pedido!';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('mostra o conceito "Parte ao meio" e os 6 sabores de cookie', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Parte ao meio. Deixa escorrer.',
  );
  await expect(page.locator('#cookies .grade > li')).toHaveCount(6);
  await expect(page.locator('#cookies')).toContainText('130g');
  await expect(page.locator('#produto-tradicional')).toContainText('R$ 10,00');
  await expect(page.getByRole('heading', { name: 'Bateu fome de salgado?' })).toBeVisible();
});

test('avisa que o cardápio é semanal: o que está no site é o que tem hoje', async ({ page }) => {
  const aviso = page.getByRole('note', { name: /Cardápio da semana/ });

  await expect(aviso).toContainText('Tudo o que aparece aqui está disponível hoje');
  await expect(aviso).toContainText(/hoje, (\S+-feira|sábado|domingo), \d+ de /);
});

test('o rodapé leva à área do administrador, que pede login', async ({ page }) => {
  await page.getByRole('link', { name: 'Área do administrador' }).click();

  await expect(page).toHaveURL(/\/admin\/entrar$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Área do administrador');
  await expect(page.getByLabel('Usuário')).toBeVisible();
  await expect(page.getByLabel('Senha', { exact: true })).toHaveAttribute('type', 'password');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
});

test('"Faça seu pedido" oferece WhatsApp, iFood e a loja física', async ({ page }) => {
  await page
    .getByRole('button', { name: /Faça seu pedido/ })
    .first()
    .click();

  const painel = page.getByRole('dialog', { name: 'Faça seu pedido' });
  await expect(painel).toBeVisible();
  await expect(painel.getByRole('link', { name: /Pedir pelo WhatsApp/ })).toHaveAttribute(
    'href',
    LINK_DO_WHATSAPP,
  );
  await expect(
    painel.getByText(
      'MELHORES PREÇOS, entrega exclusiva em Santa Luzia e região com frete grátis!',
    ),
  ).toBeVisible();
  await expect(painel.getByRole('link', { name: /Pedir pelo iFood/ })).toHaveAttribute(
    'href',
    /ifood\.com\.br\/delivery\/sao-goncalo-rj\/borgonha-confeitaria/,
  );
  await expect(painel.getByRole('link', { name: /Encontre nossa loja física/ })).toHaveAttribute(
    'href',
    'https://maps.app.goo.gl/etqznn6CLoQ8DE68A',
  );

  await page.keyboard.press('Escape');
  await expect(painel).toBeHidden();
});

test('"Quero esse" já leva o sabor escolhido para a mensagem do WhatsApp', async ({ page }) => {
  await page
    .locator('#cookies')
    .getByRole('button', { name: 'Quero esse: Cookie Red Velvet' })
    .click();

  const painel = page.getByRole('dialog', { name: 'Faça seu pedido' });
  await expect(painel.getByText('Você escolheu: Cookie Red Velvet')).toBeVisible();
  await expect(painel.getByRole('link', { name: /Pedir pelo WhatsApp/ })).toHaveAttribute(
    'href',
    `${LINK_DO_WHATSAPP}%0AQuero%3A%20Cookie%20Red%20Velvet`,
  );
});

test('mostra endereço e horários da loja', async ({ page }) => {
  const loja = page.getByRole('complementary', { name: 'Nossa loja' });

  await expect(loja).toContainText('Rua Afrânio Peixoto, 40 – Santa Luzia, São Gonçalo – RJ');
  await expect(loja).toContainText('Terça a sexta, das 11h às 19h');
  await expect(loja).toContainText('Sábado, das 11h às 16h');
});

test.describe('no computador', () => {
  test.skip(
    ({ isMobile }) => isMobile,
    'O menu de sabores do cabeçalho é da versão para computador.',
  );

  test('o menu "Cookies" mostra todos os sabores e leva até o escolhido', async ({ page }) => {
    const gatilho = page.getByRole('button', { name: 'Cookies' });
    await gatilho.click();
    await expect(gatilho).toHaveAttribute('aria-expanded', 'true');

    const painel = page.locator('#painel-sabores');
    await expect(painel.getByRole('link')).toHaveCount(7); // 6 sabores + "Ver o cardápio completo"

    await painel.getByRole('link', { name: /M&M/ }).click();
    await expect(painel).toBeHidden();
    await expect(page.locator('#titulo-produto-mms')).toBeFocused();
    await expect(page.locator('#titulo-produto-mms')).toBeInViewport();
  });
});

test.describe('no celular', () => {
  test.skip(
    ({ isMobile }) => !isMobile,
    'Menu em tela cheia e barra fixa são da versão para celular.',
  );

  test('o menu em tela cheia lista os sabores e leva até os salgados', async ({ page }) => {
    await page.getByRole('button', { name: 'Abrir menu' }).click();
    const menu = page.getByRole('dialog', { name: 'Menu' });
    await expect(menu.getByRole('link', { name: /Kinder Bueno/ })).toBeVisible();

    await menu.getByRole('link', { name: /Salgados/ }).click();
    await expect(menu).toBeHidden();
    await expect(page.locator('#salgados')).toBeInViewport();
  });

  test('a barra fixa "Faça seu pedido" aparece depois da primeira dobra', async ({ page }) => {
    const barra = page.locator('app-barra-pedido-celular .barra');
    await expect(barra).not.toHaveClass(/barra--visivel/);

    await page.locator('#doces').scrollIntoViewIfNeeded();
    await expect(barra).toHaveClass(/barra--visivel/);

    await barra.getByRole('button', { name: /Faça seu pedido/ }).click();
    await expect(page.getByRole('dialog', { name: 'Faça seu pedido' })).toBeVisible();
  });

  test('a barra fixa some no rodapé, que já tem o próprio botão de pedido', async ({ page }) => {
    const barra = page.locator('app-barra-pedido-celular .barra');
    await page.locator('#doces').scrollIntoViewIfNeeded();
    await expect(barra).toHaveClass(/barra--visivel/);

    await page.locator('app-rodape footer').scrollIntoViewIfNeeded();
    await expect(barra).not.toHaveClass(/barra--visivel/);
  });
});

test.describe('entrega e pedido mínimo', () => {
  const resultado = (page: Page) => page.locator('#entrega .resultado');
  const campo = (page: Page) => page.getByRole('combobox', { name: 'Rua e número' });

  test('explica a regra da entrega', async ({ page }) => {
    const secao = page.locator('#entrega');
    await secao.scrollIntoViewIfNeeded();

    await expect(secao).toContainText('Até 1,5 km da loja');
    await expect(secao).toContainText('Entrega grátis, sem pedido mínimo.');
    await expect(secao).toContainText('Entrega grátis com pedido mínimo de R$ 30.');
    await expect(secao).toContainText('pelo trajeto de entrega');
  });

  test('confere o endereço escolhido sem chamar o serviço de mapas direto do navegador', async ({
    page,
  }) => {
    const chamadas = await simularEntrega(page);
    const externas: string[] = [];
    page.on('request', (requisicao) => {
      if (/geoapify|google|openstreetmap|nominatim/.test(new URL(requisicao.url()).hostname)) {
        externas.push(requisicao.url());
      }
    });

    await page.locator('#entrega').scrollIntoViewIfNeeded();
    await campo(page).pressSequentially('rua afranio peixoto 40');
    await page.getByRole('option', { name: /Rua Afrânio Peixoto 40/ }).click();

    await expect(resultado(page)).toContainText(ENDERECO_AFRANIO.titulo);
    await expect(resultado(page)).toContainText('Sem pedido mínimo');
    await expect(resultado(page)).toContainText(
      'a cerca de 1,2 km da loja pelo trajeto de entrega',
    );
    expect(chamadas.filter((chamada) => chamada.includes('/enderecos'))).toHaveLength(1);
    expect(externas).toEqual([]);
  });

  test('um endereço longe da loja tem pedido mínimo de R$ 30', async ({ page }) => {
    await simularEntrega(page, {
      conferir: () => ({
        situacao: 'com-minimo',
        distanciaEmMetros: null,
        distanciaEmLinhaRetaEmMetros: 2500,
      }),
    });

    await page.locator('#entrega').scrollIntoViewIfNeeded();
    await campo(page).pressSequentially('avenida brasil 1000');
    await expect(
      page.getByRole('option', { name: new RegExp(ENDERECO_LONGE.titulo) }),
    ).toBeVisible();
    await campo(page).press('ArrowDown');
    await campo(page).press('Enter');

    await expect(resultado(page)).toContainText('Pedido mínimo de R$ 30');
    await expect(resultado(page)).toContainText('a mais de 1,5 km da loja');
  });

  test('perto do limite, manda confirmar pelo WhatsApp com o endereço na mensagem', async ({
    page,
  }) => {
    await simularEntrega(page, {
      conferir: () => ({
        situacao: 'incerta',
        distanciaEmMetros: 1500,
        distanciaEmLinhaRetaEmMetros: 1150,
      }),
    });

    await page.locator('#entrega').scrollIntoViewIfNeeded();
    await campo(page).pressSequentially('rua afranio peixoto 40');
    await campo(page).press('Enter');

    await expect(resultado(page)).toContainText('Perto do limite de 1,5 km');
    const link = await page
      .getByRole('link', { name: /Confirmar no WhatsApp/ })
      .getAttribute('href');
    expect(decodeURIComponent(link ?? '')).toContain('Rua Afrânio Peixoto 40, Santa Luzia');
  });

  test('com o serviço de mapas indisponível, pede para falar no WhatsApp e ainda deixa procurar a rua', async ({
    page,
  }) => {
    await simularEntrega(page, { status: 503 });

    await page.locator('#entrega').scrollIntoViewIfNeeded();
    await campo(page).pressSequentially('afranio peixoto');

    const aviso = page.locator('#entrega [data-teste="aviso-de-falha"]');
    await expect(aviso).toContainText('temporariamente indisponível');
    await expect(aviso).toContainText('Fale com a gente pelo WhatsApp');
    await expect(aviso.getByRole('link', { name: /Chamar no WhatsApp/ })).toHaveAttribute(
      'href',
      /^https:\/\/wa\.me\/5521974509789\?text=/,
    );

    // A lista de ruas que vai junto com o site continua funcionando, como estimativa.
    await campo(page).fill('');
    await campo(page).pressSequentially('afranio peixoto');
    await page.getByRole('option', { name: /Rua Afrânio Peixoto/ }).click();
    await expect(resultado(page)).toContainText('Sem pedido mínimo (estimativa)');
  });

  test('a localização do aparelho confere o trajeto', async ({ page, context }) => {
    await simularEntrega(page);
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: -22.8105, longitude: -42.9805 });

    await page.locator('#entrega').scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: 'Usar minha localização' }).click();

    await expect(resultado(page)).toContainText('Você está a cerca de 1,2 km da loja pelo trajeto');
    await expect(resultado(page)).toContainText('Sem pedido mínimo');
  });

  test('se o serviço falhar, a localização ainda é conferida no aparelho, em linha reta', async ({
    page,
    context,
  }) => {
    await simularEntrega(page, { status: 503 });
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: -22.8105, longitude: -42.9805 });

    await page.locator('#entrega').scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: 'Usar minha localização' }).click();

    await expect(resultado(page)).toContainText('Sem pedido mínimo (estimativa)');
    await expect(resultado(page)).toContainText('em linha reta');
    await expect(resultado(page)).toContainText('temporariamente indisponível');
  });
});
