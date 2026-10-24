import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { environment } from '../environments/environment';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { API_URL } from './core/api/api-url';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    // Na pré-renderização a API é chamada direto pelo build (por padrão, a API local).
    {
      provide: API_URL,
      useFactory: () => process.env['BORGONHA_API_URL'] ?? environment.apiUrlPrerenderizacao,
    },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
