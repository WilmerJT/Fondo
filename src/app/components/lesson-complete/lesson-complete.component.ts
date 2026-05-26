import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-lesson-complete',
  standalone: true,
  imports: [],
  templateUrl: './lesson-complete.component.html',
  styleUrl: './lesson-complete.component.scss',
})
export class LessonCompleteComponent {
  readonly unitId = input.required<string>();
  readonly unitTitle = input<string>('');
  readonly xpEarned = input<number>(0);
  readonly totalExercises = input<number>(0);
  readonly correctAnswers = input<number>(0);
  readonly streak = input<number | null>(null);
  readonly nextUnitUnlocked = input<boolean>(false);
  readonly nextUnitTitle = input<string | null>(null);

  readonly continueToMap = output<void>();
  readonly repeatLesson = output<void>();
  readonly goToDashboard = output<void>();

  protected streakDisplay(): number {
    const s = this.streak();
    return typeof s === 'number' && !Number.isNaN(s) ? s : 0;
  }
}
