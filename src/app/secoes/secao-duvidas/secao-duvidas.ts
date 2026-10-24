import { Component, inject } from '@angular/core';
import { DuvidasStore } from '../../core/estado/duvidas-store';
import { AcordeaoItem } from '../../ui/acordeao-item/acordeao-item';
import { CabecalhoSecao } from '../../ui/cabecalho-secao/cabecalho-secao';

/** Perguntas frequentes (some se a API não tiver nenhuma). */
@Component({
  selector: 'app-secao-duvidas',
  imports: [AcordeaoItem, CabecalhoSecao],
  templateUrl: './secao-duvidas.html',
  styleUrl: './secao-duvidas.scss',
})
export class SecaoDuvidas {
  protected readonly duvidas = inject(DuvidasStore).duvidas;
}
