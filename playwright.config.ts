import { defineConfig, devices } from '@playwright/test';

const noCi = Boolean(process.env['CI']);

/**
 * Testes de ponta a ponta: sobem a API e o site (ou reaproveitam os que já estão rodando).
 * Localmente usam o Microsoft Edge instalado; no CI, o Chromium do Playwright.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: noCi,
  retries: noCi ? 2 : 0,
  reporter: noCi ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4200',
    channel: noCi ? undefined : 'msedge',
    locale: 'pt-BR',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'computador', use: { ...devices['Desktop Chrome'] } },
    { name: 'celular', use: { ...devices['Pixel 7'] } },
  ],
  webServer: [
    {
      // Sempre reaproveita: no CI, a API sobe antes do build de produção, que usa os dados dela.
      command: 'dotnet run --project ../backend/src/Borgonha.Api --launch-profile http',
      url: 'http://localhost:5170/health',
      reuseExistingServer: true,
      timeout: 180_000,
    },
    {
      command: 'npm start',
      url: 'http://localhost:4200',
      reuseExistingServer: !noCi,
      timeout: 180_000,
    },
  ],
});
