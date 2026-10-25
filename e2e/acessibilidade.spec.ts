import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { simularEntrega } from './entrega-simulada';

const REGRAS_WCAG_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

test('a página inicial não tem problemas de acessibilidade (WCAG 2.2 AA)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  const resultado = await new AxeBuilder({ page }).withTags(REGRAS_WCAG_AA).analyze();

  expect(resultado.violations).toEqual([]);
});

test('o painel "Faça seu pedido" aberto não tem problemas de acessibilidade', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page
    .getByRole('button', { name: /Faça seu pedido/ })
    .first()
    .click();
  await expect(page.getByRole('dialog', { name: 'Faça seu pedido' })).toBeVisible();

  const resultado = await new AxeBuilder({ page })
    .withTags(REGRAS_WCAG_AA)
    .include('dialog')
    .analyze();

  expect(resultado.violations).toEqual([]);
});

test('a consulta de entrega, com sugestões e resultado, não tem problemas de acessibilidade', async ({
  page,
}) => {
  await simularEntrega(page, {
    conferir: () => ({
      situacao: 'incerta',
      distanciaEmMetros: 1500,
      distanciaEmLinhaRetaEmMetros: 1150,
    }),
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.locator('#entrega').scrollIntoViewIfNeeded();
  const campo = page.getByRole('combobox', { name: 'Rua e número' });
  await campo.pressSequentially('rua afranio peixoto 40');
  await expect(page.getByRole('listbox')).toBeVisible();
  await campo.press('ArrowDown');

  const comSugestoes = await new AxeBuilder({ page })
    .withTags(REGRAS_WCAG_AA)
    .include('#entrega')
    .analyze();
  expect(comSugestoes.violations).toEqual([]);

  await campo.press('Enter');
  await expect(page.locator('#entrega .resultado')).toContainText('Perto do limite');
  const comResultado = await new AxeBuilder({ page })
    .withTags(REGRAS_WCAG_AA)
    .include('#entrega')
    .analyze();
  expect(comResultado.violations).toEqual([]);
});

test('a consulta de entrega com o serviço indisponível não tem problemas de acessibilidade', async ({
  page,
}) => {
  await simularEntrega(page, { status: 503 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.locator('#entrega').scrollIntoViewIfNeeded();
  await page.getByRole('combobox', { name: 'Rua e número' }).pressSequentially('rua afranio');
  await expect(page.locator('#entrega [data-teste="aviso-de-falha"]')).toBeVisible();

  const resultado = await new AxeBuilder({ page })
    .withTags(REGRAS_WCAG_AA)
    .include('#entrega')
    .analyze();
  expect(resultado.violations).toEqual([]);
});

test('a tela de login da área do administrador não tem problemas de acessibilidade', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/admin/entrar');
  await expect(page.getByRole('heading', { name: 'Área do administrador' })).toBeVisible();

  // Com os erros de validação à mostra, que também precisam ser acessíveis.
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText('Informe o usuário.')).toBeVisible();

  const resultado = await new AxeBuilder({ page }).withTags(REGRAS_WCAG_AA).analyze();

  expect(resultado.violations).toEqual([]);
});
