import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './useAuth';

interface ProtectedRouteProps {
  roles: string[];
}

export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { roles: rolesDoUsuario } = useAuth();
  const autorizado = roles.some((role) => rolesDoUsuario.includes(role));

  if (!autorizado) {
    return <Navigate to="/sem-acesso" replace />;
  }

  return <Outlet />;
}
