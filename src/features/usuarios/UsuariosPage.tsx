import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { usuariosApi, type CriarUsuarioPayload } from '../../api/usuarios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate(form);
  }

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-6">
      <h1 className="text-2xl font-bold mb-6">Usuários</h1>

      <Card className="max-w-[560px]">
        <CardHeader>
          <CardTitle>Novo usuário</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  name="nome"
                  value={form.nome}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sobrenome">Sobrenome</Label>
                <Input
                  id="sobrenome"
                  name="sobrenome"
                  value={form.sobrenome}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                value={form.username}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="senha">Senha inicial</Label>
              <Input
                id="senha"
                type="password"
                name="senha"
                value={form.senha}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="role">Perfil de acesso</Label>
              <Select
                value={form.role}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, role: value as CriarUsuarioPayload['role'] }))
                }
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="atendente">Atendente — apenas PDV</SelectItem>
                  <SelectItem value="admin">Administrador — acesso total</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Criando...' : 'Criar usuário'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
