import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { LessonComponent } from './lesson.component';
import { DataService } from '../../services/data.service';

describe('LessonComponent', () => {
  let component: LessonComponent;
  let fixture: ComponentFixture<LessonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LessonComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: () => 'unit_test' } },
          },
        },
        {
          provide: DataService,
          useValue: {
            getExercisesForUnit: () => of([]),
            getUnitSummary: async () => ({ title: 'Test' }),
            addXP: async () => ({
              streak: 0,
              level: 'Principiante A1',
              newXP: 0,
            }),
            completeUnit: async () => ({
              nextUnitUnlocked: false,
              nextUnitTitle: null,
            }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LessonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
