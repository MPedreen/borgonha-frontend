import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Botao } from './botao';

@Component({
  imports: [Botao],
  template: `
    <button appBotao variante="contorno" tamanho="compacto" largo>Pedir</button>
    <a appBotao href="/#cookies">Ver os sabores</a>
  `,
})
class Hospedeiro {}

describe('Botao', () => {
  it('aplica o visual de botão mantendo o elemento nativo', async () => {
    const fixture = TestBed.createComponent(Hospedeiro);
    await fixture.whenStable();
    const elemento = fixture.nativeElement as HTMLElement;

    const botao = elemento.querySelector('button')!;
    expect([...botao.classList]).toEqual(
      expect.arrayContaining(['botao', 'botao--contorno', 'botao--compacto', 'botao--largo']),
    );

    const link = elemento.querySelector('a')!;
    expect(link.className).toBe('botao');
    expect(link.getAttribute('href')).toBe('/#cookies');
  });
});
