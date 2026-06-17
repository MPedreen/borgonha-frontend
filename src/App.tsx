import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { SemAcessoPage } from './pages/SemAcessoPage';
import { PdvPage } from './features/pdv/PdvPage';
import { ReciboPage } from './features/pdv/ReciboPage';
import { ProdutosPage } from './features/produtos/ProdutosPage';
import { EstoquePage } from './features/estoque/EstoquePage';
import { RelatoriosPage } from './features/relatorios/RelatoriosPage';

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/pdv" replace />} />
        <Route path="/sem-acesso" element={<SemAcessoPage />} />

        <Route element={<ProtectedRoute roles={['admin', 'atendente']} />}>
          <Route path="/pdv" element={<PdvPage />} />
          <Route path="/vendas/:id" element={<ReciboPage />} />
        </Route>

        <Route element={<ProtectedRoute roles={['admin']} />}>
          <Route path="/produtos" element={<ProdutosPage />} />
          <Route path="/estoque" element={<EstoquePage />} />
          <Route path="/relatorios" element={<RelatoriosPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
