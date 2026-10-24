import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LojaStore } from '../../core/estado/loja-store';
import { TipoCanalPedido } from '../../core/modelos/loja';
import { Navegacao } from '../../core/navegacao/navegacao';
import { Pedido } from '../../core/pedido/pedido';
import { Botao } from '../../ui/botao/botao';
import { Icone } from '../../ui/icone/icone';
import { Logo } from '../../ui/logo/logo';
import { LINKS_DE_NAVEGACAO } from '../links-de-navegacao';

const NOME_CURTO_DO_CANAL: Record<TipoCanalPedido, string> = {
  whatsapp: 'WhatsApp',
  ifood: 'iFood',
  'loja-fisica': 'Loja física',
};

@Component({
  selector: 'app-rodape',
  imports: [Botao, Icone, Logo, RouterLink],
  templateUrl: './rodape.html',
  styleUrl: './rodape.scss',
})
export class Rodape {
  protected readonly loja = inject(LojaStore);
  protected readonly pedido = inject(Pedido);
  protected readonly navegacao = inject(Navegacao);

  protected readonly links = LINKS_DE_NAVEGACAO;
  protected readonly nomeCurtoDoCanal = NOME_CURTO_DO_CANAL;
  protected readonly canais = computed(() => this.pedido.opcoesPara(null));
  protected readonly ano = new Date().getFullYear();
  protected readonly origem = computed(() => {
    const endereco = this.loja.loja()?.endereco;
    return endereco ? `${endereco.bairro}, ${endereco.cidade} – ${endereco.uf}` : null;
  });
}
