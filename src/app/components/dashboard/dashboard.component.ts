import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DataService } from '../../services/data.service';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LoadingSpinnerComponent } from '../shared/loading-spinner.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingSpinnerComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  // Definimos stats$ como un Observable de un objeto único
  stats$: Observable<any> | undefined;
  private dataService = inject(DataService);
  ngOnInit() {
    // Llamamos a la función que creaste en el servicio
    this.stats$ = this.dataService.getUserStats().pipe(
      catchError((err) => {
        console.error('Error de Firebase:', err);
        return of(null);
        // Si falla, devuelve null para que el HTML no rompa
      }),
    );
  }
}
