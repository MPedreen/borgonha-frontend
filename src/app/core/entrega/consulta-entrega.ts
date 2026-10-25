import { Coordenadas } from '../modelos/loja';

/**
 * `public/entrega/ruas.json`, gerado por `npm run ruas-entrega` a partir do OpenStreetMap.
 * Distâncias em metros, em linha reta, da loja até o ponto mais perto e o mais longe de cada rua ou bairro.
 */
export interface ArquivoDeRuas {
  versao: 1;
  fonte: string;
  geradoEm: string;
  origem: Coordenadas;
  /** Raio usado para calcular as referências das ruas que cruzam o limite. */
  raioEmMetros: number;
  /** Até onde o arquivo cobre; mais longe que isso fica fora de "Santa Luzia e região". */
  alcanceEmMetros: number;
  bairros: [nome: string, minimo: number, maximo: number][];
  ruas: [
    nome: string,
    bairros: number[],
    minimo: number,
    maximo: number,
    referencias?: [dentro: string, fora: string] | null,
    perto?: string,
  ][];
}

/** Uma rua ou um bairro que a pessoa pode escolher na busca. */
export interface Lugar {
  chave: string;
  tipo: 'rua' | 'bairro';
  nome: string;
  /** Bairros da rua (e o cruzamento que a diferencia de outra com o mesmo nome). */
  detalhe: string;
  minimo: number;
  maximo: number;
  /** Cruzamentos de cada lado do limite, nas ruas que começam dentro do raio e terminam fora. */
  referencias: { dentro: string; fora: string } | null;
  /** Nome sem acentos e sem "Rua", "Av." etc., para a busca. */
  busca: string;
}

/**
 * - `sem-minimo`: tudo a até o raio da loja;
 * - `com-minimo`: tudo mais longe que o raio, mas dentro da região;
 * - `depende`: a rua (ou o bairro) tem partes dos dois lados do limite;
 * - `fora-da-regiao`: longe demais para a consulta automática.
 */
export type Situacao = 'sem-minimo' | 'com-minimo' | 'depende' | 'fora-da-regiao';

const TIPOS_DE_LOGRADOURO =
  /^(rua|r|avenida|av|travessa|trav|tv|estrada|estr|est|praca|pca|alameda|al|rodovia|rod|beco|largo|lgo|ladeira|servidao|caminho|via|vila|condominio|cond|loteamento)\b\s*/;

const LOGRADOUROS_MASCULINOS =
  /^(largo|beco|caminho|condominio|loteamento|parque|conjunto|acesso|ramal|viaduto|morro|jardim|residencial|trevo|recanto)\b/;

/** "Avenida São João, 12" → "sao joao 12": minúsculas, sem acentos, sem pontuação e sem o tipo de logradouro. */
export function normalizar(texto: string): string {
  return semAcentos(texto).replace(TIPOS_DE_LOGRADOURO, '');
}

/** "a" para Rua, Avenida, Travessa...; "o" para Largo, Beco, Condomínio... */
export function artigoDe(nome: string): 'a' | 'o' {
  return LOGRADOUROS_MASCULINOS.test(semAcentos(nome)) ? 'o' : 'a';
}

