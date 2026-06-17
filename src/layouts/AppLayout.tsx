import { NavLink, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../auth/useAuth';
import { ingredientesApi } from '../api/ingredientes';

export function AppLayout() {
  const { username, hasRole, logout } = useAuth();
  const isAdmin = hasRole('admin');

  const { data: alertas } = useQuery({
    queryKey: ['ingredientes-alertas'],
    queryFn: ingredientesApi.listarAlertas,
    enabled: isAdmin,
    refetchInterval: 60_000,
  });

  const totalAlertas = alertas?.length ?? 0;

  return (
    <div>
      <header className="navbar">
        <div className="navbar-brand">Borgonha Confeitaria</div>
        <nav className="navbar-links">
          <NavLink to="/pdv">PDV</NavLink>
          {isAdmin && <NavLink to="/produtos">Produtos</NavLink>}
          {isAdmin && (
            <NavLink to="/estoque">
              Estoque
              {totalAlertas > 0 && <span className="navbar-alert-badge">{totalAlertas}</span>}
            </NavLink>
          )}
          {isAdmin && <NavLink to="/relatorios">Relatórios</NavLink>}
        </nav>
        <div className="navbar-user">
          <span>{username}</span>
          <button className="btn btn-secondary" onClick={logout}>
            Sair
          </button>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
