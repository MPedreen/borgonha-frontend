import { escreverPreco, lerPreco } from './preco';

describe('lerPreco', () => {
  it.each([
    ['15', 15],
    ['12,50', 12.5],
    ['12.5', 12.5],
    [' 9,05 ', 9.05],
    ['R$ 19', 19],
    ['9999,99', 9999.99],
  ])('lê "%s" como %d', (texto, valor) => {
    expect(lerPreco(texto)).toBe(valor);
  });

  it('entende o campo vazio como "sem preço"', () => {
    expect(lerPreco('')).toBeNull();
    expect(lerPreco('   ')).toBeNull();
  });

  it.each(['0', '0,00', '-5', '12,999', '10000', 'quinze', '1.000,00'])('recusa "%s"', (texto) => {
    expect(lerPreco(texto)).toBeUndefined();
  });
});

describe('escreverPreco', () => {
  it('escreve com vírgula e dois dígitos de centavos', () => {
    expect(escreverPreco(15)).toBe('15,00');
    expect(escreverPreco(12.5)).toBe('12,50');
  });

  it('deixa o campo vazio quando não há preço', () => {
    expect(escreverPreco(null)).toBe('');
  });
});
