import { ImageLoaderConfig } from '@angular/common';
import { environment } from '../../../environments/environment';
import { LARGURAS_IMAGEM } from './larguras-imagem';

const LARGURA_PADRAO = 640;

/** Fotos enviadas pela área do administrador: ficam na API, e não junto do site. */
const PREFIXO_DOS_ENVIOS = 'envios/';

/**
 * Carregador do NgOptimizedImage: aponta para o arquivo WebP gerado na menor largura
 * que atende ao pedido (ex.: "cookies/nutella-partido" + 600px → /imagens/cookies/nutella-partido-640.webp).
 * As fotos enviadas pelo administrador ("envios/…") vêm da API, nas mesmas larguras.
 */
export function carregadorDeImagens(config: ImageLoaderConfig): string {
  const pedida = config.width ?? LARGURA_PADRAO;
  const largura =
    LARGURAS_IMAGEM.find((disponivel) => disponivel >= pedida) ?? LARGURAS_IMAGEM.at(-1);
  const arquivo = `${config.src}-${largura}.webp`;

  return config.src.startsWith(PREFIXO_DOS_ENVIOS)
    ? `${environment.apiUrl}/imagens/${arquivo}`
    : `/imagens/${arquivo}`;
}
