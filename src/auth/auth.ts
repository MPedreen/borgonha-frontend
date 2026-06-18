const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL as string;
const REALM = 'borgonha';
const CLIENT_ID = 'borgonha-frontend';
const STORAGE_KEY = 'borgonha_auth';

interface TokenState {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  refreshExpiresAt: number;
}

export interface UserInfo {
  preferredUsername: string;
  roles: string[];
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
}

function parseJwt(token: string): UserInfo {
  const payload = JSON.parse(atob(token.split('.')[1])) as {
    preferred_username: string;
    realm_access?: { roles: string[] };
  };
  return {
    preferredUsername: payload.preferred_username,
    roles: payload.realm_access?.roles ?? [],
  };
}

function loadState(): TokenState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TokenState) : null;
  } catch {
    return null;
  }
}

function saveState(state: TokenState): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function clearState(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

function buildState(data: TokenResponse): TokenState {
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    refreshExpiresAt: Date.now() + data.refresh_expires_in * 1000,
  };
}

export async function login(username: string, password: string): Promise<UserInfo> {
  const res = await fetch(`${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'password', client_id: CLIENT_ID, username, password }),
  });

  if (!res.ok) {
    const error = (await res.json().catch(() => ({}))) as { error_description?: string };
    throw new Error(error.error_description ?? 'Credenciais inválidas');
  }

  const data = (await res.json()) as TokenResponse;
  saveState(buildState(data));
  return parseJwt(data.access_token);
}

export async function logout(): Promise<void> {
  const state = loadState();
  if (!state) return;

  await fetch(`${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENT_ID, refresh_token: state.refreshToken }),
  }).catch(() => {});

  clearState();
}

export function isAuthenticated(): boolean {
  const state = loadState();
  return state !== null && Date.now() < state.refreshExpiresAt;
}

export function getCurrentUser(): UserInfo | null {
  const state = loadState();
  if (!state) return null;
  try {
    return parseJwt(state.accessToken);
  } catch {
    return null;
  }
}

export async function getAccessToken(): Promise<string | null> {
  const state = loadState();
  if (!state) return null;

  if (Date.now() < state.expiresAt - 30_000) {
    return state.accessToken;
  }

  const res = await fetch(`${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: CLIENT_ID,
      refresh_token: state.refreshToken,
    }),
  });

  if (!res.ok) {
    clearState();
    return null;
  }

  const data = (await res.json()) as TokenResponse;
  saveState(buildState(data));
  return data.access_token;
}
