import { NgOptimizedImage } from '@angular/common';
import { booleanAttribute, Component, input } from '@angular/core';
import { LARGURAS_IMAGEM } from '../../core/imagens/larguras-imagem';
import { Imagem } from '../../core/modelos/catalogo';
import { Icone } from '../icone/icone';

export type FormatoImagem = 'cookie' | 'miniatura' | 'retrato' | 'paisagem';

/** As mesmas larguras geradas por `npm run imagens` (ex.: "160w, 320w, ..."). */
const SRCSET = LARGURAS_IMAGEM.map((largura) => `${largura}w`).join(', ');

/**
 * Foto de produto otimizada (srcset em WebP). Sem foto, mostra um espaço reservado
 * com um cookie desenhado — usado nas fotos que ainda estão pendentes.
 */
@Component({
  selector: 'app-imagem-produto',
  imports: [NgOptimizedImage, Icone],
  template: `
    @if (imagem(); as foto) {
      <img
        [ngSrc]="foto.caminho"
        [ngSrcset]="srcset"
        [sizes]="tamanhos()"
        [alt]="foto.alt"
        [priority]="prioridade()"
        fill
      />
    } @else {
      <span class="pendente" aria-hidden="true"><app-icone nome="cookie" /></span>
    }
  `,
  styleUrl: './imagem-produto.scss',
  host: {
    '[attr.data-formato]': 'formato()',
    '[class.com-anel]': 'anel()',
  },
})
export class ImagemProduto {
  readonly imagem = input<Imagem | null>(null);
  readonly formato = input<FormatoImagem>('retrato');
  /** Atributo `sizes`: quanto da tela a imagem ocupa. */
  readonly tamanhos = input('(min-width: 960px) 30vw, 90vw');
  /** Para a imagem principal da dobra inicial (pré-carregada). */
  readonly prioridade = input(false, { transform: booleanAttribute });
  /** Anel tracejado em volta do cookie, que gira quando o card recebe o mouse. */
  readonly anel = input(false, { transform: booleanAttribute });

  protected readonly srcset = SRCSET;
}
