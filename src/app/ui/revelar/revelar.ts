import {
  afterNextRender,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  numberAttribute,
} from '@angular/core';

/**
 * Faz o elemento surgir suavemente quando entra na tela. Elementos que já estão visíveis
 * ao carregar não animam, e nada anima para quem pediu menos movimento ao sistema.
 * Uso: `<li appRevelar>` ou `<li [appRevelar]="120">` (atraso em ms, para efeito cascata).
 */
@Directive({
  selector: '[appRevelar]',
  host: {
    class: 'revelar',
    '[style.--revelar-atraso.ms]': 'atraso()',
  },
})
export class Revelar {
  readonly atraso = input(0, {
    alias: 'appRevelar',
    transform: (valor: unknown) => numberAttribute(valor, 0),
  });

  constructor() {
    const elemento = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const janela = elemento.ownerDocument.defaultView;
      if (
        !janela ||
        !('IntersectionObserver' in janela) ||
        janela.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      ) {
        return;
      }

      if (elemento.getBoundingClientRect().top < janela.innerHeight) {
        return;
      }

      elemento.classList.add('revelar-pendente');
      const observador = new janela.IntersectionObserver(
        ([entrada]) => {
          if (entrada.isIntersecting) {
            elemento.classList.remove('revelar-pendente');
            observador.disconnect();
          }
        },
        { rootMargin: '0px 0px -8% 0px' },
      );
      observador.observe(elemento);
      destroyRef.onDestroy(() => observador.disconnect());
    });
  }
}
