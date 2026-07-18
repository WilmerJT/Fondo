import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { DataService } from '../../services/data.service';
import type { CuentoDoc } from '../../models/cuento.types';

@Component({
  selector: 'app-cuentos',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cuentos.component.html',
  styleUrl: './cuentos.component.css',
})
export class CuentosComponent implements OnInit {
  cuentos$: Observable<CuentoDoc[]> | undefined;
  private dataService = inject(DataService);

  ngOnInit() {
    this.cuentos$ = this.dataService.getCuentosFromFirebase();
  }

  statusLabel(status: CuentoDoc['status']): string {
    return status === 'available' ? 'Leer' : 'Próximamente';
  }
}
