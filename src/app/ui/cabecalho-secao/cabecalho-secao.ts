import { Component, input } from '@angular/core';
import { Selo } from '../selo/selo';

/** Sobretítulo + título (H2) + texto de apoio, usado no topo de todas as seções. */
@Component({
  selector: 'app-cabecalho-secao',
  imports: [Selo],
  template: `
    <p class="sobretitulo">{{ sobretitulo() }}</p>
    <h2 class="titulo" [id]="idTitulo()">
      {{ titulo() }}
      @if (destaque(); as palavra) {
        <app-selo [tom]="tom() === 'escuro' ? 'creme' : 'vinho'">{{ palavra }}</app-selo>
      }
    </h2>
    @if (texto(); as descricao) {
      <p class="texto">{{ descricao }}</p>
    }
  `,
  styleUrl: './cabecalho-secao.scss',
  host: {
    '[attr.data-alinhamento]': 'alinhamento()',
    '[attr.data-tom]': 'tom()',
  },
})
export class CabecalhoSecao {
  readonly sobretitulo = input.required<string>();
  readonly titulo = input.required<string>();
  /** Id do H2, para o aria-labelledby da seção. */
  readonly idTitulo = input.required<string>();
  /** Palavra final destacada no selo inclinado. */
  readonly destaque = input<string>();
  readonly texto = input<string>();
  readonly alinhamento = input<'esquerda' | 'centro'>('esquerda');
  readonly tom = input<'claro' | 'escuro'>('claro');
}
