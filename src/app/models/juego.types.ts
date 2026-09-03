export type JuegoStatus = 'coming_soon' | 'available';
export type JuegoType = 'paint' | 'crossword' | 'word_search' | 'garden';

export interface JuegoDoc {
  id: string;
  title: string;
  description: string;
  icon: string;
  order: number;
  type: JuegoType;
  level: string;
  status: JuegoStatus;
  xpReward?: number;
  examples?: string[];
  /** IDs del catálogo compartido en `vocabulary/{wordId}`. */
  vocabularyIds?: string[];
}
