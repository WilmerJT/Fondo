import type { ExerciseDoc, ExerciseType, MatchPair } from './exercise.types';

function coerceNumber(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && !Number.isNaN(v)) {
    return v;
  }
  if (typeof v === 'string') {
    const t = v.trim();
    if (t === '') return fallback;
    const n = Number(t);
    return Number.isNaN(n) ? fallback : n;
  }
  return fallback;
}

/** Acepta array, string JSON tipo `["a","b"]`, o lista separada por comas. */
function coerceStringArray(v: unknown): string[] | undefined {
  if (v == null) return undefined;
  if (Array.isArray(v)) {
    const out = v.map((x) => String(x).trim()).filter(Boolean);
    return out.length ? out : undefined;
  }
  if (typeof v === 'string') {
    const t = v.trim();
    if (!t) return undefined;
    if (t.startsWith('[')) {
      try {
        const parsed = JSON.parse(t) as unknown;
        if (Array.isArray(parsed)) {
          const out = parsed.map((x) => String(x).trim()).filter(Boolean);
          return out.length ? out : undefined;
        }
      } catch {
        return undefined;
      }
    }
    return t.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return undefined;
}

function coerceMatchPairs(v: unknown): MatchPair[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out: MatchPair[] = [];
  for (const row of v) {
    if (row && typeof row === 'object' && 'left' in row && 'right' in row) {
      const o = row as Record<string, unknown>;
      out.push({ left: String(o['left']), right: String(o['right']) });
    }
  }
  return out.length ? out : undefined;
}

const EXERCISE_TYPES: ExerciseType[] = [
  'word_order',
  'translate_text',
  'multiple_choice',
  'match_words',
  'listen_and_write',
];

function coerceExerciseType(v: unknown): ExerciseType {
  const s = String(v ?? '').trim();
  return EXERCISE_TYPES.includes(s as ExerciseType)
    ? (s as ExerciseType)
    : 'translate_text';
}

/**
 * Convierte el payload crudo de Firestore al shape que usa la app
 * (números como string, `words` vs `wordBank`, etc.).
 */
export function normalizeExerciseFromFirestore(
  id: string,
  data: Record<string, unknown>,
): ExerciseDoc {
  const wordBankFrom = coerceStringArray(data['wordBank']);
  const wordsFrom = coerceStringArray(data['words']);
  const wordBank =
    wordBankFrom?.length && wordBankFrom.length > 0
      ? wordBankFrom
      : wordsFrom?.length
        ? wordsFrom
        : undefined;

  return {
    id,
    type: coerceExerciseType(data['type']),
    question: String(data['question'] ?? ''),
    correctAnswer: String(data['correctAnswer'] ?? ''),
    order: coerceNumber(data['order'], 0),
    xpReward: coerceNumber(data['xpReward'], 0),
    difficulty:
      data['difficulty'] != null ? String(data['difficulty']) : undefined,
    languageFrom:
      data['languageFrom'] != null ? String(data['languageFrom']) : undefined,
    languageTo:
      data['languageTo'] != null ? String(data['languageTo']) : undefined,
    status: data['status'] != null ? String(data['status']) : undefined,
    wordBank,
    choices: coerceStringArray(data['choices']),
    matchPairs: coerceMatchPairs(data['matchPairs']),
    audioUrl: data['audioUrl'] != null ? String(data['audioUrl']) : undefined,
  };
}
