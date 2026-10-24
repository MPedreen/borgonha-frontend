import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** Raiz do app: o site e a área do administrador têm estruturas próprias (veja app.routes.ts). */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class App {}
