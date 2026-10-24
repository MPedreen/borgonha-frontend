import { TestBed } from '@angular/core/testing';
import { formatarDia } from '../../core/formatacao/formatacao';
import { AvisoCardapioSemanal } from './aviso-cardapio-semanal';

describe('AvisoCardapioSemanal', () => {
  it('avisa que o cardápio é semanal e mostra o dia de hoje', async () => {
    const fixture = TestBed.createComponent(AvisoCardapioSemanal);
    await fixture.whenStable();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(texto).toContain('Cardápio da semana');
    expect(texto).toContain('Tudo o que aparece aqui está disponível hoje');
    expect(texto).toContain(`hoje, ${formatarDia(new Date())}`);
  });
});
