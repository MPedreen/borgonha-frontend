import { booleanAttribute, Directive, input } from '@angular/core';

export type VarianteBotao = 'primario' | 'contorno' | 'creme' | 'link';
export type TamanhoBotao = 'normal' | 'compacto' | 'grande';

/**
 * Aplica o visual de botão da marca a um <button> ou <a>, mantendo a semântica nativa.
 * Os estilos ficam em `src/styles/_botao.scss`.
 */
@Directive({
  selector: 'button[appBotao], a[appBotao]',
  host: {
    class: 'botao',
    '[class.botao--contorno]': "variante() === 'contorno'",
    '[class.botao--creme]': "variante() === 'creme'",
    '[class.botao--link]': "variante() === 'link'",
    '[class.botao--compacto]': "tamanho() === 'compacto'",
    '[class.botao--grande]': "tamanho() === 'grande'",
    '[class.botao--largo]': 'largo()',
  },
})
export class Botao {
  readonly variante = input<VarianteBotao>('primario');
  readonly tamanho = input<TamanhoBotao>('normal');
  readonly largo = input(false, { transform: booleanAttribute });
}
