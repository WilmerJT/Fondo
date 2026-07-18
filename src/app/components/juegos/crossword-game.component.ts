import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface CrosswordCell {
  row: number;
  col: number;
  letter: string;
  isBlack: boolean;
  clueNumber?: number;
}

interface CrosswordEntry {
  id: string;
  clue: string;
  answer: string;
  row: number;
  col: number;
  direction: 'across' | 'down';
}

@Component({
  selector: 'app-crossword-game',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="game-play-card">
      <h3>🧩 Crucigrama</h3>
      <p>Completa las palabras usando las pistas de abajo.</p>

      <div class="crossword-grid">
        <div class="cell" *ngFor="let cell of cells" [class.black]="cell.isBlack" [class.number]="cell.clueNumber">
          <span *ngIf="cell.clueNumber" class="cell-number">{{ cell.clueNumber }}</span>
          <input
            *ngIf="!cell.isBlack"
            type="text"
            maxlength="1"
            [value]="answers[cell.row][cell.col]"
            (input)="onInput(cell.row, cell.col, $any($event.target).value)"
            autocomplete="off"
          />
        </div>
      </div>

      <div class="clues">
        <div class="clue-section">
          <h4>Horizontales</h4>
          <ul>
            <li *ngFor="let entry of acrossEntries">
              <strong>{{ entry.id }}</strong> {{ entry.clue }}
            </li>
          </ul>
        </div>
        <div class="clue-section">
          <h4>Verticales</h4>
          <ul>
            <li *ngFor="let entry of downEntries">
              <strong>{{ entry.id }}</strong> {{ entry.clue }}
            </li>
          </ul>
        </div>
      </div>

      <button type="button" class="next-btn" (click)="checkAnswers()">Comprobar</button>
      <p class="feedback" [class.success]="isCorrect" [class.error]="showError">{{ feedbackMessage }}</p>
    </section>
  `,
  styles: [
    `:host { display: block; }`,
    `.game-play-card { background: white; border-radius: 16px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }`,
    `.crossword-grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 4px; margin: 16px 0; }`,
    `.cell { position: relative; width: 100%; aspect-ratio: 1; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; }`,
    `.cell.black { background: #0f172a; border-color: #0f172a; }`,
    `.cell.number { border: 1px solid #94a3b8; }`,
    `.cell input { width: 100%; height: 100%; text-align: center; border: none; background: transparent; font-weight: 700; text-transform: uppercase; }`,
    `.cell-number { position: absolute; top: 2px; left: 4px; font-size: 10px; color: #475569; }`,
    `.clues { display: grid; gap: 12px; margin: 16px 0; }`,
    `.clue-section { background: #f8fafc; border-radius: 12px; padding: 12px; }`,
    `.next-btn { margin-top: 12px; padding: 10px 14px; border: none; border-radius: 10px; background: #2563eb; color: white; cursor: pointer; }`,
    `.feedback { min-height: 24px; margin-top: 12px; font-weight: 600; }`,
    `.success { color: #15803d; }`,
    `.error { color: #dc2626; }`
  ],
})
export class CrosswordGameComponent implements OnInit {
  @Input() examples: string[] = [];
  cells: CrosswordCell[] = [];
  answers: string[][] = [];
  acrossEntries: CrosswordEntry[] = [];
  downEntries: CrosswordEntry[] = [];
  feedbackMessage = 'Completa las pistas.';
  isCorrect = false;
  showError = false;

  ngOnInit(): void {
    this.buildPuzzle();
  }

  onInput(row: number, col: number, value: string): void {
    const letter = value.toLowerCase().replace(/[^a-z]/g, '').slice(0, 1);
    this.answers[row][col] = letter;
  }

  checkAnswers(): void {
    const allCorrect = [...this.acrossEntries, ...this.downEntries].every((entry) => {
      const letters = this.getWordLetters(entry);
      return letters.join('') === entry.answer.toLowerCase();
    });

    if (allCorrect) {
      this.isCorrect = true;
      this.showError = false;
      this.feedbackMessage = '¡Perfecto! Has completado el crucigrama.';
      return;
    }

    this.isCorrect = false;
    this.showError = true;
    this.feedbackMessage = 'Revisa las pistas y vuelve a intentarlo.';
  }

  private buildPuzzle(): void {
    const words = (this.examples.length ? this.examples : ['cat', 'sun', 'book']).map((word) => word.trim().toLowerCase());
    const size = 8;
    const grid = Array.from({ length: size }, () => Array(size).fill(''));
    const entries: CrosswordEntry[] = [];

    const baseWords = words.slice(0, 4);
    const firstWord = baseWords[0];
    const secondWord = baseWords[1];
    const thirdWord = baseWords[2];
    const fourthWord = baseWords[3] || 'home';

    const across = [
      { id: '1', clue: 'Animal doméstico', answer: firstWord, row: 1, col: 1, direction: 'across' as const },
      { id: '2', clue: 'Astro del día', answer: secondWord, row: 3, col: 1, direction: 'across' as const },
    ];

    const down = [
      { id: '3', clue: 'Objeto para leer', answer: thirdWord, row: 1, col: 2, direction: 'down' as const },
      { id: '4', clue: 'Lugar donde vives', answer: fourthWord, row: 1, col: 5, direction: 'down' as const },
    ];

    const allEntries = [...across, ...down];
    allEntries.forEach((entry) => {
      for (let index = 0; index < entry.answer.length; index += 1) {
        const row = entry.direction === 'across' ? entry.row : entry.row + index;
        const col = entry.direction === 'across' ? entry.col + index : entry.col;
        grid[row][col] = entry.answer[index];
      }
    });

    this.cells = [];
    this.answers = Array.from({ length: size }, () => Array(size).fill(''));

    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        const isBlack = !grid[row][col];
        const clueNumber = this.getClueNumber(row, col, allEntries);
        this.cells.push({ row, col, letter: grid[row][col], isBlack, clueNumber });
      }
    }

    this.acrossEntries = across;
    this.downEntries = down;
    this.feedbackMessage = 'Completa las pistas.';
    this.isCorrect = false;
    this.showError = false;
  }

  private getClueNumber(row: number, col: number, entries: CrosswordEntry[]): number | undefined {
    return entries.find((entry) => {
      if (entry.direction === 'across') {
        return entry.row === row && entry.col === col;
      }
      return entry.row === row && entry.col === col;
    })?.id ? Number(entries.find((entry) => entry.row === row && entry.col === col)?.id) : undefined;
  }

  private getWordLetters(entry: CrosswordEntry): string[] {
    const letters: string[] = [];
    for (let index = 0; index < entry.answer.length; index += 1) {
      const row = entry.direction === 'across' ? entry.row : entry.row + index;
      const col = entry.direction === 'across' ? entry.col + index : entry.col;
      letters.push(this.answers[row][col] || '');
    }
    return letters;
  }
}
