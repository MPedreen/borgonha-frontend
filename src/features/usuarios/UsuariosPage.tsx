import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { usuariosApi, type CriarUsuarioPayload } from '../../api/usuarios';

const FORM_INICIAL: CriarUsuarioPayload = {
  nome: '',
  sobrenome: '',
  email: '',
  username: '',
  senha: '',
  role: 'atendente',
};

export function UsuariosPage() {
  const [form, setForm] = useState<CriarUsuarioPayload>(FORM_INICIAL);

  const mutation = useMutation({
    mutationFn: usuariosApi.criar,
    onSuccess: () => {
      toast.success('Usuário criado com sucesso!');
      setForm(FORM_INICIAL);
    },
    onError: () => {
      toast.error('Erro ao criar usuário. Verifique se o username ou e-mail já existe.');
    },
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate(form);
  }

  return (
    <div className="page">
      <h1>Usuários</h1>

      <div className="card" style={{ maxWidth: 560 }}>
        <h2>Novo usuário</h2>

        <form onSubmit={handleSubmit}>
          <div className="grid-2-col">
            <div className="field">
              <label className="label">Nome</label>
              <input
                className="input"
                name="nome"
                value={form.nome}
                onChange={handleChange}
                required
              />
            </div>

            <div className="field">
              <label className="label">Sobrenome</label>
              <input
                className="input"
                name="sobrenome"
                value={form.sobrenome}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="field">
            <label className="label">E-mail</label>
            <input
              className="input"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="field">
            <label className="label">Username</label>
            <input
              className="input"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="field">
            <label className="label">Senha inicial</label>
            <input
              className="input"
              type="password"
              name="senha"
              value={form.senha}
              onChange={handleChange}
              required
            />
          </div>

          <div className="field">
            <label className="label">Perfil de acesso</label>
            <select
              className="select"
              name="role"
              value={form.role}
              onChange={handleChange}
            >
              <option value="atendente">Atendente — apenas PDV</option>
              <option value="admin">Administrador — acesso total</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Criando...' : 'Criar usuário'}
          </button>
        </form>
      </div>
    </div>
  );
}
