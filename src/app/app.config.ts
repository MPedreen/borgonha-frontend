import { IMAGE_CONFIG, IMAGE_LOADER } from '@angular/common';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  provideClientHydration,
  withIncrementalHydration,
  withNoHttpTransferCache,
} from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { carregadorDeImagens } from './core/imagens/carregador-de-imagens';
import { LARGURAS_IMAGEM } from './core/imagens/larguras-imagem';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
      // Parâmetros da rota chegam aos componentes como input() (ex.: o slug no editor de produto).
      withComponentInputBinding(),
    ),
    // Os dados da API viajam no HTML pelo TransferState (veja core/api/recurso-da-api.ts).
    provideClientHydration(withIncrementalHydration(), withNoHttpTransferCache()),
    { provide: IMAGE_LOADER, useValue: carregadorDeImagens },
    { provide: IMAGE_CONFIG, useValue: { breakpoints: [...LARGURAS_IMAGEM] } },
  ],
};
