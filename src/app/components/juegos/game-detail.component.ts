import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DataService } from '../../services/data.service';
import type { JuegoDoc } from '../../models/juego.types';
import { PaintGameComponent } from './paint-game.component';
import { CrosswordGameComponent } from './crossword-game.component';
import { WordSearchGameComponent } from './word-search-game.component';
import { GardenGameComponent } from './garden-game.component';

@Component({
  selector: 'app-game-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PaintGameComponent, CrosswordGameComponent, WordSearchGameComponent, GardenGameComponent],
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
        <h2>Cómo jugar</h2>
        <p>{{ game.description }}</p>
      </section>

      <section class="game-panel">
        <h2>Juego interactivo</h2>
        <ng-container [ngSwitch]="game.type">
          <app-paint-game *ngSwitchCase="'paint'" [examples]="game.examples || []"></app-paint-game>
          <app-crossword-game *ngSwitchCase="'crossword'" [examples]="game.examples || []"></app-crossword-game>
          <app-word-search-game *ngSwitchCase="'word_search'" [examples]="game.examples || []"></app-word-search-game>
          <app-garden-game *ngSwitchCase="'garden'" [examples]="game.examples || []"></app-garden-game>
          <div *ngSwitchDefault>Pronto habrá más actividades.</div>
        </ng-container>
      </section>

      <section class="game-panel">
        <h2>Ejemplos en inglés</h2>
        <ul class="examples-list">
          <li *ngFor="let example of game.examples || []">{{ example }}</li>
        </ul>
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
    `.examples-list { margin: 0; padding-left: 20px; color: #334155; }`,
    `.loading-state { text-align: center; color: #666; }`
  ],
})
export class GameDetailComponent implements OnInit {
  @Input() game: JuegoDoc | null = null;
  private route = inject(ActivatedRoute);
  private dataService = inject(DataService);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }

    this.dataService.getJuegosFromFirebase().subscribe((juegos) => {
      this.game = juegos.find((juego) => juego.id === id) ?? null;
    });
  }
}
