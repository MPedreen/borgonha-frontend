import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../auth/auth';
import { useAuthContext } from '../../auth/AuthContext';

export function LoginPage() {
  const navigate = useNavigate();
  const { onLogin } = useAuthContext();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    try {
      const user = await login(username, password);
      onLogin(user);
      navigate('/pdv', { replace: true });
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-background)',
    }}>
      <div className="card" style={{
        width: 'min(400px, calc(100vw - 2 * var(--space-4)))',
        padding: 'var(--space-8)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <h1 style={{
            color: 'var(--color-primary)',
            fontSize: '2rem',
            margin: '0 0 var(--space-1)',
          }}>
            Borgonha
          </h1>
          <p style={{ color: 'var(--color-neutral-500)', margin: 0, fontSize: '0.95rem' }}>
            Confeitaria
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="label" htmlFor="username">Usuário</label>
            <input
              id="username"
              className="input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              required
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="password">Senha</label>
            <input
              id="password"
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {erro && (
            <p style={{
              color: 'var(--color-danger)',
              fontSize: '0.875rem',
              margin: '0 0 var(--space-3)',
            }}>
              {erro}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: 'var(--space-3)' }}
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
