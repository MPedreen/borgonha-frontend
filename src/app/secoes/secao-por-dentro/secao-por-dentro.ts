import { Component, inject } from '@angular/core';
import { BotaoCestinha } from '../../cestinha/botao-cestinha/botao-cestinha';
import { CatalogoStore } from '../../core/estado/catalogo-store';
import { Pedido } from '../../core/pedido/pedido';
import { Botao } from '../../ui/botao/botao';
import { CabecalhoSecao } from '../../ui/cabecalho-secao/cabecalho-secao';
import { ImagemProduto } from '../../ui/imagem-produto/imagem-produto';
import { TrilhoHorizontal } from '../../ui/trilho-horizontal/trilho-horizontal';

/** Galeria dos cookies partidos ao meio, sob um "toldo" listrado como o da loja. */
@Component({
  selector: 'app-secao-por-dentro',
  imports: [Botao, BotaoCestinha, CabecalhoSecao, ImagemProduto, TrilhoHorizontal],
  templateUrl: './secao-por-dentro.html',
  styleUrl: './secao-por-dentro.scss',
})
export class SecaoPorDentro {
  protected readonly catalogo = inject(CatalogoStore);
  protected readonly pedido = inject(Pedido);
}
