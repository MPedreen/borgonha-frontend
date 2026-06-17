import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: 'borgonha',
  clientId: 'borgonha-frontend',
});

export default keycloak;
