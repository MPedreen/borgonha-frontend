import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuthContext } from './auth/AuthContext';
import { AppLayout } from './layouts/AppLayout';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { LoginPage } from './features/auth/LoginPage';
import { SemAcessoPage } from './pages/SemAcessoPage';
import { PdvPage } from './features/pdv/PdvPage';
import { ReciboPage } from './features/pdv/ReciboPage';
import { ProdutosPage } from './features/produtos/ProdutosPage';
import { EstoquePage } from './features/estoque/EstoquePage';
import { RelatoriosPage } from './features/relatorios/RelatoriosPage';
import { UsuariosPage } from './features/usuarios/UsuariosPage';

export function App() {
  const { authenticated } = useAuthContext();

  return (
    <Routes>
      <Route
        path="/login"
        element={authenticated ? <Navigate to="/pdv" replace /> : <LoginPage />}
      />

      <Route element={<AppLayout />}>
        <Route
          path="/"
          element={<Navigate to={authenticated ? '/pdv' : '/login'} replace />}
        />
        <Route path="/sem-acesso" element={<SemAcessoPage />} />

        <Route element={<ProtectedRoute roles={['admin', 'atendente']} />}>
          <Route path="/pdv" element={<PdvPage />} />
          <Route path="/vendas/:id" element={<ReciboPage />} />
        </Route>

        <Route element={<ProtectedRoute roles={['admin']} />}>
          <Route path="/produtos" element={<ProdutosPage />} />
          <Route path="/estoque" element={<EstoquePage />} />
          <Route path="/relatorios" element={<RelatoriosPage />} />
          <Route path="/usuarios" element={<UsuariosPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
