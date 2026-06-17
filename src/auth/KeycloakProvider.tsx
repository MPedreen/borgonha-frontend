import { createContext, useContext, type ReactNode } from 'react';
import keycloak from './keycloak';

interface AuthContextValue {
  username: string | undefined;
  roles: string[];
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function KeycloakProvider({ children }: { children: ReactNode }) {
  const value: AuthContextValue = {
    username: keycloak.tokenParsed?.preferred_username,
    roles: keycloak.realmAccess?.roles ?? [],
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthContext deve ser usado dentro de KeycloakProvider');
  }

  return context;
}
