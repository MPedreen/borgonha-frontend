import { LOJA } from '../../../testing/dados-de-teste';
import {
  formatarDia,
  formatarEndereco,
  formatarHora,
  formatarHorarios,
  formatarPreco,
  formatarTelefone,
} from './formatacao';

describe('formatacao', () => {
  it('formata o telefone no padrão brasileiro', () => {
    expect(formatarTelefone('+5521974509789')).toBe('(21) 97450-9789');
    expect(formatarTelefone('+552133334444')).toBe('(21) 3333-4444');
  });

  it('devolve como veio um telefone fora do padrão brasileiro', () => {
    expect(formatarTelefone('+14155550100')).toBe('+14155550100');
  });

  it('formata o endereço em uma linha', () => {
    expect(formatarEndereco(LOJA.endereco)).toBe(
      'Rua Afrânio Peixoto, 40 – Santa Luzia, São Gonçalo – RJ',
    );
  });

  it('descreve os horários de funcionamento', () => {
    expect(formatarHorarios(LOJA.horarios)).toEqual([
      'Terça a sexta, das 11h às 19h',
      'Sábado, das 11h às 16h',
    ]);
  });

  it('mostra os minutos só quando não são zero', () => {
    expect(formatarHora('11:00')).toBe('11h');
    expect(formatarHora('09:30')).toBe('9h30');
  });

  it('formata preços em reais', () => {
    expect(formatarPreco(12.9).replace(/\s/g, ' ')).toBe('R$ 12,90');
  });

  it('escreve o dia da semana e a data no fuso da loja', () => {
    expect(formatarDia(new Date('2026-10-23T15:00:00Z'))).toBe('sexta-feira, 23 de outubro');
    // 1h da manhã do dia 24 em UTC ainda é dia 23 (22h) em São Gonçalo.
    expect(formatarDia(new Date('2026-10-24T01:00:00Z'))).toBe('sexta-feira, 23 de outubro');
  });
});
