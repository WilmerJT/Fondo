export type VocabularyStatus = 'draft' | 'published' | 'archived' | string;

export interface VocabularyWord {
  id: string;
  category: string | null;
  sourceText: string;
  targetText: string;
  partOfSpeech: string | null;
  imageUrl: string | null;
  audioUrl: string | null;
  imageStoragePath?: string | null;
  audioStoragePath?: string | null;
  status: VocabularyStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
}
