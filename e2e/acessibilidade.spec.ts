import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

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
