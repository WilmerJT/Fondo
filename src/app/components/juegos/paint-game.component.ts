import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface PaintImageOption {
  src: string;
  alt: string;
}

@Component({
  selector: 'app-paint-game',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="game-play-card">
      <h3>🎨 Colorear</h3>
      <p>Observa la imagen y elige el color que quieres usar para pintarla.</p>

      <div class="canvas">
        <div class="canvas-stage">
          <img class="paint-image" [src]="currentImage" [alt]="currentImageAlt" />
          <div class="paint-overlay" [style.backgroundColor]="paintColor" [style.opacity]="paintOpacity"></div>
        </div>
      </div>

      <div class="palette">
        <button
          type="button"
          *ngFor="let option of palette"
          class="color-btn"
          [style.backgroundColor]="option.color"
          (click)="selectColor(option.label)"
        >
          {{ option.label }}
        </button>
      </div>

      <div class="actions">
        <button type="button" class="secondary-btn" (click)="resetColors()">Restaurar</button>
        <button type="button" class="next-btn" (click)="nextExample()">Siguiente imagen</button>
      </div>

      <p class="feedback" [class.success]="isCorrect" [class.error]="showError">{{ feedbackMessage }}</p>
    </section>
  `,
  styles: [
    `:host { display: block; }`,
    `.game-play-card { background: white; border-radius: 16px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }`,
    `.prompt { font-size: 24px; font-weight: 700; text-align: center; margin: 16px 0; color: #0f172a; text-transform: capitalize; }`,
    `.canvas { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 16px; padding: 12px; margin: 16px 0; }`,
    `.canvas-stage { position: relative; width: min(100%, 360px); margin: 0 auto; }`,
    `.paint-image { width: 100%; display: block; border-radius: 12px; }`,
    `.paint-overlay { position: absolute; inset: 0; border-radius: 12px; mix-blend-mode: multiply; pointer-events: none; transition: opacity 0.2s ease; }`,
    `.palette { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 16px; }`,
    `.color-btn { border: none; border-radius: 12px; padding: 12px; color: white; font-weight: 700; cursor: pointer; }`,
    `.actions { display: flex; gap: 10px; margin-top: 12px; flex-wrap: wrap; }`,
    `.secondary-btn { padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 10px; background: #f8fafc; cursor: pointer; }`,
    `.next-btn { padding: 10px 14px; border: none; border-radius: 10px; background: #2563eb; color: white; cursor: pointer; }`,
    `.feedback { min-height: 24px; margin-top: 16px; font-weight: 600; }`,
    `.success { color: #15803d; }`,
    `.error { color: #dc2626; }`
  ],
})
export class PaintGameComponent implements OnInit {
  @Input() examples: string[] = [];

  palette = [
    { label: 'red', color: '#ef4444' },
    { label: 'blue', color: '#3b82f6' },
    { label: 'green', color: '#22c55e' },
    { label: 'yellow', color: '#eab308' },
    { label: 'orange', color: '#f59e0b' },
    { label: 'purple', color: '#8b5cf6' },
  ];

  currentImage = '/images/pintar/manzana_rojo.jpg';
  currentImageAlt = 'Manzana para colorear';
  paintColor = 'transparent';
  paintOpacity = 0;
  feedbackMessage = 'Elige un color y observa cómo se pinta la imagen.';
  isCorrect = false;
  showError = false;
  selectedColor = '';
  private currentIndex = 0;
  private readonly images: PaintImageOption[] = [
    { src: '/images/pintar/manzana_rojo.jpg', alt: 'Manzana para colorear' },
    { src: '/images/pintar/sol_amarillo.jpg', alt: 'Sol para colorear' },
  ];

  ngOnInit(): void {
    this.loadExample();
  }

  selectColor(label: string): void {
    this.selectedColor = label;
    this.paintColor = this.palette.find((option) => option.label === label)?.color || 'transparent';
    this.paintOpacity = 0.45;
    this.feedbackMessage = `Color seleccionado: ${label}`;
    this.isCorrect = true;
    this.showError = false;
  }

  resetColors(): void {
    this.paintColor = 'transparent';
    this.paintOpacity = 0;
    this.selectedColor = '';
    this.feedbackMessage = 'Elige un color y observa cómo se pinta la imagen.';
    this.isCorrect = false;
    this.showError = false;
  }

  nextExample(): void {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
    this.loadExample();
  }

  private loadExample(): void {
    const image = this.images[this.currentIndex];
    this.currentImage = image.src;
    this.currentImageAlt = image.alt;
    this.selectedColor = '';
    this.paintColor = 'transparent';
    this.paintOpacity = 0;
    this.feedbackMessage = 'Elige un color y observa cómo se pinta la imagen.';
    this.isCorrect = false;
    this.showError = false;
  }
}
