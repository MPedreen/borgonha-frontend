// Gera o sprite de ícones (public/icones.svg) e a lista tipada de nomes (src/app/ui/icone/nomes-icones.ts).
// Ícones: Lucide (licença ISC, lucide.dev) e Simple Icons (CC0, simpleicons.org).
// Uso: npm run icones
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { siIfood, siInstagram, siWhatsapp } from 'simple-icons';

const ICONES_LUCIDE = [
  'arrow-right',
  'bike',
  'chevron-down',
  'chevron-left',
  'chevron-right',
  'clock',
  'cookie',
  'external-link',
  'hand-heart',
  'map-pin',
  'menu',
  'sparkles',
  'store',
  'x',
];

const ICONES_DE_MARCA = { ifood: siIfood, instagram: siInstagram, whatsapp: siWhatsapp };

const simbolos = [];

for (const nome of ICONES_LUCIDE) {
  const svg = await readFile(
    new URL(`../node_modules/lucide-static/icons/${nome}.svg`, import.meta.url),
    'utf8',
  );
  const desenho = svg
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .replace(/\s*\n\s*/g, '');
  simbolos.push(
    `<symbol id="${nome}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${desenho}</symbol>`,
  );
}

for (const [nome, icone] of Object.entries(ICONES_DE_MARCA)) {
  simbolos.push(
    `<symbol id="${nome}" viewBox="0 0 24 24"><path fill="currentColor" d="${icone.path}"/></symbol>`,
  );
}

const sprite = [
  '<svg xmlns="http://www.w3.org/2000/svg">',
  '<!-- Gerado por scripts/gerar-icones.mjs. Ícones: Lucide (ISC, lucide.dev) e Simple Icons (CC0, simpleicons.org). -->',
  ...simbolos,
  '</svg>',
  '',
].join('\n');

const nomes = [...ICONES_LUCIDE, ...Object.keys(ICONES_DE_MARCA)].sort();
const tipos = [
  '// Gerado por scripts/gerar-icones.mjs — não edite à mão.',
  'export const NOMES_ICONES = [',
  ...nomes.map((nome) => `  '${nome}',`),
  '] as const;',
  '',
  'export type NomeIcone = (typeof NOMES_ICONES)[number];',
  '',
].join('\n');

await writeFile(fileURLToPath(new URL('../public/icones.svg', import.meta.url)), sprite);
await writeFile(
  fileURLToPath(new URL('../src/app/ui/icone/nomes-icones.ts', import.meta.url)),
  tipos,
);

console.log(`${nomes.length} ícones gerados.`);
