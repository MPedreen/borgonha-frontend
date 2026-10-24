import { booleanAttribute, Component, input, output } from '@angular/core';
import { OPCOES_DE_SITUACAO, SituacaoProduto } from '../core/modelos-admin';

/**
 * Escolha da situação do produto: no cardápio, esgotado ou oculto.
 * Um grupo de botões de rádio nativos (setas do teclado navegam entre as opções).
 */
@Component({
  selector: 'app-seletor-situacao',
  template: `
    <fieldset class="seletor" [disabled]="salvando()">
      <legend class="visualmente-oculto">Situação de {{ nomeDoProduto() }}</legend>
      @for (opcao of opcoes; track opcao.valor) {
        <label class="seletor__opcao" [attr.data-situacao]="opcao.valor">
          <input
            type="radio"
            [name]="'situacao-' + slug()"
            [value]="opcao.valor"
            [checked]="situacao() === opcao.valor"
            (change)="alterar.emit(opcao.valor)"
          />
          <span>{{ opcao.rotulo }}</span>
        </label>
      }
    </fieldset>
  `,
  styleUrl: './seletor-situacao.scss',
})
export class SeletorSituacao {
  readonly slug = input.required<string>();
  readonly nomeDoProduto = input.required<string>();
  readonly situacao = input.required<SituacaoProduto>();
  readonly salvando = input(false, { transform: booleanAttribute });

  readonly alterar = output<SituacaoProduto>();

  protected readonly opcoes = OPCOES_DE_SITUACAO;
}
