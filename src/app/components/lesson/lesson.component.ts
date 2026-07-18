import {
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Subscription } from 'rxjs';
import type { ExerciseDoc } from '../../models/exercise.types';
import { LessonCompleteComponent } from '../lesson-complete/lesson-complete.component';
import { LoadingSpinnerComponent } from '../shared/loading-spinner.component';
import { VocabularyLessonComponent, type ExerciseResult as VocabResult } from './vocabulary-lesson.component';
import { TranslationLessonComponent, type ExerciseResult as TransResult } from './translation-lesson.component';

@Component({
  selector: 'app-lesson',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    LessonCompleteComponent,
    VocabularyLessonComponent,
    TranslationLessonComponent,
    LoadingSpinnerComponent,
  ],
  templateUrl: './lesson.component.html',
  styleUrl: './lesson.component.css',
})
export class LessonComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dataService = inject(DataService);

  unitId: string | null = null;
  unitTitle = '';
  exercises: ExerciseDoc[] = [];
  currentIndex = 0;
  loading = true;
  loadError: string | null = null;

  xpEarnedThisLesson = 0;
  correctAnswersCount = 0;

  lessonCompleted = false;
  completionStreak: number | null = null;
  nextUnitUnlocked = false;
  nextUnitTitle: string | null = null;

  private exercisesSub?: Subscription;
  private exercisesLoadedOnce = false;

  get currentExercise(): ExerciseDoc | null {
    return this.exercises[this.currentIndex] ?? null;
  }

  get progress(): number {
    if (!this.exercises.length) return 0;
    return ((this.currentIndex + 1) / this.exercises.length) * 100;
  }

  get lessonType(): 'vocabulary' | 'translation' | null {
    const ex = this.currentExercise;
    if (!ex) return null;

    switch (ex.type) {
      case 'word_order':
      case 'multiple_choice':
      case 'match_words':
        return 'vocabulary';
      case 'translate_text':
      case 'listen_and_write':
        return 'translation';
      default:
        return null;
    }
  }

  ngOnInit() {
    this.unitId = this.route.snapshot.paramMap.get('id');
    if (!this.unitId) {
      this.loading = false;
      this.loadError = 'Unidad no válida.';
      return;
    }
    void this.dataService.getUnitSummary(this.unitId).then((s) => {
      this.unitTitle = s?.title ?? '';
    });
    this.exercisesSub = this.dataService
      .getExercisesForUnit(this.unitId)
      .subscribe({
        next: (list) => {
          this.exercises = [...list].sort((a, b) => a.order - b.order);
          this.loading = false;
          if (!this.exercisesLoadedOnce) {
            this.exercisesLoadedOnce = true;
            this.xpEarnedThisLesson = 0;
            this.correctAnswersCount = 0;
          }
          if (!this.lessonCompleted && this.exercises.length && this.currentExercise) {
            // El componente hijo se encarga de preparar el estado del ejercicio.
          }
        },
        error: () => {
          this.loadError = 'No se pudieron cargar los ejercicios.';
          this.loading = false;
        },
      });
  }

  ngOnDestroy() {
    this.exercisesSub?.unsubscribe();
  }

  goToLearningPath(): void {
    void this.router.navigate(['/learning-path']);
  }

  goToDashboard(): void {
    void this.router.navigate(['/dashboard']);
  }

  restartLesson(): void {
    this.lessonCompleted = false;
    this.currentIndex = 0;
    this.xpEarnedThisLesson = 0;
    this.correctAnswersCount = 0;
    this.completionStreak = null;
    this.nextUnitUnlocked = false;
    this.nextUnitTitle = null;
  }

  async onExerciseSubmitted(result: VocabResult | TransResult) {
    if (!result.correct) {
      alert('Inténtalo de nuevo.');
      return;
    }

    const xp = result.xpEarned;
    const isLast = this.currentIndex >= this.exercises.length - 1;

    try {
      if (isLast) {
        const { streak } = await this.dataService.addXP(xp, {
          applyStreak: true,
        });
        this.xpEarnedThisLesson += xp;
        this.correctAnswersCount += 1;
        const { nextUnitUnlocked, nextUnitTitle } =
          await this.dataService.completeUnit(this.unitId!);
        this.completionStreak = streak;
        this.nextUnitUnlocked = nextUnitUnlocked;
        this.nextUnitTitle = nextUnitTitle;
        this.lessonCompleted = true;
      } else {
        await this.dataService.addXP(xp, { applyStreak: false });
        this.xpEarnedThisLesson += xp;
        this.correctAnswersCount += 1;
        this.currentIndex++;
      }
    } catch (error: unknown) {
      console.error(error);
      if (
        error instanceof Error &&
        error.message === 'USER_DOC_MISSING'
      ) {
        alert('No hay perfil en Firestore para tu cuenta. Vuelve a iniciar sesión.');
      } else {
        alert('Error al guardar progreso.');
      }
    }
  }
}
