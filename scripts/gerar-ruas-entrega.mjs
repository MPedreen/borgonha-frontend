// Gera public/entrega/ruas.json: as ruas e os bairros perto da loja, com a distância de cada um até ela.
// O site usa esse arquivo só quando a conferência de endereço pela API está indisponível (serviço de mapas
// fora do ar, sem chave ou sem limite do dia): o cliente procura pelo nome da rua e vê uma estimativa em linha
// reta. Os dados vêm do OpenStreetMap (licença ODbL; o site mostra o crédito).
//
// Uso (com a API rodando, de onde vêm a posição da loja e o raio sem pedido mínimo):
//   npm run ruas-entrega
// Rode de novo se a loja mudar de endereço ou se o raio mudar.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_URL = process.env.BORGONHA_API_URL ?? 'http://localhost:5170/api';
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const SAIDA = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'entrega', 'ruas.json');

/** Até onde o arquivo cobre. Mais longe que isso o site pede para confirmar a entrega pelo WhatsApp. */
const ALCANCE_EM_METROS = 5000;
/**
 * Pedaços com o mesmo nome a menos disso um do outro contam como uma rua só: o mapa às vezes
 * interrompe a rua numa praça, num canteiro ou num trecho sem nome.
 */
const EMENDA_EM_METROS = 200;
const TIPOS_DE_VIA = new Set([
  'trunk',
  'primary',
  'secondary',
  'tertiary',
  'unclassified',
  'residential',
  'living_street',
  'pedestrian',
  'service',
  'road',
  'primary_link',
  'secondary_link',
  'tertiary_link',
]);

const loja = await buscarLoja();
const origem = { lat: loja.coordenadas.latitude, lon: loja.coordenadas.longitude };
const raio = loja.entrega.raioSemPedidoMinimoEmMetros;
console.log(`Loja em ${origem.lat}, ${origem.lon}; sem pedido mínimo até ${raio} m.`);

const osm = await buscarMapa(origem);
const paraMetros = projecao(origem);

// --- Bairros (limites administrativos de nível 10) e cidades (nível 8) ------------------------------
const limites = osm.elements
  .filter((elemento) => elemento.type === 'relation')
  .map((relacao) => ({
    nome: relacao.tags.name,
    nivel: relacao.tags.admin_level,
    segmentos: relacao.members
      .filter((membro) => membro.type === 'way' && membro.geometry)
      .flatMap((membro) => {
        const pontos = membro.geometry.map((ponto) => paraMetros(ponto.lat, ponto.lon));
        return pontos.slice(1).map((ponto, indice) => [pontos[indice], ponto]);
      }),
  }))
  .filter((limite) => limite.nome && limite.segmentos.length > 0);
const cidades = limites.filter((limite) => limite.nivel === '8');
const cidadeDaLoja = cidades.find((cidade) => contem(cidade, { x: 0, y: 0 }))?.nome;

// O mesmo bairro pode vir em mais de um limite no mapa: os pedaços com o mesmo nome viram um bairro só.
const pedacosDeBairro = limites
  .filter((limite) => limite.nivel === '10')
  .map((bairro) => {
    const cidade = cidadeDe(bairro);
    return {
      ...bairro,
      rotulo: cidade && cidade !== cidadeDaLoja ? `${bairro.nome} (${cidade})` : bairro.nome,
      minimo: contem(bairro, { x: 0, y: 0 })
        ? 0
        : Math.min(...bairro.segmentos.map(([a, b]) => distanciaAoSegmento(a, b))),
      maximo: Math.max(...bairro.segmentos.map(([inicio]) => Math.hypot(inicio.x, inicio.y))),
    };
  });
const bairros = [...Map.groupBy(pedacosDeBairro, (pedaco) => pedaco.rotulo)]
  .map(([rotulo, pedacos]) => ({
    rotulo,
    pedacos,
    minimo: Math.min(...pedacos.map((pedaco) => pedaco.minimo)),
    maximo: Math.max(...pedacos.map((pedaco) => pedaco.maximo)),
  }))
  .filter((bairro) => bairro.minimo <= ALCANCE_EM_METROS)
  .sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR'));

// --- Ruas: junta os trechos de cada rua em grupos ligados entre si -----------------------------------
const vias = osm.elements
  .filter((elemento) => elemento.type === 'way' && TIPOS_DE_VIA.has(elemento.tags.highway))
  .map((via) => ({
    id: via.id,
    nome: via.tags.name.trim().replace(/\s+/g, ' '),
    nos: via.nodes,
    pontos: via.geometry.map((ponto) => paraMetros(ponto.lat, ponto.lon)),
  }));

const pai = new Map(vias.map((via) => [via.id, via.id]));
const raiz = (id) => {
  while (pai.get(id) !== id) {
    pai.set(id, pai.get(pai.get(id)));
    id = pai.get(id);
  }
  return id;
};
const unir = (a, b) => pai.set(raiz(a), raiz(b));

