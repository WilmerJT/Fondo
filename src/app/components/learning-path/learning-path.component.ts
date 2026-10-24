import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DataService } from '../../services/data.service';
import { Observable } from 'rxjs';
import { LoadingSpinnerComponent } from '../shared/loading-spinner.component';

@Component({
  selector: 'app-learning-path',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingSpinnerComponent],
  templateUrl: './learning-path.component.html',
  styleUrl: './learning-path.component.css',
})
export class LearningPathComponent implements OnInit {
  units$: Observable<any[]> | undefined;
  openUnitId: string | null = null;
  private dataService = inject(DataService);

  ngOnInit() {
    this.units$ = this.dataService.getUnitsFromFirebase();
  }

  toggleUnit(unitId: string): void {
    this.openUnitId = this.openUnitId === unitId ? null : unitId;
  }

  isUnitOpen(unitId: string): boolean {
    return this.openUnitId === unitId;
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'completed':
        return 'Completado';
      case 'available':
        return 'Disponible';
      case 'locked':
      default:
        return 'Bloqueado';
    }
  }
}
