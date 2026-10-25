import { ARQUIVO_DE_RUAS } from '../../../testing/dados-de-teste';
import {
  artigoDe,
  buscarLugares,
  distanciaEmMetros,
  formatarDistancia,
  lugaresDoArquivo,
  normalizar,
  situacaoDaDistancia,
  situacaoDoLugar,
} from './consulta-entrega';

describe('consulta de entrega', () => {
  const lugares = lugaresDoArquivo(ARQUIVO_DE_RUAS, 1500);
  const nomes = (texto: string) => buscarLugares(lugares, texto).map((lugar) => lugar.nome);

  it('normaliza acentos, pontuação e o tipo de logradouro', () => {
    expect(normalizar('Av. São João, 12')).toBe('sao joao 12');
    expect(normalizar('  RUA Afrânio   Peixoto ')).toBe('afranio peixoto');
    expect(normalizar('Travessa Ipê')).toBe('ipe');
  });

  it('acha a rua pelo começo do nome, sem acento e sem "Rua"', () => {
    expect(nomes('afranio')).toEqual(['Rua Afrânio Peixoto']);
    expect(nomes('Rua Afrânio Pei')).toEqual(['Rua Afrânio Peixoto']);
  });

  it('acha pelas palavras em qualquer ordem e põe as mais perto da loja primeiro', () => {
    expect(nomes('peixoto')).toEqual(['Rua Afrânio Peixoto', 'Rua Coronel Peixoto']);
  });

  it('mostra o bairro antes das ruas, a não ser que a pessoa escreva o tipo de logradouro', () => {
    expect(nomes('santa luzia')).toEqual(['Santa Luzia', 'Avenida Santa Luzia']);
    expect(nomes('av santa luzia')).toEqual(['Avenida Santa Luzia', 'Santa Luzia']);
  });

  it('aceita "Rua 1", mas não começa a buscar com um caractere só', () => {
    expect(nomes('rua 1')).toEqual(['Rua 1', 'Rua 1']);
    expect(nomes('a')).toEqual([]);
    expect(nomes('rua')).toEqual([]);
  });

  it('descreve os bairros da rua e diferencia ruas de mesmo nome pelo cruzamento', () => {
    const ruas = buscarLugares(lugares, 'rua 1');
    expect(ruas[0].detalhe).toBe('Laranjal · perto do Largo da Igreja');
  });

  it('classifica a rua pelo trecho mais perto e o mais longe da loja', () => {
    const [afranio] = buscarLugares(lugares, 'afranio');
    const [coronel] = buscarLugares(lugares, 'coronel peixoto');
    const [avenida] = buscarLugares(lugares, 'av santa luzia');

    expect(situacaoDoLugar(afranio, 1500)).toBe('sem-minimo');
    expect(situacaoDoLugar(coronel, 1500)).toBe('com-minimo');
    expect(situacaoDoLugar(avenida, 1500)).toBe('depende');
    expect(avenida.referencias).toEqual({ dentro: 'Rua Afrânio Peixoto', fora: 'Rua 1' });
  });

  it('ignora as referências do limite se o raio mudou depois do arquivo', () => {
    const [avenida] = buscarLugares(lugaresDoArquivo(ARQUIVO_DE_RUAS, 2000), 'av santa luzia');
    expect(avenida.referencias).toBeNull();
  });

  it('classifica uma distância (localização do aparelho)', () => {
    expect(situacaoDaDistancia(1500, 1500, 5000)).toBe('sem-minimo');
    expect(situacaoDaDistancia(1501, 1500, 5000)).toBe('com-minimo');
    expect(situacaoDaDistancia(5001, 1500, 5000)).toBe('fora-da-regiao');
  });

  it('mede a distância em linha reta entre dois pontos', () => {
    // 0,01° de latitude ≈ 1.112 m
    const distancia = distanciaEmMetros(
      { latitude: -22.8, longitude: -42.98 },
      { latitude: -22.81, longitude: -42.98 },
    );
    expect(distancia).toBeGreaterThan(1105);
    expect(distancia).toBeLessThan(1120);
  });

  it('escreve a distância de um jeito fácil de ler', () => {
    expect(formatarDistancia(640)).toBe('650 m');
    expect(formatarDistancia(10)).toBe('50 m');
    expect(formatarDistancia(1500)).toBe('1,5 km');
    expect(formatarDistancia(2340)).toBe('2,3 km');
  });

  it('usa o artigo certo para cada tipo de logradouro', () => {
    expect(artigoDe('Rua Afrânio Peixoto')).toBe('a');
    expect(artigoDe('Largo da Igreja')).toBe('o');
    expect(artigoDe('Condomínio Monte São Pedro')).toBe('o');
  });
});
