import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // A landing page sai pronta do build (HTML estático com o cardápio).
  { path: '', renderMode: RenderMode.Prerender },
  // Qualquer outro endereço é resolvido no navegador (página 404).
  { path: '**', renderMode: RenderMode.Client },
];
