import { Component, inject } from '@angular/core';
import { Imagem } from '../../core/modelos/catalogo';
import { Navegacao } from '../../core/navegacao/navegacao';
import { Pedido } from '../../core/pedido/pedido';
import { Botao } from '../../ui/botao/botao';
import { Icone } from '../../ui/icone/icone';
import { ImagemProduto } from '../../ui/imagem-produto/imagem-produto';
import { Selo } from '../../ui/selo/selo';

/** Primeira dobra: o conceito "Parte ao meio" com o cookie de Nutella escorrendo. */
@Component({
  selector: 'app-hero',
  imports: [Botao, Icone, ImagemProduto, Selo],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class Hero {
  protected readonly pedido = inject(Pedido);
  protected readonly navegacao = inject(Navegacao);

  protected readonly foto: Imagem = {
    caminho: 'cookies/nutella-partido',
    alt: 'Cookie de Nutella partido ao meio, com a Nutella escorrendo',
  };
}
