import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Cestinha } from '../../core/cestinha/cestinha';
import { emReais } from '../../core/cestinha/mensagem-do-pedido';
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

  protected readonly cestinha = inject(Cestinha);
  protected readonly totalDaCestinha = computed(() => emReais(this.cestinha.totalEmCentavos()));
  protected readonly rotuloDaCestinha = computed(() => {
    const quantidade = this.cestinha.quantidadeTotal();
    return quantidade === 0
      ? 'Cestinha (vazia)'
      : `Cestinha: ${quantidade} ${quantidade === 1 ? 'item' : 'itens'}, ${this.totalDaCestinha()}`;
  });
  /** O botão da cestinha dá um pulinho quando entra um item. */
  protected readonly pulando = signal(false);

  constructor() {
    const documento = inject(DOCUMENT);
    const destroyRef = inject(DestroyRef);

    let quantidadeAntes = 0;
    let fimDoPulo: ReturnType<typeof setTimeout> | undefined;
    effect(() => {
      const quantidade = this.cestinha.quantidadeTotal();
      if (quantidade > quantidadeAntes) {
        clearTimeout(fimDoPulo);
        this.pulando.set(true);
        fimDoPulo = setTimeout(() => this.pulando.set(false), 450);
      }
      quantidadeAntes = quantidade;
    });
    destroyRef.onDestroy(() => clearTimeout(fimDoPulo));

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
