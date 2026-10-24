import { computed, Service } from '@angular/core';
import { recursoDaApi } from '../api/recurso-da-api';
import { Duvida } from '../modelos/duvida';

@Service()
export class DuvidasStore {
  private readonly recurso = recursoDaApi<Duvida[]>('duvidas');

  readonly duvidas = computed(() => this.recurso.dados() ?? []);
}
