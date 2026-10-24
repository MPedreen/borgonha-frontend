import { DOCUMENT, ViewportScroller } from '@angular/common';
import { inject, Service, signal } from '@angular/core';
import { Router } from '@angular/router';

const DURACAO_DESTAQUE_MS = 2400;

/**
 * Rolagem até as seções da página (âncoras), com foco para quem navega pelo teclado
 * e um destaque rápido no produto escolhido no menu de sabores.
 */
@Service()
export class Navegacao {
  private readonly router = inject(Router);
  private readonly rolagem = inject(ViewportScroller);
  private readonly documento = inject(DOCUMENT);
  private temporizadorDestaque?: ReturnType<typeof setTimeout>;

  /** Slug do produto destacado no momento. */
  readonly produtoDestacado = signal<string | null>(null);

  naPaginaInicial(): boolean {
    return this.router.url.split('#')[0] === '/';
  }

  /** Para links "/#id": na página inicial rola até a seção; fora dela, deixa o link seguir. */
  irPara(evento: Event, id: string): void {
    if (this.naPaginaInicial()) {
      evento.preventDefault();
      this.rolarAte(id);
    }
  }

  irParaProduto(evento: Event, slug: string): void {
    if (this.naPaginaInicial()) {
      evento.preventDefault();
      this.rolarAteProduto(slug);
    }
  }

  /** Rola até a seção e leva o foco do teclado para ela. */
  rolarAte(id: string, alvoDoFoco = id): void {
    this.rolagem.scrollToAnchor(id);
    this.documento.getElementById(alvoDoFoco)?.focus({ preventScroll: true });
  }

  rolarAteProduto(slug: string): void {
    this.rolarAte(`produto-${slug}`, `titulo-produto-${slug}`);

    clearTimeout(this.temporizadorDestaque);
    this.produtoDestacado.set(slug);
    this.temporizadorDestaque = setTimeout(
      () => this.produtoDestacado.set(null),
      DURACAO_DESTAQUE_MS,
    );
  }
}
