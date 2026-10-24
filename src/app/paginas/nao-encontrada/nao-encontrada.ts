import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Botao } from '../../ui/botao/botao';

@Component({
  selector: 'app-nao-encontrada',
  imports: [Botao, RouterLink],
  template: `
    <section class="secao nao-encontrada" aria-labelledby="titulo-nao-encontrada">
      <div class="container">
        <p class="codigo" aria-hidden="true">404</p>
        <h1 id="titulo-nao-encontrada" class="titulo">Essa página não está no forno.</h1>
        <p>O endereço que você procurou não existe ou mudou de lugar.</p>
        <a appBotao routerLink="/">Voltar para o início</a>
      </div>
    </section>
  `,
  styles: `
    .container {
      display: grid;
      justify-items: center;
      gap: 1.25rem;
      text-align: center;
    }

    .codigo {
      color: var(--cor-vinho);
      font-size: clamp(5rem, 20vw, 10rem);
      font-weight: 900;
      line-height: 0.9;
    }

    .titulo {
      font-size: var(--tamanho-titulo);
      text-transform: uppercase;
    }
  `,
})
export class NaoEncontrada {}
