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
 * Provisórios: as placas têm baixa resolução; trocar pelos recortes originais em alta.
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

await rm(PASTA_IMAGENS, { recursive: true, force: true });

for (const foto of FOTOS) {
  const base = await sharp(join(PASTA_ORIGINAIS, foto.origem)).extract(foto.recorte).toBuffer();
  await salvarEmTodasAsLarguras(base, foto.destino, { quality: 78 });
}

for (const placa of PLACAS_DO_CARDAPIO) {
  for (const cookie of placa.cookies) {
    const recorte = await recortarCookieSemFundo(join(PASTA_ORIGINAIS, placa.origem), cookie.faixa);
    await salvarEmTodasAsLarguras(recorte, cookie.destino, { quality: 86, alphaQuality: 90 });
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
 * e tudo o que está fora dele (ligado às bordas) vira transparente.
 */
async function recortarCookieSemFundo(arquivo, [topo, base]) {
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

  // 2. Tudo que não é o cookie e encosta nas bordas fica transparente (buracos internos continuam opacos).
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

  // 3. Canal alfa com borda suavizada (média 3×3) e corte justo com margem.
  const alfa = new Float32Array(total);
  for (let p = 0; p < total; p++) alfa[p] = fora[p] ? 0 : 1;
  let minX = largura,
    minY = altura,
    maxX = 0,
    maxY = 0;
  for (let p = 0; p < total; p++) {
    let soma = 0;
    let quantidade = 0;
    for (const v of [p, ...vizinhos(p)]) {
      soma += alfa[v];
      quantidade++;
    }
    const valor = Math.round((soma / quantidade) * 255);
    data[p * 4 + 3] = valor;
    if (valor > 0) {
      const x = p % largura;
      const y = Math.floor(p / largura);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }

  const lado = Math.max(maxX - minX, maxY - minY) + 9;
  const recortado = await sharp(data, { raw: { width: largura, height: altura, channels: 4 } })
    .extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 })
    .png()
    .toBuffer();

  // Centraliza num quadrado transparente para todos os cookies ficarem do mesmo tamanho nos cards.
  return sharp({
    create: { width: lado, height: lado, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: recortado, gravity: 'center' }])
    .png()
    .toBuffer();
}
