import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DataService } from '../../services/data.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-learning-path',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './learning-path.component.html',
  styleUrl: './learning-path.component.css',
})
export class LearningPathComponent implements OnInit {
  units$: Observable<any[]> | undefined;
  private dataService = inject(DataService);
  ngOnInit() {
    // Llamamos al nuevo método de Firebase
    this.units$ = this.dataService.getUnitsFromFirebase();
  }
}
