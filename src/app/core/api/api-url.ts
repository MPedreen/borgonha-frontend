import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Endereço base da API. No navegador vem do environment; na pré-renderização é
 * substituído em `app.config.server.ts`.
 */
export const API_URL = new InjectionToken<string>('API_URL', {
  providedIn: 'root',
  factory: () => environment.apiUrl,
});
