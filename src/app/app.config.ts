import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  provideClientHydration,
  withIncrementalHydration,
  withNoHttpTransferCache,
} from '@angular/platform-browser';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })),
    // Os dados da API viajam no HTML pelo TransferState (veja core/api/recurso-da-api.ts).
    provideClientHydration(withIncrementalHydration(), withNoHttpTransferCache()),
  ],
};
