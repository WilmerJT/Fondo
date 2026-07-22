import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DataService } from '../../services/data.service';
import type { JuegoDoc } from '../../models/juego.types';
import { PaintGameComponent } from './paint-game.component';

@Component({
  selector: 'app-paint-page',
  standalone: true,
  imports: [CommonModule, RouterModule, PaintGameComponent],
  template: `
    <div class="game-detail" *ngIf="game; else loading">
      <button class="btn-back" type="button" routerLink="/juegos">← Volver</button>
      <div class="game-hero">
        <span class="game-icon">{{ game.icon }}</span>
        <div>
          <h1>{{ game.title }}</h1>
          <p>{{ game.description }}</p>
        </div>
      </div>

      <section class="game-panel">
        <h2>Juego interactivo</h2>
        <app-paint-game [examples]="game.examples || []"></app-paint-game>
      </section>
    </div>

    <ng-template #loading>
      <p class="loading-state">Cargando juego...</p>
    </ng-template>
  `,
  styles: [
    `:host { display: block; padding: 20px; background: #f4f7f6; min-height: 100vh; }`,
    `.btn-back { border: none; background: none; font-size: 24px; cursor: pointer; margin-bottom: 16px; }`,
    `.game-hero { background: linear-gradient(135deg, #2563eb 0%, #38bdf8 100%); color: white; border-radius: 20px; padding: 24px; display: flex; gap: 16px; align-items: center; margin-bottom: 16px; }`,
    `.game-icon { font-size: 44px; }`,
    `.game-panel { background: white; border-radius: 16px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); margin-bottom: 16px; }`,
    `.loading-state { text-align: center; color: #666; }`
  ],
})
export class PaintPageComponent implements OnInit {
  game: JuegoDoc | null = null;
  private dataService = inject(DataService);

  ngOnInit(): void {
    this.dataService.getJuegosFromFirebase().subscribe((juegos) => {
      this.game = juegos.find((juego) => juego.id === 'paint') ?? null;
    });
  }
}
