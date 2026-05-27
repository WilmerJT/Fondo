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

@Component({
  selector: 'app-lesson',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    LessonCompleteComponent,
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

  availableWords: string[] = [];
  selectedWords: string[] = [];
  textAnswer = '';
  selectedChoice: string | null = null;
  matchSelections: Record<string, string> = {};
  shuffledRights: string[] = [];
  displayChoices: string[] = [];

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
          if (
            !this.lessonCompleted &&
            this.exercises.length &&
            this.currentExercise
          ) {
            this.prepareExerciseState(this.currentExercise);
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
    const ex = this.currentExercise;
    if (ex) {
      this.prepareExerciseState(ex);
    }
  }

  prepareExerciseState(ex: ExerciseDoc) {
    this.textAnswer = '';
    this.selectedChoice = null;
    this.matchSelections = {};
    this.shuffledRights = [];
    this.displayChoices = [];

    switch (ex.type) {
      case 'word_order':
        this.initWordOrder(ex);
        break;
      case 'multiple_choice':
        this.displayChoices = ex.choices?.length
          ? this.shuffleArray([...ex.choices])
          : [ex.correctAnswer];
        break;
      case 'match_words':
        if (ex.matchPairs?.length) {
          for (const p of ex.matchPairs) {
            this.matchSelections[p.left] = '';
          }
          const rights = ex.matchPairs.map((p) => p.right);
          this.shuffledRights = this.shuffleArray([...new Set(rights)]);
        }
        break;
      default:
        break;
    }
  }

  private initWordOrder(ex: ExerciseDoc) {
    const bank =
      ex.wordBank?.length && ex.wordBank.length > 0
        ? [...ex.wordBank]
        : ex.correctAnswer
            .trim()
            .split(/\s+/)
            .filter(Boolean);
    this.availableWords = this.shuffleArray(bank);
    this.selectedWords = [];
  }

  private shuffleArray<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  normalize(s: string): string {
    return s.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  selectWord(word: string, index: number) {
    this.selectedWords.push(word);
    this.availableWords.splice(index, 1);
  }

  deselectWord(word: string, index: number) {
    this.availableWords.push(word);
    this.selectedWords.splice(index, 1);
  }

  canSubmit(): boolean {
    const ex = this.currentExercise;
    if (!ex) return false;
    switch (ex.type) {
      case 'word_order':
        return this.selectedWords.length > 0;
      case 'translate_text':
      case 'listen_and_write':
        return this.textAnswer.trim().length > 0;
      case 'multiple_choice':
        return this.selectedChoice !== null && this.selectedChoice !== '';
      case 'match_words':
        return !!ex.matchPairs?.every(
          (p) => (this.matchSelections[p.left] || '').length > 0,
        );
      default:
        return false;
    }
  }

  async checkAnswer() {
    const ex = this.currentExercise;
    if (!ex || !this.unitId) return;

    let ok = false;
    switch (ex.type) {
      case 'word_order':
        ok =
          this.normalize(this.selectedWords.join(' ')) ===
          this.normalize(ex.correctAnswer);
        break;
      case 'translate_text':
      case 'listen_and_write':
        ok =
          this.normalize(this.textAnswer) ===
          this.normalize(ex.correctAnswer);
        break;
      case 'multiple_choice':
        ok =
          this.selectedChoice !== null &&
          this.normalize(this.selectedChoice) ===
            this.normalize(ex.correctAnswer);
        break;
      case 'match_words':
        ok = !!ex.matchPairs?.every(
          (p) =>
            this.normalize(this.matchSelections[p.left] || '') ===
            this.normalize(p.right),
        );
        break;
      default:
        ok = false;
    }

    if (!ok) {
      alert('Inténtalo de nuevo.');
      return;
    }

    const xp = Number.isFinite(ex.xpReward) ? ex.xpReward : 0;
    const isLast = this.currentIndex >= this.exercises.length - 1;

    try {
      if (isLast) {
        const { streak } = await this.dataService.addXP(xp, {
          applyStreak: true,
        });
        this.xpEarnedThisLesson += xp;
        this.correctAnswersCount += 1;
        const { nextUnitUnlocked, nextUnitTitle } =
          await this.dataService.completeUnit(this.unitId);
        this.completionStreak = streak;
        this.nextUnitUnlocked = nextUnitUnlocked;
        this.nextUnitTitle = nextUnitTitle;
        this.lessonCompleted = true;
      } else {
        await this.dataService.addXP(xp, { applyStreak: false });
        this.xpEarnedThisLesson += xp;
        this.correctAnswersCount += 1;
        this.currentIndex++;
        const next = this.currentExercise;
        if (next) {
          this.prepareExerciseState(next);
        }
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
