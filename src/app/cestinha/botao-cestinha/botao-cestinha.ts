import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Cestinha, nomeDoItem, QUANTIDADE_MAXIMA } from '../../core/cestinha/cestinha';
import { Produto } from '../../core/modelos/catalogo';
import { Botao } from '../../ui/botao/botao';
import { Icone } from '../../ui/icone/icone';

/**
 * "Adicionar" à cestinha; depois de adicionado, vira o seletor de quantidade (− 2 +).
 * No 1, o "−" vira a lixeira e tira o item. Usado nos cards e na própria cestinha.
 */
@Component({
  selector: 'app-botao-cestinha',
  imports: [Botao, Icone],
  templateUrl: './botao-cestinha.html',
  styleUrl: './botao-cestinha.scss',
  host: { '[attr.data-tom]': 'tom()' },
})
export class BotaoCestinha {
  private readonly cestinha = inject(Cestinha);
  private readonly injector = inject(Injector);

  readonly produto = input.required<Produto>();
  /** Sabor escolhido, para produtos com variações. */
  readonly variacao = input<string | null>(null);
  /** `escuro`: sobre fundo vinho. */
  readonly tom = input<'claro' | 'escuro'>('claro');
  /** A pessoa tentou adicionar um produto com sabores sem escolher o sabor. */
  readonly faltouVariacao = output<void>();

  /**
   * No navegador, a quantidade só aparece depois da hidratação: o HTML pré-renderizado sempre tem o
   * botão "Adicionar" (a cestinha fica guardada no navegador de cada um).
   */
  private readonly montado = signal(false);
  private readonly botaoAdicionar = viewChild<ElementRef<HTMLButtonElement>>('botaoAdicionar');
  private readonly botaoMais = viewChild<ElementRef<HTMLButtonElement>>('botaoMais');

  protected readonly maximo = QUANTIDADE_MAXIMA;
  protected readonly nome = computed(() => nomeDoItem(this.produto(), this.variacao()));
  protected readonly quantidade = computed(() =>
    this.montado() ? this.cestinha.quantidadeDe(this.produto(), this.variacao()) : 0,
  );

  constructor() {
    afterNextRender(() => this.montado.set(true));
  }

  protected adicionar(): void {
    if (this.produto().variacoes.length > 0 && this.variacao() === null) {
      this.faltouVariacao.emit();
      return;
    }

    this.cestinha.adicionar(this.produto(), this.variacao());
    // O botão vira o seletor: o foco segue para o "+", em vez de se perder.
    this.focarDepois(this.botaoMais);
  }

  protected aumentar(): void {
    this.cestinha.alterarQuantidade(this.produto(), this.variacao(), 1);
  }

  protected diminuir(): void {
    const eraOUltimo = this.quantidade() === 1;
    this.cestinha.alterarQuantidade(this.produto(), this.variacao(), -1);
    if (eraOUltimo) {
      this.focarDepois(this.botaoAdicionar);
    }
  }

  private focarDepois(alvo: () => ElementRef<HTMLButtonElement> | undefined): void {
    afterNextRender(() => alvo()?.nativeElement.focus(), { injector: this.injector });
  }
}