const viasPorNome = Map.groupBy(vias, (via) => via.nome);
for (const mesmas of viasPorNome.values()) {
  const donoDoNo = new Map();
  for (const via of mesmas) {
    for (const no of via.nos) {
      if (donoDoNo.has(no)) unir(via.id, donoDoNo.get(no));
      else donoDoNo.set(no, via.id);
    }
  }
  for (const [indice, via] of mesmas.entries()) {
    for (const outra of mesmas.slice(indice + 1)) {
      if (raiz(via.id) !== raiz(outra.id) && proximas(via, outra)) unir(via.id, outra.id);
    }
  }
}

// Cruzamentos: nós compartilhados por ruas de nomes diferentes.
const nomesNoNo = new Map();
for (const via of vias) {
  via.nos.forEach((no, indice) => {
    if (!nomesNoNo.has(no)) nomesNoNo.set(no, { ponto: via.pontos[indice], nomes: new Set() });
    nomesNoNo.get(no).nomes.add(via.nome);
  });
}

const grupos = [...Map.groupBy(vias, (via) => raiz(via.id)).values()];
const ruas = grupos
  .map((trechos) => {
    const nome = trechos[0].nome;
    const segmentos = trechos.flatMap((via) =>
      via.pontos.slice(1).map((ponto, indice) => [via.pontos[indice], ponto]),
    );
    const minimo = Math.min(...segmentos.map(([a, b]) => distanciaAoSegmento(a, b)));
    const maximo = Math.max(
      ...trechos.flatMap((via) => via.pontos.map((p) => Math.hypot(p.x, p.y))),
    );

    const cruzamentos = trechos
      .flatMap((via) => via.nos)
      .map((no) => nomesNoNo.get(no))
      .filter((cruzamento) => cruzamento.nomes.size > 1)
      .flatMap(({ ponto, nomes }) =>
        [...nomes]
          .filter((outro) => outro !== nome)
          .map((outro) => ({ rua: outro, distancia: Math.hypot(ponto.x, ponto.y) })),
      );

    return { nome, segmentos, minimo, maximo, cruzamentos, bairros: bairrosDaRua(segmentos) };
  })
  .filter((rua) => rua.minimo <= ALCANCE_EM_METROS);

// Ruas que cruzam o limite do raio: o cruzamento mais perto do limite de cada lado vira referência.
for (const rua of ruas) {
  if (rua.minimo > raio || rua.maximo <= raio) continue;
  const dentro = rua.cruzamentos
    .filter((c) => c.distancia <= raio)
    .sort((a, b) => b.distancia - a.distancia)[0];
  const fora = rua.cruzamentos
    .filter((c) => c.distancia > raio)
    .sort((a, b) => a.distancia - b.distancia)[0];
  if (dentro && fora && dentro.rua !== fora.rua) rua.referencias = [dentro.rua, fora.rua];
}

// Ruas com o mesmo nome e o mesmo bairro: o cruzamento mais perto da loja ajuda a diferenciar.
const repetidas = Map.groupBy(ruas, (rua) => `${rua.nome}|${rua.bairros.join(',')}`);
for (const mesmas of repetidas.values()) {
  if (mesmas.length < 2) continue;
  for (const rua of mesmas) {
    rua.perto = [...rua.cruzamentos].sort((a, b) => a.distancia - b.distancia)[0]?.rua;
  }
}

const indiceDoBairro = new Map(bairros.map((bairro, indice) => [bairro.rotulo, indice]));
const arquivo = {
  versao: 1,
  fonte: 'Mapa de ruas © colaboradores do OpenStreetMap (ODbL)',
  geradoEm: new Date().toISOString().slice(0, 10),
  origem: { latitude: origem.lat, longitude: origem.lon },
  raioEmMetros: raio,
  alcanceEmMetros: ALCANCE_EM_METROS,
  bairros: bairros.map((bairro) => [
    bairro.rotulo,
    Math.round(bairro.minimo),
    Math.round(bairro.maximo),
  ]),
  // [nome, índices dos bairros, distância mínima, distância máxima, referências do limite?, perto de?]
  ruas: ruas
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR') || a.minimo - b.minimo)
    .map((rua) => {
      const linha = [
        rua.nome,
        rua.bairros.map((nome) => indiceDoBairro.get(nome)),
        Math.round(rua.minimo),
        Math.round(rua.maximo),
      ];
      if (rua.referencias || rua.perto) linha.push(rua.referencias ?? null);
      if (rua.perto) linha.push(rua.perto);
      return linha;
    }),
};

