export const environment = {
  /**
   * Endereço da API usado pelo navegador. Em produção, site e API ficam no mesmo domínio, com a API em /api.
   * Se a API for publicada em outro domínio, coloque a URL completa e libere o site no CORS do back-end.
   */
  apiUrl: '/api',

  /** API usada na pré-renderização (build) quando a variável BORGONHA_API_URL não é informada. */
  apiUrlPrerenderizacao: 'http://localhost:5170/api',

  /**
   * Endereço público do site (ex.: https://www.borgonhaconfeitaria.com.br), usado na URL canônica,
   * na imagem de compartilhamento e nos dados estruturados. PENDENTE: definir o domínio.
   */
  siteUrl: '',
};
