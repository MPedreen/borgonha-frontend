import { DOCUMENT } from '@angular/common';
import { afterNextRender, Component, DestroyRef, inject, signal } from '@angular/core';
import { Navegacao } from '../../core/navegacao/navegacao';
import { Pedido } from '../../core/pedido/pedido';
import { Botao } from '../../ui/botao/botao';
import { Icone } from '../../ui/icone/icone';
import { Logo } from '../../ui/logo/logo';
import { LINKS_DE_NAVEGACAO } from '../links-de-navegacao';
import { MenuCelular } from './menu-celular/menu-celular';
import { MenuSabores } from './menu-sabores/menu-sabores';

/** Cabeçalho fixo: vira uma "cápsula" flutuante quando a página rola. */
@Component({
  selector: 'app-cabecalho',
  imports: [Botao, Icone, Logo, MenuCelular, MenuSabores],
  templateUrl: './cabecalho.html',
  styleUrl: './cabecalho.scss',
})
export class Cabecalho {
  protected readonly pedido = inject(Pedido);
  protected readonly navegacao = inject(Navegacao);

  /** No computador, "Cookies" é o menu de sabores; os demais links aparecem ao lado. */
  protected readonly links = LINKS_DE_NAVEGACAO.filter((link) => link.id !== 'cookies');
  protected readonly rolou = signal(false);
  protected readonly menuCelularAberto = signal(false);

  constructor() {
    const documento = inject(DOCUMENT);
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const janela = documento.defaultView;
      if (!janela) {
        return;
      }

      const atualizar = () => this.rolou.set(janela.scrollY > 24);
      atualizar();
      janela.addEventListener('scroll', atualizar, { passive: true });
      destroyRef.onDestroy(() => janela.removeEventListener('scroll', atualizar));
    });
  }
}
