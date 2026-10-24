import { computed, Service } from '@angular/core';
import { recursoDaApi } from '../api/recurso-da-api';
import { formatarEndereco, formatarHorarios, formatarTelefone } from '../formatacao/formatacao';
import { Loja } from '../modelos/loja';

/** Endereço, horários e canais de pedido, usados no cabeçalho, nas seções e no rodapé. */
@Service()
export class LojaStore {
  private readonly recurso = recursoDaApi<Loja>('loja');

  readonly loja = this.recurso.dados;
  readonly avisoTopo = computed(() => this.loja()?.avisoTopo ?? null);
  readonly canaisPedido = computed(() => this.loja()?.canaisPedido ?? []);
  readonly endereco = computed(() => {
    const loja = this.loja();
    return loja ? formatarEndereco(loja.endereco) : '';
  });
  readonly horarios = computed(() => formatarHorarios(this.loja()?.horarios ?? []));
  readonly telefone = computed(() => {
    const loja = this.loja();
    return loja ? formatarTelefone(loja.telefone) : '';
  });
  readonly instagram = computed(() => {
    const perfil = this.loja()?.instagram;
    return perfil ? { perfil: `@${perfil}`, url: `https://www.instagram.com/${perfil}/` } : null;
  });
  readonly linkDoMapa = computed(
    () => this.canaisPedido().find((canal) => canal.tipo === 'loja-fisica')?.url ?? null,
  );
}
