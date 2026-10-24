import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { CatalogoStore } from '../../../core/estado/catalogo-store';
import { Produto } from '../../../core/modelos/catalogo';
import { Navegacao } from '../../../core/navegacao/navegacao';
import { Icone } from '../../../ui/icone/icone';
import { ImagemProduto } from '../../../ui/imagem-produto/imagem-produto';

const ATRASO_ABRIR_MS = 120;
const ATRASO_FECHAR_MS = 220;

/**
 * Menu "Cookies" do cabeçalho (computador): mostra todos os sabores com foto.
 * Abre ao passar o mouse ou pelo teclado (Enter/Espaço) e fecha com Esc ou clicando fora.
 */
@Component({
  selector: 'app-menu-sabores',
  imports: [Icone, ImagemProduto],
  templateUrl: './menu-sabores.html',
  styleUrl: './menu-sabores.scss',
  host: {
    '(pointerenter)': 'aoEntrarComMouse($event)',
    '(pointerleave)': 'aoSairComMouse($event)',
    '(focusout)': 'aoPerderFoco($event)',
    '(keydown.escape)': 'fechar(true)',
    '(document:click)': 'aoClicarNaPagina($event)',
  },
})
export class MenuSabores {
  protected readonly catalogo = inject(CatalogoStore);
  private readonly navegacao = inject(Navegacao);
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly gatilho = viewChild.required<ElementRef<HTMLButtonElement>>('gatilho');
  private temporizador?: ReturnType<typeof setTimeout>;

  protected readonly aberto = signal(false);

  /** Pelo teclado (detail 0) alterna; com o mouse o menu já abriu ao passar por cima. */
  protected aoClicarNoGatilho(evento: MouseEvent): void {
    clearTimeout(this.temporizador);
    this.aberto.update((aberto) => (evento.detail === 0 ? !aberto : true));
  }

  protected fechar(devolverFoco = false): void {
    clearTimeout(this.temporizador);
    if (devolverFoco && this.aberto()) {
      this.gatilho().nativeElement.focus();
    }
    this.aberto.set(false);
  }

  protected aoEntrarComMouse(evento: PointerEvent): void {
    if (evento.pointerType === 'mouse') {
      clearTimeout(this.temporizador);
      this.temporizador = setTimeout(() => this.aberto.set(true), ATRASO_ABRIR_MS);
    }
  }

  protected aoSairComMouse(evento: PointerEvent): void {
    if (evento.pointerType === 'mouse') {
      clearTimeout(this.temporizador);
      this.temporizador = setTimeout(() => this.aberto.set(false), ATRASO_FECHAR_MS);
    }
  }

  protected aoPerderFoco(evento: FocusEvent): void {
    if (!this.elemento.contains(evento.relatedTarget as Node | null)) {
      this.fechar();
    }
  }

  protected aoClicarNaPagina(evento: MouseEvent): void {
    if (this.aberto() && !this.elemento.contains(evento.target as Node | null)) {
      this.fechar();
    }
  }

  protected irParaSabor(evento: Event, cookie: Produto): void {
    this.fechar();
    this.navegacao.irParaProduto(evento, cookie.slug);
  }

  protected irParaCardapio(evento: Event): void {
    this.fechar();
    this.navegacao.irPara(evento, 'cookies');
  }
}
