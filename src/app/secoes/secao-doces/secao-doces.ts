import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { CatalogoStore } from '../../core/estado/catalogo-store';
import { Pedido } from '../../core/pedido/pedido';
import { Botao } from '../../ui/botao/botao';
import { CabecalhoSecao } from '../../ui/cabecalho-secao/cabecalho-secao';
import { CartaoProduto } from '../../ui/cartao-produto/cartao-produto';
import { Icone } from '../../ui/icone/icone';
import { Revelar } from '../../ui/revelar/revelar';

/** Quantos doces aparecem antes do botão "Ver todos" (três fileiras no computador). */
const DOCES_VISIVEIS = 6;

/**
 * Os outros doces, numa lista compacta de cardápio (foto pequena ao lado do texto). Com muitos
 * doces, os primeiros aparecem e o resto fica atrás do botão "Ver todos": todos continuam no HTML,
 * só escondidos, e os buscadores enxergam o cardápio inteiro.
 */
@Component({
  selector: 'app-secao-doces',
  imports: [Botao, CabecalhoSecao, CartaoProduto, Icone, Revelar],
  templateUrl: './secao-doces.html',
  styleUrl: './secao-doces.scss',
})
export class SecaoDoces {
  protected readonly catalogo = inject(CatalogoStore);
  protected readonly pedido = inject(Pedido);
  private readonly injector = inject(Injector);

  protected readonly visiveis = DOCES_VISIVEIS;
  protected readonly expandido = signal(false);
  protected readonly temMais = computed(() => this.catalogo.doces().length > DOCES_VISIVEIS);

  private readonly lista = viewChild.required<ElementRef<HTMLElement>>('lista');
  private readonly botaoVerTodos = viewChild<ElementRef<HTMLButtonElement>>('verTodos');

  protected alternar(): void {
    const abrindo = !this.expandido();
    this.expandido.set(abrindo);

    afterNextRender(
      () => {
        if (abrindo) {
          // Quem navega pelo teclado ou leitor de tela continua do primeiro doce que apareceu.
          this.lista()
            .nativeElement.querySelector<HTMLElement>(`li:nth-child(${DOCES_VISIVEIS + 1}) h3`)
            ?.focus();
        } else {
          // A lista encolheu: o botão volta para a tela.
          this.botaoVerTodos()?.nativeElement.scrollIntoView({ block: 'nearest' });
        }
      },
      { injector: this.injector },
    );
  }
}
