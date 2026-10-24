import { expect, test } from '@playwright/test';

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
  await expect(page.getByRole('heading', { name: 'Bateu fome de salgado?' })).toBeVisible();
});

test('avisa que o cardápio é semanal: o que está no site é o que tem hoje', async ({ page }) => {
  const aviso = page.getByRole('note', { name: /Cardápio da semana/ });

  await expect(aviso).toContainText('Tudo o que aparece aqui está disponível hoje');
  await expect(aviso).toContainText(/hoje, (\S+-feira|sábado|domingo), \d+ de /);
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
