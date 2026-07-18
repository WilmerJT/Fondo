import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface WordSearchCell {
  row: number;
  col: number;
  letter: string;
}

export interface WordSearchPlacement {
  word: string;
  positions: WordSearchCell[];
}

export interface WordSearchBoardResult {
  board: string[][];
  placements: WordSearchPlacement[];
}

export function buildWordSearchBoard(words: string[]): WordSearchBoardResult {
  const normalizedWords = [...new Set(words.map((word) => word.trim().toLowerCase().replace(/[^a-z]/g, '')).filter(Boolean))].slice(0, 6);
  const size = 8;
  const board = Array.from({ length: size }, () => Array(size).fill(''));
  const placements: WordSearchPlacement[] = [];
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];

  for (const word of normalizedWords) {
    let placed = false;

    for (let attempt = 0; attempt < 250 && !placed; attempt += 1) {
      const direction = directions[Math.floor(Math.random() * directions.length)];
      const row = Math.floor(Math.random() * size);
      const col = Math.floor(Math.random() * size);
      const positions: WordSearchCell[] = [];
      let fits = true;

      for (let index = 0; index < word.length; index += 1) {
        const nextRow = row + direction[0] * index;
        const nextCol = col + direction[1] * index;

        if (nextRow < 0 || nextRow >= size || nextCol < 0 || nextCol >= size) {
          fits = false;
          break;
        }

        const existing = board[nextRow][nextCol];
        if (existing && existing !== word[index]) {
          fits = false;
          break;
        }

        positions.push({ row: nextRow, col: nextCol, letter: word[index] });
      }

      if (!fits) {
        continue;
      }

      positions.forEach((position) => {
        board[position.row][position.col] = position.letter;
      });
      placements.push({ word, positions });
      placed = true;
    }
  }

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (!board[row][col]) {
        board[row][col] = alphabet[Math.floor(Math.random() * alphabet.length)];
      }
    }
  }

  return { board, placements };
}

function extractWordsFromHtml(html: string): string[] {
  const match = html.match(/"words"\s*:\s*\[(.*?)\]/s);
  if (!match) {
    return [];
  }

  return Array.from(match[1].matchAll(/"([^"]+)"/g), (entry) => entry[1]);
}

@Component({
  selector: 'app-word-search-game',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="game-play-card">
      <h3>🔍 Sopa de letras</h3>
      <p>Selecciona las letras en orden para encontrar las palabras ocultas.</p>

      <div class="grid">
        <button
          type="button"
          *ngFor="let cell of boardFlat"
          class="letter"
          [class.found]="isCellFound(cell.row, cell.col)"
          [class.selected]="isCellSelected(cell.row, cell.col)"
          (click)="toggleCell(cell.row, cell.col)"
        >
          {{ cell.letter }}
        </button>
      </div>

      <div class="words-list">
        <h4>Palabras</h4>
        <ul>
          <li *ngFor="let placement of placements" [class.found-word]="isWordFound(placement.word)">
            {{ placement.word }}
          </li>
        </ul>
      </div>

      <div class="actions">
        <button type="button" class="next-btn" (click)="checkSelection()">Comprobar</button>
        <button type="button" class="secondary-btn" (click)="resetSelection()">Reiniciar</button>
      </div>

      <p class="feedback" [class.success]="isCorrect" [class.error]="showError">{{ feedbackMessage }}</p>
    </section>
  `,
  styles: [
    `:host { display: block; }`,
    `.game-play-card { background: white; border-radius: 16px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }`,
    `.grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 8px; margin: 16px 0; }`,
    `.letter { padding: 10px; text-align: center; background: #e2e8f0; border: 1px solid #cbd5e1; border-radius: 10px; font-weight: 700; text-transform: uppercase; cursor: pointer; }`,
    `.letter.selected { background: #2563eb; color: white; }`,
    `.letter.found { background: #16a34a; color: white; }`,
    `.words-list { margin: 16px 0; }`,
    `.words-list ul { padding-left: 20px; margin: 8px 0 0; }`,
    `.found-word { color: #15803d; font-weight: 700; }`,
    `.actions { display: flex; gap: 10px; flex-wrap: wrap; }`,
    `.next-btn { padding: 10px 14px; border: none; border-radius: 10px; background: #2563eb; color: white; cursor: pointer; }`,
    `.secondary-btn { padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 10px; background: #f8fafc; cursor: pointer; }`,
    `.feedback { min-height: 24px; margin-top: 12px; font-weight: 600; }`,
    `.success { color: #15803d; }`,
    `.error { color: #dc2626; }`
  ],
})
export class WordSearchGameComponent implements OnInit {
  @Input() examples: string[] = [];
  board: string[][] = [];
  placements: WordSearchPlacement[] = [];
  boardFlat: WordSearchCell[] = [];
  selectedCells: WordSearchCell[] = [];
  foundWords = new Set<string>();
  foundCells = new Set<string>();
  feedbackMessage = 'Selecciona una palabra.';
  isCorrect = false;
  showError = false;

