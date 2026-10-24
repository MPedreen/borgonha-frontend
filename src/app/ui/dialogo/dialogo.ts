import { afterRenderEffect, Component, ElementRef, input, output, viewChild } from '@angular/core';

/**
 * Diálogo modal sobre o <dialog> nativo: prende o foco, fecha com Esc e devolve o foco
 * a quem o abriu. No celular, o formato "painel" vira uma gaveta que sobe de baixo.
 */
@Component({
  selector: 'app-dialogo',
  template: `
    <dialog #dialogo class="dialogo" [attr.aria-labelledby]="idTitulo()" (close)="fechado.emit()">
      <ng-content />
    </dialog>
  `,
  styleUrl: './dialogo.scss',
  host: {
    '[attr.data-formato]': 'formato()',
    // Clique no fundo escurecido (pelo teclado, o Esc nativo do <dialog> faz o mesmo).
    '(click)': 'fecharAoClicarFora($event)',
  },
})
export class Dialogo {
  readonly aberto = input.required<boolean>();
  /** Id do título que nomeia o diálogo para leitores de tela. */
  readonly idTitulo = input.required<string>();
  readonly formato = input<'painel' | 'tela-cheia'>('painel');
  readonly fechado = output<void>();

  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  constructor() {
    afterRenderEffect(() => {
      const elemento = this.dialogo().nativeElement;
      if (this.aberto() && !elemento.open) {
        elemento.showModal();
      } else if (!this.aberto() && elemento.open) {
        elemento.close();
      }
    });
  }

  /** O clique no fundo escurecido chega no próprio <dialog>. */
  protected fecharAoClicarFora(evento: MouseEvent): void {
    const elemento = this.dialogo().nativeElement;
    if (evento.target === elemento) {
      elemento.close();
    }
  }
}
