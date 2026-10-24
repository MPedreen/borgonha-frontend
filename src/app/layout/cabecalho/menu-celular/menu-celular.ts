import { Component, inject, input, output } from '@angular/core';
import { CatalogoStore } from '../../../core/estado/catalogo-store';
import { LojaStore } from '../../../core/estado/loja-store';
import { Navegacao } from '../../../core/navegacao/navegacao';
import { Pedido } from '../../../core/pedido/pedido';
import { Botao } from '../../../ui/botao/botao';
import { Dialogo } from '../../../ui/dialogo/dialogo';
import { Icone } from '../../../ui/icone/icone';
import { ImagemProduto } from '../../../ui/imagem-produto/imagem-produto';
import { LINKS_DE_NAVEGACAO } from '../../links-de-navegacao';

/**
 * Menu em tela cheia do celular, com todos os sabores de cookie.
 * As ações (rolar até uma seção, abrir o pedido) acontecem depois que o menu fecha,
 * para o foco e a rolagem não brigarem com o diálogo.
 */
@Component({
  selector: 'app-menu-celular',
  imports: [Botao, Dialogo, Icone, ImagemProduto],
  templateUrl: './menu-celular.html',
  styleUrl: './menu-celular.scss',
})
export class MenuCelular {
  readonly aberto = input.required<boolean>();
  readonly fechado = output<void>();

  protected readonly catalogo = inject(CatalogoStore);
  protected readonly loja = inject(LojaStore);
  private readonly pedido = inject(Pedido);
  private readonly navegacao = inject(Navegacao);

  protected readonly links = LINKS_DE_NAVEGACAO.filter((link) => link.id !== 'cookies');
  private acaoAoFechar: (() => void) | null = null;

  protected irPara(evento: Event, id: string): void {
    this.fecharEDepois(evento, () => this.navegacao.rolarAte(id));
  }

  protected irParaSabor(evento: Event, slug: string): void {
    this.fecharEDepois(evento, () => this.navegacao.rolarAteProduto(slug));
  }

  protected pedir(): void {
    this.acaoAoFechar = () => this.pedido.abrir();
    this.fechado.emit();
  }

  /** Chamado quando o <dialog> terminou de fechar (o foco já voltou para o botão do menu). */
  protected aoFecharDialogo(): void {
    const acao = this.acaoAoFechar;
    this.acaoAoFechar = null;
    this.fechado.emit();
    acao?.();
  }

  private fecharEDepois(evento: Event, acao: () => void): void {
    if (!this.navegacao.naPaginaInicial()) {
      return;
    }
    evento.preventDefault();
    this.acaoAoFechar = acao;
    this.fechado.emit();
  }
}