  ngOnInit(): void {
    this.loadPuzzle();
  }

  async loadPuzzle(): Promise<void> {
    const fallbackWords = this.examples.length ? this.examples : ['apple', 'banana', 'carrot', 'water'];

    try {
      const response = await fetch('https://api.razzlepuzzles.com/wordsearch?locale=es', { mode: 'cors' });
      const html = await response.text();
      const extractedWords = extractWordsFromHtml(html);
      if (extractedWords.length) {
        this.setPuzzle(extractedWords);
        return;
      }
    } catch {
      // Se usa el fallback local si la API externa no está disponible.
    }

    this.setPuzzle(fallbackWords);
  }

  toggleCell(row: number, col: number): void {
    const key = `${row}-${col}`;
    if (this.foundCells.has(key)) {
      return;
    }

    const existingIndex = this.selectedCells.findIndex((cell) => cell.row === row && cell.col === col);
    if (existingIndex >= 0) {
      this.selectedCells = this.selectedCells.slice(0, existingIndex);
      return;
    }

    this.selectedCells = [...this.selectedCells, { row, col, letter: this.board[row][col] }];
  }

  checkSelection(): void {
    if (this.selectedCells.length < 2) {
      this.isCorrect = false;
      this.showError = true;
      this.feedbackMessage = 'Selecciona al menos dos letras.';
      return;
    }

    const selectedWord = this.selectedCells.map((cell) => cell.letter.toLowerCase()).join('');
    const placement = this.placements.find((candidate) => 
      candidate.word === selectedWord || candidate.word === selectedWord.split('').reverse().join('')
    );

    if (!placement) {
      this.isCorrect = false;
      this.showError = true;
      this.feedbackMessage = 'No es esa palabra, inténtalo otra vez.';
      this.selectedCells = [];
      return;
    }

    this.foundWords.add(placement.word);
    placement.positions.forEach((position) => {
      this.foundCells.add(`${position.row}-${position.col}`);
    });
    this.isCorrect = true;
    this.showError = false;
    this.feedbackMessage = `¡Encontraste ${placement.word}!`;
    this.selectedCells = [];
  }

  resetSelection(): void {
    this.selectedCells = [];
    this.feedbackMessage = 'Selecciona una palabra.';
    this.isCorrect = false;
    this.showError = false;
  }

  isCellFound(row: number, col: number): boolean {
    return this.foundCells.has(`${row}-${col}`);
  }

  isCellSelected(row: number, col: number): boolean {
    return this.selectedCells.some((cell) => cell.row === row && cell.col === col);
  }

  isWordFound(word: string): boolean {
    return this.foundWords.has(word);
  }

  private setPuzzle(words: string[]): void {
    const result = buildWordSearchBoard(words);
    this.board = result.board;
    this.placements = result.placements;
    this.boardFlat = this.board.flatMap((row, rowIndex) => row.map((letter, colIndex) => ({ row: rowIndex, col: colIndex, letter })));
    this.selectedCells = [];
    this.foundWords = new Set<string>();
    this.foundCells = new Set<string>();
    this.feedbackMessage = 'Selecciona una palabra.';
    this.isCorrect = false;
    this.showError = false;
  }
}
