import { DOCUMENT } from '@angular/common';
import { afterNextRender, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { Cestinha } from '../../core/cestinha/cestinha';
import { emReais } from '../../core/cestinha/mensagem-do-pedido';
import { Pedido } from '../../core/pedido/pedido';
import { Botao } from '../../ui/botao/botao';
import { Icone } from '../../ui/icone/icone';

/** Seções que já têm o próprio botão de pedido: enquanto aparecem na tela, a barra some. */
const SECOES_COM_BOTAO = ['#inicio', '#pedido', 'app-rodape > footer'];

/** Botão fixo no rodapé da tela do celular: "Faça seu pedido" ou, com itens na cestinha, "Ver cestinha". */
@Component({
  selector: 'app-barra-pedido-celular',
  imports: [Botao, Icone],
  template: `
    <div
      class="barra"
      [class.barra--visivel]="visivel()"
      [attr.aria-hidden]="!visivel()"
      [inert]="!visivel()"
    >
      @if (cestinha.quantidadeTotal() > 0) {
        <button type="button" appBotao largo tamanho="grande" (click)="cestinha.abrir()">
          <app-icone nome="shopping-basket" />
          Ver cestinha ({{ cestinha.quantidadeTotal() }}) · {{ total() }}
        </button>
      } @else {
        <button type="button" appBotao largo tamanho="grande" (click)="pedido.abrir()">
          Faça seu pedido <app-icone nome="arrow-right" />
        </button>
      }
    </div>
  `,
  styleUrl: './barra-pedido-celular.scss',
})
export class BarraPedidoCelular {
  protected readonly pedido = inject(Pedido);
  protected readonly cestinha = inject(Cestinha);
  protected readonly total = computed(() => emReais(this.cestinha.totalEmCentavos()));
  protected readonly visivel = signal(false);

  constructor() {
    const documento = inject(DOCUMENT);
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const janela = documento.defaultView;
      if (!janela || !('IntersectionObserver' in janela)) {
        return;
      }

      const naTela = new Set<Element>();
      const observador = new janela.IntersectionObserver((entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) {
            naTela.add(entrada.target);
          } else {
            naTela.delete(entrada.target);
          }
        }
        this.visivel.set(naTela.size === 0);
      });

      for (const seletor of SECOES_COM_BOTAO) {
        const secao = documento.querySelector(seletor);
        if (secao) {
          observador.observe(secao);
        }
      }
      destroyRef.onDestroy(() => observador.disconnect());
    });
  }
}
