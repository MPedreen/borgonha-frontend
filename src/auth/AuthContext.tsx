import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { getCurrentUser, isAuthenticated, logout as authLogout, type UserInfo } from './auth';

interface AuthState {
  authenticated: boolean;
  username: string | undefined;
  roles: string[];
}

interface AuthContextValue extends AuthState {
  onLogin: (user: UserInfo) => void;
  onLogout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    if (isAuthenticated()) {
      const user = getCurrentUser();
      return { authenticated: true, username: user?.preferredUsername, roles: user?.roles ?? [] };
    }
    return { authenticated: false, username: undefined, roles: [] };
  });

  const onLogin = useCallback((user: UserInfo) => {
    setState({ authenticated: true, username: user.preferredUsername, roles: user.roles });
  }, []);

  const onLogout = useCallback(async () => {
    await authLogout();
    setState({ authenticated: false, username: undefined, roles: [] });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, onLogin, onLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthContext deve ser usado dentro de AuthProvider');
  return context;
}
