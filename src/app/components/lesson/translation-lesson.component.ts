import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
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
  selector: 'app-translation-lesson',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './translation-lesson.component.html',
  styleUrl: './translation-lesson.component.css',
})
export class TranslationLessonComponent implements OnInit {
  @Input() exercise: ExerciseDoc | null = null;
  @Input() exerciseIndex = 0;
  @Input() totalExercises = 0;

  @Output() answerSubmitted = new EventEmitter<ExerciseResult>();

  // Estado del ejercicio actual
  textAnswer = '';
  isPlaying = false;

  ngOnInit() {
    this.resetState();
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
      case 'translate_text':
        return 'Traducción';
      case 'listen_and_write':
        return 'Escucha y escribe';
      default:
        return 'Ejercicio';
    }
  }

  private resetState() {
    this.textAnswer = '';
    this.isPlaying = false;
  }

  private normalize(s: string): string {
    return s.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  canSubmit(): boolean {
    return this.textAnswer.trim().length > 0;
  }

  playAudio() {
    if (!this.exercise?.audioUrl) return;

    this.isPlaying = true;
    const audio = new Audio(this.exercise.audioUrl);

    audio.play().catch((error) => {
      console.error('Error playing audio:', error);
      alert('No se pudo reproducir el audio.');
    });

    audio.onended = () => {
      this.isPlaying = false;
    };
  }

  checkAnswer() {
    const ex = this.exercise;
    if (!ex) return;

    let correct = false;

    switch (ex.type) {
      case 'translate_text':
      case 'listen_and_write':
        correct =
          this.normalize(this.textAnswer) ===
          this.normalize(ex.correctAnswer);
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
