import { Component } from '@angular/core';
import { CabecalhoSecao } from '../../ui/cabecalho-secao/cabecalho-secao';
import { Icone } from '../../ui/icone/icone';
import { NomeIcone } from '../../ui/icone/nomes-icones';
import { Revelar } from '../../ui/revelar/revelar';

interface Diferencial {
  icone: NomeIcone;
  titulo: string;
  texto: string;
}

/** "O que faz um cookie Borgonha ser diferente?" — os 4 diferenciais da casa. */
@Component({
  selector: 'app-secao-diferenciais',
  imports: [CabecalhoSecao, Icone, Revelar],
  templateUrl: './secao-diferenciais.html',
  styleUrl: './secao-diferenciais.scss',
})
export class SecaoDiferenciais {
  protected readonly diferenciais: readonly Diferencial[] = [
    {
      icone: 'cookie',
      titulo: 'Recheio de verdade',
      texto: 'Generoso do começo ao fim. É só partir ao meio pra ver.',
    },
    {
      icone: 'hand-heart',
      titulo: 'Feito à mão',
      texto: 'Produção artesanal, em pequenas fornadas.',
    },
    {
      icone: 'sparkles',
      titulo: 'Ingredientes de primeira',
      texto: 'Nutella, Kinder Bueno, Galak e chocolate de verdade.',
    },
    {
      icone: 'bike',
      titulo: 'Frete grátis na região',
      texto: 'Pedindo pelo WhatsApp, entregamos em Santa Luzia e região sem custo.',
    },
  ];
}
