import { carregadorDeImagens } from './carregador-de-imagens';

describe('carregadorDeImagens', () => {
  it('usa o menor arquivo gerado que atende à largura pedida', () => {
    expect(carregadorDeImagens({ src: 'cookies/nutella-partido', width: 600 })).toBe(
      '/imagens/cookies/nutella-partido-640.webp',
    );
    expect(carregadorDeImagens({ src: 'cookies/nutella-partido', width: 160 })).toBe(
      '/imagens/cookies/nutella-partido-160.webp',
    );
  });

  it('usa o maior arquivo quando a largura passa do limite', () => {
    expect(carregadorDeImagens({ src: 'doces/brookie', width: 3000 })).toBe(
      '/imagens/doces/brookie-1600.webp',
    );
  });

  it('usa uma largura média quando nenhuma é informada', () => {
    expect(carregadorDeImagens({ src: 'doces/brookie' })).toBe('/imagens/doces/brookie-640.webp');
  });
});
