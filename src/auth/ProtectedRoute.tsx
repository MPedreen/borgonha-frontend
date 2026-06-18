import { Navigate, Outlet } from 'react-router-dom';
import { useAuthContext } from './AuthContext';
import { useAuth } from './useAuth';

interface ProtectedRouteProps {
  roles: string[];
}

export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { authenticated } = useAuthContext();
  const { roles: rolesDoUsuario } = useAuth();

  if (!authenticated) return <Navigate to="/login" replace />;

  const autorizado = roles.some((role) => rolesDoUsuario.includes(role));
  if (!autorizado) return <Navigate to="/sem-acesso" replace />;

  return <Outlet />;
}
