import { computed, Service } from '@angular/core';
import { recursoDaApi } from '../api/recurso-da-api';
import { Catalogo, Produto } from '../modelos/catalogo';

/** Cardápio compartilhado pelo menu de sabores e pelas seções da página. */
@Service()
export class CatalogoStore {
  private readonly recurso = recursoDaApi<Catalogo>('catalogo');

  /** Ainda não há cardápio para mostrar. */
  readonly carregando = computed(() => this.recurso.carregando() && !this.recurso.dados());

  /** Não foi possível carregar o cardápio e não há uma versão anterior. */
  readonly indisponivel = computed(() => this.recurso.falhou() && !this.recurso.dados());

  readonly cookies = computed(() => this.produtosDa('cookies'));
  readonly doces = computed(() => this.produtosDa('doces'));
  readonly salgados = computed(() => this.produtosDa('salgados'));

  /** Cookies que já têm foto partido ao meio. */
  readonly cookiesPartidos = computed(() =>
    this.cookies().filter((cookie) => cookie.imagens.partido),
  );

  recarregar(): void {
    this.recurso.recarregar();
  }

  private produtosDa(categoria: string): Produto[] {
    return this.recurso.dados()?.categorias.find((item) => item.slug === categoria)?.produtos ?? [];
  }
}
