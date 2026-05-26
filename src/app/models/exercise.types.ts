/** Documento en `units/{unitId}/exercises/{exerciseId}` */
export type ExerciseType =
  | 'word_order'
  | 'translate_text'
  | 'multiple_choice'
  | 'match_words'
  | 'listen_and_write';

export interface MatchPair {
  left: string;
  right: string;
}

export interface ExerciseDoc {
  id: string;
  type: ExerciseType;
  question: string;
  correctAnswer: string;
  order: number;
  xpReward: number;
  difficulty?: string;
  languageFrom?: string;
  languageTo?: string;
  status?: string;
  /** Para `word_order`: palabras (sinónimo de `wordBank` en datos legacy). */
  words?: string[] | string;
  /** Para `word_order`: todas las palabras (correctas + distractores). */
  wordBank?: string[];
  /** Para `multiple_choice`: opciones incluyendo la correcta. */
  choices?: string[];
  /** Para `match_words`: pares izquierda/derecha. */
  matchPairs?: MatchPair[];
  /** Para `listen_and_write`: URL del audio (opcional). */
  audioUrl?: string;
}
