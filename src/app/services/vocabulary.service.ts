import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  onSnapshot,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import type { VocabularyWord } from '../models/vocabulary.types';

@Injectable({ providedIn: 'root' })
export class VocabularyService {
  private firestore = inject(Firestore);

  getVocabularyWord(id: string): Observable<VocabularyWord | null> {
    return new Observable((observer) => onSnapshot(
      doc(this.firestore, 'vocabulary', id),
      (snapshot) => observer.next(
        snapshot.exists() ? this.mapWord(snapshot.id, snapshot.data()) : null,
      ),
      (error) => observer.error(error),
    ));
  }

  getVocabularyByIds(ids: string[]): Observable<VocabularyWord[]> {
    return this.watchWords(ids);
  }

  getVocabularyForUnit(unitId: string): Observable<VocabularyWord[]> {
    return new Observable((observer) => {
      let wordUnsubscribes: (() => void)[] = [];
      const unitUnsubscribe = onSnapshot(
        doc(this.firestore, 'units', unitId),
        (unitSnapshot) => {
          wordUnsubscribes.forEach((unsubscribe) => unsubscribe());
          wordUnsubscribes = [];
          if (!unitSnapshot.exists()) {
            observer.next([]);
            return;
          }
          const data = unitSnapshot.data() as { vocabularyIds?: unknown };
          const ids = Array.isArray(data.vocabularyIds)
            ? data.vocabularyIds.filter((id): id is string => typeof id === 'string')
            : [];
          const words = new Map<string, VocabularyWord>();
          const emit = () => observer.next(ids
            .map((id) => words.get(id))
            .filter((word): word is VocabularyWord => word !== undefined));
          if (!ids.length) {
            emit();
            return;
          }
          ids.forEach((id) => {
            const unsubscribe = onSnapshot(
              doc(this.firestore, 'vocabulary', id),
              (wordSnapshot) => {
                if (wordSnapshot.exists()) {
                  const word = this.mapWord(wordSnapshot.id, wordSnapshot.data());
                  if (word.status === 'published') words.set(id, word);
                  else words.delete(id);
                } else {
                  words.delete(id);
                  console.warn(`Vocabulario no encontrado: ${id}`);
                }
                emit();
              },
              (error) => console.error(`Error leyendo vocabulario ${id}:`, error),
            );
            wordUnsubscribes.push(unsubscribe);
          });
        },
        (error) => observer.error(error),
      );
      return () => {
        unitUnsubscribe();
        wordUnsubscribes.forEach((unsubscribe) => unsubscribe());
      };
    });
  }

  getVocabulary(): Observable<VocabularyWord[]> {
    return new Observable((observer) => onSnapshot(
      collection(this.firestore, 'vocabulary'),
      (snapshot) => observer.next(snapshot.docs
        .map((item) => this.mapWord(item.id, item.data()))
        .filter((word) => word.status === 'published')),
      (error) => observer.error(error),
    ));
  }

  private watchWords(ids: string[]): Observable<VocabularyWord[]> {
    return new Observable((observer) => {
      const uniqueIds = [...new Set(ids.filter(Boolean))];
      const words = new Map<string, VocabularyWord>();
      const emit = () => observer.next(uniqueIds
        .map((id) => words.get(id))
        .filter((word): word is VocabularyWord => word !== undefined));
      const unsubscribes = uniqueIds.map((id) => onSnapshot(
        doc(this.firestore, 'vocabulary', id),
        (snapshot) => {
          if (!snapshot.exists()) {
            words.delete(id);
            console.warn(`Vocabulario no encontrado: ${id}`);
          } else {
            const word = this.mapWord(snapshot.id, snapshot.data());
            if (word.status === 'published') words.set(id, word);
            else words.delete(id);
          }
          emit();
        },
        (error) => console.error(`Error leyendo vocabulario ${id}:`, error),
      ));
      return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
    });
  }

  private mapWord(id: string, data: Record<string, unknown>): VocabularyWord {
    const textOrNull = (value: unknown): string | null =>
      typeof value === 'string' && value.trim() ? value : null;

    return {
      id,
      category: textOrNull(data['category']),
      sourceText: String(data['sourceText'] ?? ''),
      targetText: String(data['targetText'] ?? ''),
      partOfSpeech: textOrNull(data['partOfSpeech']),
      imageUrl: textOrNull(data['imageUrl']),
      audioUrl: textOrNull(data['audioUrl']),
      imageStoragePath: textOrNull(data['imageStoragePath']),
      audioStoragePath: textOrNull(data['audioStoragePath']),
      status: typeof data['status'] === 'string' ? data['status'] : 'draft',
      createdAt: data['createdAt'],
      updatedAt: data['updatedAt'],
    };
  }
}
