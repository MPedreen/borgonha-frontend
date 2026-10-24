import { ImageLoaderConfig } from '@angular/common';
import { LARGURAS_IMAGEM } from './larguras-imagem';

const LARGURA_PADRAO = 640;

/**
 * Carregador do NgOptimizedImage: aponta para o arquivo WebP gerado na menor largura
 * que atende ao pedido (ex.: "cookies/nutella-partido" + 600px → /imagens/cookies/nutella-partido-640.webp).
 */
export function carregadorDeImagens(config: ImageLoaderConfig): string {
  const pedida = config.width ?? LARGURA_PADRAO;
  const largura =
    LARGURAS_IMAGEM.find((disponivel) => disponivel >= pedida) ?? LARGURAS_IMAGEM.at(-1);
  return `/imagens/${config.src}-${largura}.webp`;
}
