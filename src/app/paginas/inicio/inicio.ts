import { Component, effect, inject } from '@angular/core';
import { DuvidasStore } from '../../core/estado/duvidas-store';
import { LojaStore } from '../../core/estado/loja-store';
import { DadosEstruturados } from '../../core/seo/dados-estruturados';
import { Hero } from '../../secoes/hero/hero';
import { SecaoComoPedir } from '../../secoes/secao-como-pedir/secao-como-pedir';
import { SecaoCookies } from '../../secoes/secao-cookies/secao-cookies';
import { SecaoDiferenciais } from '../../secoes/secao-diferenciais/secao-diferenciais';
import { SecaoDoces } from '../../secoes/secao-doces/secao-doces';
import { SecaoDuvidas } from '../../secoes/secao-duvidas/secao-duvidas';
import { SecaoPorDentro } from '../../secoes/secao-por-dentro/secao-por-dentro';
import { SecaoSalgados } from '../../secoes/secao-salgados/secao-salgados';

/** A landing page. As seções abaixo da dobra só "acordam" no navegador quando aparecem na tela. */
@Component({
  selector: 'app-inicio',
  imports: [
    Hero,
    SecaoComoPedir,
    SecaoCookies,
    SecaoDiferenciais,
    SecaoDoces,
    SecaoDuvidas,
    SecaoPorDentro,
    SecaoSalgados,
  ],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
})
export class Inicio {
  constructor() {
    const loja = inject(LojaStore);
    const duvidas = inject(DuvidasStore);
    const dadosEstruturados = inject(DadosEstruturados);

    effect(() => {
      const dadosDaLoja = loja.loja();
      if (dadosDaLoja) {
        dadosEstruturados.atualizar(dadosDaLoja, duvidas.duvidas());
      }
    });
  }
}
