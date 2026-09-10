import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import type { VocabularyWord } from '../../models/vocabulary.types';
import { VocabularyService } from '../../services/vocabulary.service';

@Component({
  selector: 'app-vocabulary-flashcards',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './vocabulary-flashcards.component.html',
  styleUrl: './vocabulary-flashcards.component.css',
})
export class VocabularyFlashcardsComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private vocabularyService = inject(VocabularyService);
  private subscription?: Subscription;

  words: VocabularyWord[] = [];
  unitId = '';
  loading = true;
  error: string | null = null;
  currentIndex = 0;
  translationVisible = false;
  isPlaying = false;

  get currentWord(): VocabularyWord | null {
    return this.words[this.currentIndex] ?? null;
  }

  get progressLabel(): string {
    return this.words.length ? `${this.currentIndex + 1} / ${this.words.length}` : '0 / 0';
  }

  ngOnInit(): void {
    this.unitId = this.route.snapshot.paramMap.get('unitId') ?? '';
    if (!this.unitId) {
      this.loading = false;
      this.error = 'Unidad no válida.';
      return;
    }

    this.subscription = this.vocabularyService.getVocabularyForUnit(this.unitId).subscribe({
      next: (words) => {
        this.words = words;
        this.currentIndex = 0;
        this.translationVisible = false;
        this.loading = false;
      },
      error: (error: unknown) => {
        console.error('Error cargando vocabulario:', error);
        this.error = 'No se pudo cargar el vocabulario.';
        this.loading = false;
      },
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  showTranslation(): void {
    this.translationVisible = true;
  }

  previous(): void {
    if (this.currentIndex === 0) return;
    this.currentIndex -= 1;
    this.translationVisible = false;
  }

  next(): void {
    if (this.currentIndex >= this.words.length - 1) return;
    this.currentIndex += 1;
    this.translationVisible = false;
  }

  playAudio(): void {
    const audioUrl = this.currentWord?.audioUrl;
    if (!audioUrl || this.isPlaying) return;

    this.isPlaying = true;
    const audio = new Audio(audioUrl);
    audio.onended = () => { this.isPlaying = false; };
    audio.onerror = () => { this.isPlaying = false; };
    audio.play().catch(() => { this.isPlaying = false; });
  }
}