function semAcentos(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Lugares do arquivo prontos para a busca. As referências só valem se o raio não mudou depois do arquivo. */
export function lugaresDoArquivo(arquivo: ArquivoDeRuas, raioEmMetros: number): Lugar[] {
  const referenciasValem = arquivo.raioEmMetros === raioEmMetros;

  const bairros: Lugar[] = arquivo.bairros.map(([nome, minimo, maximo], indice) => ({
    chave: `b${indice}`,
    tipo: 'bairro',
    nome,
    detalhe: 'Bairro',
    minimo,
    maximo,
    referencias: null,
    busca: normalizar(nome),
  }));

  const ruas: Lugar[] = arquivo.ruas.map(
    ([nome, indices, minimo, maximo, referencias, perto], indice) => {
      const nomesDosBairros = indices.map((i) => arquivo.bairros[i]?.[0]).filter(Boolean);
      return {
        chave: `r${indice}`,
        tipo: 'rua',
        nome,
        detalhe: [nomesDosBairros.join(', '), perto ? `perto d${artigoDe(perto)} ${perto}` : '']
          .filter(Boolean)
          .join(' · '),
        minimo,
        maximo,
        referencias:
          referenciasValem && referencias ? { dentro: referencias[0], fora: referencias[1] } : null,
        busca: normalizar(nome),
      };
    },
  );

  return [...bairros, ...ruas];
}

/**
 * Até `limite` lugares que combinam com o texto digitado: primeiro os que começam com ele, depois os que
 * têm todas as palavras digitadas no começo de alguma palavra do nome; os mais perto da loja vêm antes.
 * Bairros aparecem antes das ruas, a não ser que a pessoa tenha escrito "Rua", "Av." etc.
 */
export function buscarLugares(lugares: readonly Lugar[], texto: string, limite = 8): Lugar[] {
  const digitado = semAcentos(texto);
  const consulta = normalizar(texto);
  // "Rua 1" vale (o tipo de logradouro já diz o que é); "1" ou "r" sozinhos, não.
  if (digitado.length < 2 || consulta.length === 0) {
    return [];
  }
  const palavras = consulta.split(' ');
  const pediuRua = consulta !== digitado;
  const ordemDoTipo = (lugar: Lugar) => ((lugar.tipo === 'bairro') !== pediuRua ? 0 : 1);

  return lugares
    .map((lugar) => ({ lugar, nota: notaDaBusca(lugar.busca, consulta, palavras) }))
    .filter((item): item is { lugar: Lugar; nota: number } => item.nota !== null)
    .sort(
      (a, b) =>
        a.nota - b.nota ||
        ordemDoTipo(a.lugar) - ordemDoTipo(b.lugar) ||
        a.lugar.minimo - b.lugar.minimo,
    )
    .slice(0, limite)
    .map((item) => item.lugar);
}

function notaDaBusca(nome: string, consulta: string, palavras: string[]): number | null {
  if (nome === consulta) return 0;
  if (nome.startsWith(consulta)) return 1;
  const palavrasDoNome = nome.split(' ');
  const todas = palavras.every((palavra) => palavrasDoNome.some((p) => p.startsWith(palavra)));
  return todas ? 2 : null;
}

export function situacaoDoLugar(lugar: Lugar, raioEmMetros: number): Situacao {
  if (lugar.maximo <= raioEmMetros) return 'sem-minimo';
  if (lugar.minimo > raioEmMetros) return 'com-minimo';
  return 'depende';
}

export function situacaoDaDistancia(
  distanciaEmMetros: number,
  raioEmMetros: number,
  alcanceEmMetros: number,
): Situacao {
  if (distanciaEmMetros <= raioEmMetros) return 'sem-minimo';
  return distanciaEmMetros <= alcanceEmMetros ? 'com-minimo' : 'fora-da-regiao';
}

/** Distância em linha reta entre dois pontos da Terra (fórmula de haversine). */
export function distanciaEmMetros(a: Coordenadas, b: Coordenadas): number {
  const raioDaTerra = 6_371_008.8;
  const radianos = (graus: number) => (graus * Math.PI) / 180;
  const dLat = radianos(b.latitude - a.latitude);
  const dLon = radianos(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radianos(a.latitude)) * Math.cos(radianos(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * raioDaTerra * Math.asin(Math.sqrt(h));
}

/** 640 → "650 m"; 1500 → "1,5 km"; 2340 → "2,3 km". */
export function formatarDistancia(metros: number): string {
  if (metros < 1000) {
    return `${Math.max(50, Math.round(metros / 50) * 50)} m`;
  }
  const quilometros = Math.round(metros / 100) / 10;
  return `${quilometros.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`;
}
