import { Component, inject, input, signal } from '@angular/core';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { Botao } from '../../ui/botao/botao';
import { Icone } from '../../ui/icone/icone';
import { mensagemDeErro } from '../core/requisicoes-admin';
import { semIndexacao } from '../core/sem-indexacao';
import { SessaoAdmin } from '../core/sessao-admin';

/** Tela de login da área do administrador. */
@Component({
  selector: 'app-entrar',
  imports: [Botao, FormField, Icone, RouterLink],
  templateUrl: './entrar.html',
  styleUrl: './entrar.scss',
})
export class Entrar {
  private readonly sessaoAdmin = inject(SessaoAdmin);
  private readonly router = inject(Router);

  /** Query param `?sessao=expirada`, quando a pessoa foi mandada de volta para cá. */
  readonly sessao = input<string>();

  protected readonly credenciais = signal({ usuario: '', senha: '' });
  protected readonly formulario = form(this.credenciais, (campo) => {
    required(campo.usuario, { message: 'Informe o usuário.' });
    required(campo.senha, { message: 'Informe a senha.' });
  });

  protected readonly senhaVisivel = signal(false);
  protected readonly erro = signal<string | null>(null);

  constructor() {
    semIndexacao();
  }

  protected async entrar(evento: Event): Promise<void> {
    evento.preventDefault();
    this.erro.set(null);

    await submit(this.formulario, async () => {
      const { usuario, senha } = this.credenciais();
      try {
        await this.sessaoAdmin.entrar(usuario, senha);
        await this.router.navigateByUrl('/admin');
      } catch (erro) {
        this.erro.set(mensagemDeErro(erro, 'Não foi possível entrar. Tente de novo.'));
        this.credenciais.update((atuais) => ({ ...atuais, senha: '' }));
      }
      return undefined;
    });
  }
}
