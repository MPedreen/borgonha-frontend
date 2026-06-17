import keycloak from './keycloak';
import { useAuthContext } from './KeycloakProvider';

export function useAuth() {
  const { username, roles } = useAuthContext();

  return {
    username,
    roles,
    hasRole: (role: string) => roles.includes(role),
    logout: () => keycloak.logout({ redirectUri: window.location.origin }),
  };
}
