import { afterNextRender, Component, signal } from '@angular/core';
import { formatarDia } from '../../core/formatacao/formatacao';
import { Icone } from '../../ui/icone/icone';

/**
 * Avisa que o cardápio é semanal: o que está no site é o que tem hoje.
 * A data só aparece no navegador (o HTML pré-renderizado não sabe em que dia vai ser lido).
 */
@Component({
  selector: 'app-aviso-cardapio-semanal',
  imports: [Icone],
  template: `
    <div class="aviso" role="note" aria-labelledby="titulo-cardapio-semanal">
      <span class="aviso__icone"><app-icone nome="calendar-heart" /></span>
      <div>
        <p id="titulo-cardapio-semanal" class="aviso__titulo">
          Cardápio da semana
          @if (hoje(); as dia) {
            <span class="aviso__dia">· hoje, {{ dia }}</span>
          }
        </p>
        <p class="aviso__texto">
          Nosso cardápio muda toda semana. Tudo o que aparece aqui está disponível hoje e, se algum
          doce esgotar, a gente atualiza o site na hora.
        </p>
      </div>
    </div>
  `,
  styles: `
    .aviso {
      display: flex;
      align-items: center;
      gap: 1rem;
      max-width: 46rem;
      margin: 0 auto clamp(2.5rem, 5vw, 3.5rem);
      padding: 1rem 1.25rem;
      border: 2px dashed var(--cor-vinho);
      border-radius: var(--raio-g);
      background-color: var(--cor-creme-escuro);
    }

    .aviso__icone {
      display: grid;
      flex: none;
      place-items: center;
      inline-size: 3rem;
      block-size: 3rem;
      border-radius: 50%;
      background-color: var(--cor-vinho);
      color: var(--cor-creme);
      font-size: 1.375rem;
    }

    .aviso__titulo {
      color: var(--cor-vinho);
      font-weight: 800;
      letter-spacing: var(--espacamento-maiusculas);
      text-transform: uppercase;
      font-size: var(--tamanho-pequeno);
    }

    .aviso__dia {
      font-weight: 600;
      letter-spacing: normal;
      text-transform: none;
    }

    .aviso__texto {
      margin-top: 0.25rem;
      font-size: var(--tamanho-pequeno);
      line-height: 1.5;
    }
  `,
})
export class AvisoCardapioSemanal {
  protected readonly hoje = signal<string | null>(null);

  constructor() {
    afterNextRender(() => this.hoje.set(formatarDia(new Date())));
  }
}
