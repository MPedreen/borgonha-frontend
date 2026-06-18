import { NavLink, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../auth/useAuth';
import { ingredientesApi } from '../api/ingredientes';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
      <header className="flex items-center justify-between gap-6 px-6 py-3 bg-primary text-primary-foreground">
        <div className="font-bold text-lg">Borgonha Confeitaria</div>

        <nav className="flex gap-6 flex-1">
          {(
            [
              { to: '/pdv', label: 'PDV' },
              ...(isAdmin ? [{ to: '/produtos', label: 'Produtos' }] : []),
            ] as { to: string; label: string; alerta?: boolean }[]
          ).concat(
            isAdmin
              ? [
                  { to: '/estoque', label: 'Estoque', alerta: totalAlertas > 0 },
                  { to: '/relatorios', label: 'Relatórios' },
                  { to: '/usuarios', label: 'Usuários' },
                ]
              : [],
          ).map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'inline-flex items-center gap-1 text-primary-foreground/80 no-underline transition-opacity hover:text-primary-foreground hover:underline',
                  isActive && 'text-primary-foreground font-semibold underline',
                )
              }
            >
              {link.label}
              {link.alerta && (
                <span className="bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5 text-xs font-bold leading-none">
                  {totalAlertas}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <span className="text-sm text-primary-foreground/90">{username}</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            onClick={logout}
          >
            Sair
          </Button>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
