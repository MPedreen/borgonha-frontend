// Gera as imagens do site (WebP em várias larguras) a partir dos originais em design/originais/.
// Uso: npm run imagens
import { mkdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { LARGURAS_IMAGEM } from '../src/app/core/imagens/larguras-imagem.ts';

const PASTA_ORIGINAIS = fileURLToPath(new URL('../design/originais/', import.meta.url));
const PASTA_PUBLICA = fileURLToPath(new URL('../public/', import.meta.url));
const PASTA_IMAGENS = join(PASTA_PUBLICA, 'imagens');

/** Fotos recortadas em proporção fixa (`recorte` em pixels da foto original). */
const FOTOS = [
  {
    origem: 'WhatsApp Image 2026-10-23 at 13.18.18 (2).jpeg',
    destino: 'cookies/nutella-partido',
    recorte: { left: 105, top: 400, width: 960, height: 1200 },
  },
  {
    origem: 'WhatsApp Image 2026-10-23 at 13.18.17 (1).jpeg',
    destino: 'cookies/red-velvet-partido',
    recorte: { left: 30, top: 400, width: 960, height: 1200 },
  },
  {
    origem: 'WhatsApp Image 2026-10-23 at 13.18.18 (1).jpeg',
    destino: 'cookies/mms-partido',
    recorte: { left: 110, top: 400, width: 960, height: 1200 },
  },
  {
    origem: 'WhatsApp Image 2026-10-23 at 13.18.17.jpeg',
    destino: 'cookies/triplo-chocolate-partido',
    recorte: { left: 320, top: 655, width: 600, height: 750 },
  },
  {
    origem: 'WhatsApp Image 2026-10-23 at 13.18.18.jpeg',
    destino: 'cookies/bueno-partido',
    recorte: { left: 280, top: 730, width: 600, height: 750 },
  },
  // Artes do Instagram com texto aplicado: provisórias até chegarem as fotos sem texto.
  {
    origem: 'Untitled Project - Artboard 54.png',
    destino: 'doces/brookie',
    recorte: { left: 0, top: 19, width: 610, height: 762 },
  },
  {
    origem: 'Untitled Project - Artboard 56.png',
    destino: 'doces/brownie-doce-de-leite',
    recorte: { left: 72, top: 400, width: 532, height: 399 },
  },
  {
    origem: 'Untitled Project - IG Discount Feed 4.png',
    destino: 'doces/bolo-de-pote',
    recorte: { left: 0, top: 320, width: 640, height: 480 },
  },
];

/**
 * Cookies vistos de cima, recortados das placas do cardápio (faixa vertical de cada um).
 * Provisórios: as placas têm baixa resolução (~170 px por cookie), então os recortes são ampliados
 * (veja ampliarCookie). O ideal é trocar pelas fotos originais em alta resolução.
 */
const PLACAS_DO_CARDAPIO = [
  {
    origem: 'Untitled Project - Coffee shop Sidewalk Sign 6.png',
    cookies: [
      { destino: 'cookies/tradicional-inteiro', faixa: [110, 290] },
      { destino: 'cookies/nutella-inteiro', faixa: [290, 455] },
      { destino: 'cookies/bueno-inteiro', faixa: [455, 620] },
      { destino: 'cookies/triplo-chocolate-inteiro', faixa: [620, 800] },
    ],
  },
  {
    origem: 'Untitled Project - Coffee shop Sidewalk Sign 7.png',
    cookies: [
      { destino: 'cookies/red-velvet-inteiro', faixa: [130, 300] },
      { destino: 'cookies/mms-inteiro', faixa: [620, 800] },
    ],
  },
];

/** Imagem de compartilhamento (Open Graph), 1200×630. */
const COMPARTILHAMENTO = {
  origem: 'WhatsApp Image 2026-10-23 at 13.18.18 (2).jpeg',
  recorte: { left: 0, top: 560, width: 1200, height: 630 },
};

const LARGURA_COLUNA_DOS_COOKIES = 210; // o texto das placas começa depois desta coluna
const FUNDO_DAS_PLACAS = [255, 252, 235];
const TOLERANCIA_FUNDO = 40;

/**
 * Os recortes das placas têm só ~170 px. São ampliados 4× aqui, com um filtro que só interpola os
 * pixels reais (nada de IA, que inventaria detalhes que o cookie não tem), para o navegador não
 * precisar esticar a foto na tela.
 */
const AMPLIACAO_DOS_RECORTES = 4;

// Qualidade alta e smartSubsample, que preserva a cor nas bordas (o vermelho do Red Velvet).
const WEBP_FOTOS = { quality: 82, smartSubsample: true };
const WEBP_RECORTES = { quality: 82, alphaQuality: 100, smartSubsample: true };

await rm(PASTA_IMAGENS, { recursive: true, force: true });

for (const foto of FOTOS) {
  const base = await sharp(join(PASTA_ORIGINAIS, foto.origem)).extract(foto.recorte).toBuffer();
  await salvarEmTodasAsLarguras(base, foto.destino, WEBP_FOTOS);
}

for (const placa of PLACAS_DO_CARDAPIO) {
  for (const cookie of placa.cookies) {
    const isolado = await isolarCookie(join(PASTA_ORIGINAIS, placa.origem), cookie.faixa);
    await salvarEmTodasAsLarguras(await ampliarCookie(isolado), cookie.destino, WEBP_RECORTES);
  }
}

await sharp(join(PASTA_ORIGINAIS, COMPARTILHAMENTO.origem))
  .extract(COMPARTILHAMENTO.recorte)
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile(join(PASTA_PUBLICA, 'og-imagem.jpg'));

console.log(`Imagens geradas em ${PASTA_IMAGENS}`);

async function salvarEmTodasAsLarguras(imagem, destino, opcoesWebp) {
  const arquivoBase = join(PASTA_IMAGENS, destino);
  await mkdir(dirname(arquivoBase), { recursive: true });

  for (const largura of LARGURAS_IMAGEM) {
    await sharp(imagem)
      .resize({ width: largura, withoutEnlargement: true })
      .webp({ effort: 5, ...opcoesWebp })
      .toFile(`${arquivoBase}-${largura}.webp`);
  }
}

/**
 * Isola o cookie de uma faixa da placa: fica o maior bloco de pixels que não são do fundo creme,
 * e tudo o que está fora dele (ligado às bordas) fica de fora. Devolve os pixels na resolução
 * original, a máscara do cookie (1 = cookie) e a caixa que o contém.
 */
async function isolarCookie(arquivo, [topo, base]) {
  const { data, info } = await sharp(arquivo)
    .extract({ left: 0, top: topo, width: LARGURA_COLUNA_DOS_COOKIES, height: base - topo })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width: largura, height: altura } = info;
  const total = largura * altura;
  const ehFundo = (p) =>
    Math.hypot(
      data[p * 4] - FUNDO_DAS_PLACAS[0],
      data[p * 4 + 1] - FUNDO_DAS_PLACAS[1],
      data[p * 4 + 2] - FUNDO_DAS_PLACAS[2],
    ) < TOLERANCIA_FUNDO;
  const vizinhos = (p) => {
    const x = p % largura;
    return [p - largura, p + largura, x > 0 ? p - 1 : -1, x < largura - 1 ? p + 1 : -1].filter(
      (v) => v >= 0 && v < total,
    );
  };
  const inundar = (inicio, podeEntrar, marcar) => {
    const fila = [inicio];
    marcar(inicio);
    let tamanho = 0;
    while (fila.length > 0) {
      const atual = fila.pop();
      tamanho++;
      for (const vizinho of vizinhos(atual)) {
        if (podeEntrar(vizinho)) {
          marcar(vizinho);
          fila.push(vizinho);
        }
      }
    }
    return tamanho;
  };

  // 1. Maior bloco de pixels que não são fundo = o cookie.
  const bloco = new Int32Array(total);
  let maiorBloco = 0;
  let tamanhoMaior = 0;
  let proximoBloco = 1;
  for (let p = 0; p < total; p++) {
    if (bloco[p] === 0 && !ehFundo(p)) {
      const id = proximoBloco++;
      const tamanho = inundar(
        p,
        (v) => bloco[v] === 0 && !ehFundo(v),
        (v) => (bloco[v] = id),
      );
      if (tamanho > tamanhoMaior) {
        tamanhoMaior = tamanho;
        maiorBloco = id;
      }
    }
  }

  // 2. Tudo que não é o cookie e encosta nas bordas fica de fora (buracos internos continuam no cookie).
  const fora = new Uint8Array(total);
  for (let p = 0; p < total; p++) {
    const naBorda =
      p < largura || p >= total - largura || p % largura === 0 || p % largura === largura - 1;
    if (naBorda && !fora[p] && bloco[p] !== maiorBloco) {
      inundar(
        p,
        (v) => !fora[v] && bloco[v] !== maiorBloco,
        (v) => (fora[v] = 1),
      );
    }
  }

  // 3. Máscara do cookie e a caixa justa em volta dele.
  const mascara = new Uint8Array(total);
  let minX = largura;
  let minY = altura;
  let maxX = 0;
  let maxY = 0;
  for (let p = 0; p < total; p++) {
    if (!fora[p]) {
      mascara[p] = 1;
      const x = p % largura;
      const y = Math.floor(p / largura);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }

  return {
    pixels: data,
    largura,
    altura,
    mascara,
    caixa: { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 },
  };
}

/**
 * Amplia o cookie isolado sem inventar detalhes:
 * - antes de ampliar, as cores da borda do cookie se estendem para fora, para o creme da placa
 *   não vazar no contorno;
 * - a ampliação usa o filtro Lanczos, que só interpola os pixels que existem, seguida de uma
 *   nitidez leve, que realça as bordas que a foto já tem;
 * - o contorno é refeito na escala final: liso, sem serrilhado e sem a franja creme da placa.
 * Devolve um PNG quadrado e transparente, com o cookie centralizado.
 */
async function ampliarCookie({ pixels, largura, altura, mascara, caixa }) {
  const fator = AMPLIACAO_DOS_RECORTES;
  const larguraFinal = largura * fator;
  const alturaFinal = altura * fator;

  const cores = await sharp(estenderCoresDaBorda(pixels, largura, altura, mascara), {
    raw: { width: largura, height: altura, channels: 3 },
  })
    .resize(larguraFinal, alturaFinal, { kernel: 'lanczos3' })
    .sharpen({ sigma: 1.2, m1: 0.6, m2: 1.2 })
    .raw()
    .toBuffer();
  const alfa = await contornoLiso(mascara, largura, altura, fator);

  // O sharp aplica o extract antes do joinChannel: junta o alfa numa etapa e recorta na seguinte.
  const comAlfa = await sharp(cores, {
    raw: { width: larguraFinal, height: alturaFinal, channels: 3 },
  })
    .joinChannel(alfa, { raw: { width: larguraFinal, height: alturaFinal, channels: 1 } })
    .png()
    .toBuffer();
  const recortado = await sharp(comAlfa)
    .extract({
      left: caixa.left * fator,
      top: caixa.top * fator,
      width: caixa.width * fator,
      height: caixa.height * fator,
    })
    .png()
    .toBuffer();

  // Centraliza num quadrado transparente para todos os cookies ficarem do mesmo tamanho nos cards.
  const lado = (Math.max(caixa.width, caixa.height) + 8) * fator;
  return sharp({
    create: { width: lado, height: lado, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: recortado, gravity: 'center' }])
    .png()
    .toBuffer();
}

/**
 * RGB do recorte em que os pixels de fora do cookie (até alguns pixels de distância) recebem a
 * média das cores vizinhas do próprio cookie, e não o creme da placa.
 */
function estenderCoresDaBorda(pixels, largura, altura, mascara, passos = 6) {
  const total = largura * altura;
  const rgb = new Float32Array(total * 3);
  const conhecido = new Uint8Array(total);
  for (let p = 0; p < total; p++) {
    for (let canal = 0; canal < 3; canal++) rgb[p * 3 + canal] = pixels[p * 4 + canal];
    conhecido[p] = mascara[p];
  }

  for (let passo = 0; passo < passos; passo++) {
    const novos = [];
    for (let p = 0; p < total; p++) {
      if (conhecido[p]) continue;
      const x = p % largura;
      const y = Math.floor(p / largura);
      const soma = [0, 0, 0];
      let quantidade = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const vx = x + dx;
          const vy = y + dy;
          if (vx < 0 || vy < 0 || vx >= largura || vy >= altura) continue;
          const v = vy * largura + vx;
          if (!conhecido[v]) continue;
          for (let canal = 0; canal < 3; canal++) soma[canal] += rgb[v * 3 + canal];
          quantidade++;
        }
      }
      if (quantidade > 0) novos.push([p, soma.map((valor) => valor / quantidade)]);
    }
    for (const [p, cor] of novos) {
      for (let canal = 0; canal < 3; canal++) rgb[p * 3 + canal] = cor[canal];
      conhecido[p] = 1;
    }
  }

  return Buffer.from(rgb.map((valor) => Math.round(valor)));
}

/**
 * Canal alfa na escala final: a máscara é ampliada e suavizada, e a borda ganha uma transição
 * curta (sem serrilhado), um pouco para dentro, para tirar a franja creme que a placa deixou.
 */
async function contornoLiso(mascara, largura, altura, fator) {
  const binaria = Buffer.from(mascara.map((dentro) => (dentro ? 255 : 0)));
  const { data, info } = await sharp(binaria, {
    raw: { width: largura, height: altura, channels: 1 },
  })
    .resize(largura * fator, altura * fator, { kernel: 'cubic' })
    .blur(fator / 2.5)
    .extractChannel(0)
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (info.channels !== 1) {
    throw new Error(`Máscara com ${info.channels} canais; esperado 1.`);
  }

  const LIMITE = 0.58;
  const MEIA_TRANSICAO = 0.12;
  const alfa = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i++) {
    const t = Math.min(
      1,
      Math.max(0, (data[i] / 255 - (LIMITE - MEIA_TRANSICAO)) / (2 * MEIA_TRANSICAO)),
    );
    alfa[i] = Math.round(t * t * (3 - 2 * t) * 255);
  }
  return alfa;
}
