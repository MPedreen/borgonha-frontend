import { useAuthContext } from './AuthContext';

export function useAuth() {
  const { username, roles, onLogout } = useAuthContext();

  return {
    username,
    roles,
    hasRole: (role: string) => roles.includes(role),
    logout: onLogout,
  };
}
