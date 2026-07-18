import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { DataService } from '../../services/data.service';
import type { JuegoDoc } from '../../models/juego.types';

@Component({
  selector: 'app-juegos',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './juegos.component.html',
  styleUrl: './juegos.component.css',
})
export class JuegosComponent implements OnInit {
  juegos$: Observable<JuegoDoc[]> | undefined;
  private dataService = inject(DataService);

  ngOnInit() {
    this.juegos$ = this.dataService.getJuegosFromFirebase();
  }

  statusLabel(status: JuegoDoc['status']): string {
    return status === 'available' ? 'Jugar' : 'Próximamente';
  }

  getGameRoute(gameId: string): string[] {
    return ['/juegos', gameId];
  }
}
