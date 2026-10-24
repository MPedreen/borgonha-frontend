import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { Icone } from '../../ui/icone/icone';
import { CardapioAdminStore } from '../core/cardapio-admin-store';
import { semIndexacao } from '../core/sem-indexacao';
import { SessaoAdmin } from '../core/sessao-admin';

/** Estrutura das páginas da área do administrador (depois do login). */
@Component({
  selector: 'app-layout-admin',
  imports: [Icone, RouterLink, RouterOutlet],
  template: `
    <header class="topo">
      <div class="topo__conteudo">
        <a class="topo__marca" routerLink="/admin">
          Borgonha <span class="topo__area">Área do administrador</span>
        </a>
        <nav class="topo__acoes" aria-label="Área do administrador">
          <a class="topo__acao" href="/" target="_blank" rel="noopener">
            <app-icone nome="external-link" /> Ver o site
            <span class="visualmente-oculto">(abre em nova aba)</span>
          </a>
          <button type="button" class="topo__acao" (click)="sair()">
            <app-icone nome="log-out" /> Sair
          </button>
        </nav>
      </div>
    </header>

    <main class="conteudo">
      <router-outlet />
    </main>
  `,
  styleUrl: './layout-admin.scss',
})
export class LayoutAdmin {
  private readonly sessao = inject(SessaoAdmin);
  private readonly cardapio = inject(CardapioAdminStore);
  private readonly router = inject(Router);

  constructor() {
    semIndexacao();
  }

  protected async sair(): Promise<void> {
    try {
      await this.sessao.sair();
    } finally {
      this.cardapio.cardapio.set(null);
      await this.router.navigateByUrl('/admin/entrar');
    }
  }
}