mkdirSync(dirname(SAIDA), { recursive: true });
writeFileSync(SAIDA, JSON.stringify(arquivo));
const resumo = {
  semMinimo: ruas.filter((rua) => rua.maximo <= raio).length,
  dependeDoTrecho: ruas.filter((rua) => rua.minimo <= raio && rua.maximo > raio).length,
  comMinimo: ruas.filter((rua) => rua.minimo > raio).length,
};
console.log(`${ruas.length} ruas e ${bairros.length} bairros em ${SAIDA}`, resumo);

// --- Funções de apoio ---------------------------------------------------------------------------------

async function buscarLoja() {
  const resposta = await fetch(`${API_URL}/loja`, { signal: AbortSignal.timeout(10_000) });
  if (!resposta.ok) throw new Error(`A API respondeu ${resposta.status} em ${API_URL}/loja.`);
  const dados = await resposta.json();
  if (!dados.entrega) throw new Error('A loja não tem regra de entrega cadastrada.');
  return dados;
}

async function buscarMapa({ lat, lon }) {
  const consulta = `[out:json][timeout:180];
    way(around:${ALCANCE_EM_METROS},${lat},${lon})[highway][name];
    out geom;
    rel(around:${ALCANCE_EM_METROS},${lat},${lon})[boundary=administrative][admin_level~"^(8|10)$"];
    out geom;`;
  const resposta = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'borgonha-confeitaria/gerar-ruas-entrega',
    },
    body: `data=${encodeURIComponent(consulta)}`,
    signal: AbortSignal.timeout(240_000),
  });
  if (!resposta.ok)
    throw new Error(`O Overpass respondeu ${resposta.status}. Tente de novo em alguns minutos.`);
  return resposta.json();
}

/** Converte latitude/longitude em metros a partir da loja (precisão de centímetros nesta escala). */
function projecao({ lat, lon }) {
  const metrosPorGrauLat = 111_132.92 - 559.82 * Math.cos(2 * radianos(lat));
  const metrosPorGrauLon = 111_412.84 * Math.cos(radianos(lat));
  return (latitude, longitude) => ({
    x: (longitude - lon) * metrosPorGrauLon,
    y: (latitude - lat) * metrosPorGrauLat,
  });
}

function radianos(graus) {
  return (graus * Math.PI) / 180;
}

/** Distância da loja (origem) até o ponto mais próximo do segmento AB. */
function distanciaAoSegmento(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const comprimento2 = dx * dx + dy * dy;
  const t =
    comprimento2 === 0 ? 0 : Math.max(0, Math.min(1, -(a.x * dx + a.y * dy) / comprimento2));
  return Math.hypot(a.x + t * dx, a.y + t * dy);
}

/** Ponto dentro do limite (par/ímpar: funciona com os trechos fora de ordem e com buracos). */
function contem(limite, { x, y }) {
  limite.caixa ??= caixaDe(limite.segmentos);
  const { minX, maxX, minY, maxY } = limite.caixa;
  if (x < minX || x > maxX || y < minY || y > maxY) return false;
  let dentro = false;
  for (const [a, b] of limite.segmentos) {
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) dentro = !dentro;
  }
  return dentro;
}

function caixaDe(segmentos) {
  const xs = segmentos.flat().map((p) => p.x);
  const ys = segmentos.flat().map((p) => p.y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

/** Cidade da maior parte do bairro, por amostragem de pontos dentro dele. */
function cidadeDe(bairro) {
  const { minX, maxX, minY, maxY } = caixaDe(bairro.segmentos);
  const votos = new Map();
  for (let i = 0.5; i < 12; i++) {
    for (let j = 0.5; j < 12; j++) {
      const ponto = { x: minX + ((maxX - minX) * i) / 12, y: minY + ((maxY - minY) * j) / 12 };
      if (!contem(bairro, ponto)) continue;
      const cidade = cidades.find((candidata) => contem(candidata, ponto))?.nome;
      if (cidade) votos.set(cidade, (votos.get(cidade) ?? 0) + 1);
    }
  }
  return [...votos].sort((a, b) => b[1] - a[1])[0]?.[0];
}

function proximas(a, b) {
  return a.pontos.some((p) =>
    b.pontos.some((q) => Math.hypot(p.x - q.x, p.y - q.y) <= EMENDA_EM_METROS),
  );
}

/** Bairros por onde a rua passa, do que tem mais metros de rua para o que tem menos (até dois). */
function bairrosDaRua(segmentos) {
  const metros = new Map();
  let total = 0;
  for (const [a, b] of segmentos) {
    const comprimento = Math.hypot(b.x - a.x, b.y - a.y);
    const meio = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const bairro = bairros.find((candidato) =>
      candidato.pedacos.some((pedaco) => contem(pedaco, meio)),
    );
    total += comprimento;
    if (bairro) metros.set(bairro.rotulo, (metros.get(bairro.rotulo) ?? 0) + comprimento);
  }
  return [...metros]
    .filter(([, comprimento]) => comprimento >= total * 0.15)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([rotulo]) => rotulo);
}
