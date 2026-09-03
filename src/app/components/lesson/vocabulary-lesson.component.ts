import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { ExerciseDoc } from '../../models/exercise.types';

export interface ExerciseResult {
  correct: boolean;
  xpEarned: number;
  exerciseId?: string;
}

@Component({
  selector: 'app-vocabulary-lesson',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vocabulary-lesson.component.html',
  styleUrl: './vocabulary-lesson.component.css',
})
export class VocabularyLessonComponent implements OnInit, OnChanges {
  @Input() exercise: ExerciseDoc | null = null;
  @Input() exerciseIndex = 0;
  @Input() totalExercises = 0;

  @Output() answerSubmitted = new EventEmitter<ExerciseResult>();

  // Estado del ejercicio actual
  availableWords: string[] = [];
  selectedWords: string[] = [];
  selectedChoice: string | null = null;
  matchSelections: Record<string, string> = {};
  shuffledRights: string[] = [];
  displayChoices: string[] = [];

  ngOnInit() {
    if (this.exercise) {
      this.prepareExerciseState(this.exercise);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['exercise'] && this.exercise) {
      this.prepareExerciseState(this.exercise);
    }
  }

  get progress(): number {
    if (!this.totalExercises) return 0;
    return ((this.exerciseIndex + 1) / this.totalExercises) * 100;
  }

  get exerciseTypeLabel(): string {
    return this.getExerciseTypeLabel(this.exercise?.type);
  }

  private getExerciseTypeLabel(type?: string): string {
    switch (type) {
      case 'word_order':
        return 'Ordenar palabras';
      case 'multiple_choice':
        return 'Opción múltiple';
      case 'match_words':
        return 'Emparejar palabras';
      default:
        return 'Ejercicio';
    }
  }

  private prepareExerciseState(ex: ExerciseDoc) {
    this.availableWords = [];
    this.selectedWords = [];
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

  private normalize(s: string): string {
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
    const ex = this.exercise;
    if (!ex) return false;

    switch (ex.type) {
      case 'word_order':
        return this.selectedWords.length > 0;
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

  checkAnswer() {
    const ex = this.exercise;
    if (!ex) return;

    let correct = false;

    switch (ex.type) {
      case 'word_order':
        correct =
          this.normalize(this.selectedWords.join(' ')) ===
          this.normalize(ex.correctAnswer);
        break;
      case 'multiple_choice':
        correct =
          this.selectedChoice !== null &&
          this.normalize(this.selectedChoice) ===
            this.normalize(ex.correctAnswer);
        break;
      case 'match_words':
        correct = !!ex.matchPairs?.every(
          (p) =>
            this.normalize(this.matchSelections[p.left] || '') ===
            this.normalize(p.right),
        );
        break;
      default:
        correct = false;
    }

    const xp = correct ? (Number.isFinite(ex.xpReward) ? ex.xpReward : 0) : 0;

    this.answerSubmitted.emit({
      correct,
      xpEarned: xp,
      exerciseId: ex.id,
    });
  }
}
