import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DataService } from '../../services/data.service';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})

export class ProfileComponent {
  vm$: Observable<{ loading: boolean; user: any | null }>;
  private dataService = inject(DataService);

  constructor() {
    this.vm$ = this.dataService.getUserStats().pipe(
      map((user) => ({ loading: false, user })),
      startWith({ loading: true, user: null }),
    );
  }
}
