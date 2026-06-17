import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import keycloak from './auth/keycloak';
import { KeycloakProvider } from './auth/KeycloakProvider';
import { App } from './App';
import './styles/tokens.css';
import './styles/base.css';

const queryClient = new QueryClient();

keycloak
  .init({ onLoad: 'login-required', pkceMethod: 'S256' })
  .then((autenticado) => {
    if (!autenticado) {
      return;
    }

    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <KeycloakProvider>
            <BrowserRouter>
              <App />
              <Toaster position="top-right" />
            </BrowserRouter>
          </KeycloakProvider>
        </QueryClientProvider>
      </StrictMode>,
    );
  })
  .catch((erro: unknown) => {
    console.error('Falha ao inicializar autenticação', erro);
  });
