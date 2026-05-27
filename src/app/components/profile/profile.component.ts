import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
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
  private auth = inject(AuthService);
  private router = inject(Router);

  constructor() {
    this.vm$ = this.dataService.getUserStats().pipe(
      map((user) => ({ loading: false, user })),
      startWith({ loading: true, user: null }),
    );
  }

  async logout() {
    await this.auth.signOut();
    await this.router.navigate(['/login']);
  }
}
