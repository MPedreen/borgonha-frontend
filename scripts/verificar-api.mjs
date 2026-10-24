// Executado antes do build: a pré-renderização busca o cardápio na API, então ela precisa estar no ar.
const apiUrl = process.env.BORGONHA_API_URL ?? 'http://localhost:5170/api';

try {
  const resposta = await fetch(`${apiUrl}/loja`, { signal: AbortSignal.timeout(10_000) });
  if (!resposta.ok) {
    throw new Error(`HTTP ${resposta.status}`);
  }
  console.log(`API disponível em ${apiUrl}`);
} catch (erro) {
  console.error(
    [
      '',
      `A API não respondeu em ${apiUrl} (${erro.message}).`,
      'Suba o back-end antes do build:  dotnet run --project ../backend/src/Borgonha.Api',
      'ou informe outro endereço na variável BORGONHA_API_URL.',
      '',
    ].join('\n'),
  );
  process.exit(1);
}
