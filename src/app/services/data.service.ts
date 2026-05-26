import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  doc,
  onSnapshot,
  updateDoc,
  collection,
  query,
  orderBy,
  getDocs,
  getDoc,
  runTransaction,
} from '@angular/fire/firestore';

import { Observable, shareReplay } from 'rxjs';
import type { ExerciseDoc } from '../models/exercise.types';
import { normalizeExerciseFromFirestore } from '../models/exercise-from-firestore';

@Injectable({ providedIn: 'root' })
export class DataService {
  private firestore = inject(Firestore);
  private userStats$: Observable<any>;
  constructor() {
    const userDocRef = doc(this.firestore, 'users', 'usuario_prueba');
    this.userStats$ = new Observable((observer) => {
      // El onSnapshot se queda aquí, dentro del constructor (contexto seguro)
      const unsubscribe = onSnapshot(
        userDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            observer.next({ id: docSnap.id, ...docSnap.data() });
          } else {
            observer.next(null);
          }
        },
        (error) => observer.error(error),
      );
      return { unsubscribe };
    }).pipe(
      shareReplay(1),
      // Esto hace que múltiples componentes puedan escuchar sin crear más conexiones
    );
  }

  getUserStats(): Observable<any> {
    return this.userStats$;
  }

  /**
   * Suma XP y nivel en Firestore leyendo siempre el documento actual dentro de una
   * transacción (evita perder XP entre ejercicios cuando el snapshot en caché va retrasado).
   *
   * @param opts.applyStreak Por defecto `true`. En ejercicios intermedios usar `false`;
   * la racha solo debe aplicarse al cerrar la unidad.
   */
  async addXP(
    points: number,
    opts?: { applyStreak?: boolean },
  ): Promise<{
    streak: number;
    lastStreakDate: string;
    level: string;
    newXP: number;
  }> {
    const applyStreak = opts?.applyStreak ?? true;
    const userDocRef = doc(this.firestore, 'users', 'usuario_prueba');

    return runTransaction(this.firestore, async (transaction) => {
      const snap = await transaction.get(userDocRef);
      if (!snap.exists()) {
        throw new Error('USER_DOC_MISSING');
      }
      const data = snap.data() as Record<string, unknown>;
      const currentXp =
        typeof data['xp'] === 'number'
          ? data['xp']
          : Number(data['xp']) || 0;
      const newXP = currentXp + points;
      const newLevel = this.calculateLevel(newXP);

      if (applyStreak) {
        const streakVal =
          typeof data['streak'] === 'number'
            ? data['streak']
            : Number(data['streak']) || 0;
        const { streak, lastStreakDate } = this.computeNextStreak(
          streakVal,
          data['lastStreakDate'] as string | null | undefined,
        );
        transaction.update(userDocRef, {
          xp: newXP,
          level: newLevel,
          streak,
          lastStreakDate,
        });
        return { streak, lastStreakDate, level: newLevel, newXP };
      }

      transaction.update(userDocRef, {
        xp: newXP,
        level: newLevel,
      });
      const streak =
        typeof data['streak'] === 'number'
          ? data['streak']
          : Number(data['streak']) || 0;
      const lastStreakDate = (data['lastStreakDate'] as string) ?? '';
      return { streak, lastStreakDate, level: newLevel, newXP };
    });
  }

  private formatDateLocal(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private addDays(d: Date, days: number): Date {
    const next = new Date(d);
    next.setDate(next.getDate() + days);
    return next;
  }

  private computeNextStreak(
    currentStreak: number,
    lastStreakDate: string | null | undefined,
  ): { streak: number; lastStreakDate: string } {
    const today = this.formatDateLocal(new Date());
    if (lastStreakDate === today) {
      return {
        streak: Math.max(1, currentStreak || 0),
        lastStreakDate: today,
      };
    }
    const yesterday = this.formatDateLocal(this.addDays(new Date(), -1));
    if (lastStreakDate === yesterday) {
      return {
        streak: (currentStreak || 0) + 1,
        lastStreakDate: today,
      };
    }
    return { streak: 1, lastStreakDate: today };
  }

  private calculateLevel(xp: number): string {
    if (xp >= 3000) return 'Experto C1';
    if (xp >= 2000) return 'Avanzado B2';
    if (xp >= 1000) return 'Intermedio B1';
    if (xp >= 500) return 'Estudiante A2';
    return 'Principiante A1';
  }

  getUnitsFromFirebase(): Observable<any[]> {
    return new Observable((observer) => {
      try {
        const unitsCol = collection(this.firestore, 'units');
        const q = query(unitsCol, orderBy('order', 'asc'));
        // Usamos onSnapshot directamente sobre la query
        const unsubscribe = onSnapshot(
          q,
          (querySnapshot) => {
            const units: any[] = [];
            querySnapshot.forEach((docSnap) => {
              const data = docSnap.data() as Record<string, unknown>;
              const orderVal = data['order'];
              const order =
                typeof orderVal === 'number'
                  ? orderVal
                  : Number(orderVal) || 0;
              units.push({ id: docSnap.id, ...data, order });
            });
            units.sort((a, b) => a.order - b.order);
            observer.next(units);
          },
          (error) => {
            observer.error(error);
          },
        );
        return { unsubscribe };
      } catch (err) {
        observer.error(err);
        return;
      }
    });
  }

  /**
   * Marca la unidad como completada y desbloquea la siguiente por `order` si estaba `locked`.
   * Devuelve si se desbloqueó una nueva unidad y el título de esa unidad (para UI).
   */
  async completeUnit(unitId: string): Promise<{
    nextUnitUnlocked: boolean;
    nextUnitTitle: string | null;
  }> {
    const unitDocRef = doc(this.firestore, 'units', unitId);
    await updateDoc(unitDocRef, {
      status: 'completed',
    });

    const unitsCol = collection(this.firestore, 'units');
    const q = query(unitsCol, orderBy('order', 'asc'));
    const snap = await getDocs(q);
    const units: {
      id: string;
      order: number;
      status: string;
      title: string;
    }[] = [];
    snap.forEach((d) => {
      const data = d.data() as Record<string, unknown>;
      const orderVal = data['order'];
      const order =
        typeof orderVal === 'number' ? orderVal : Number(orderVal) || 0;
      units.push({
        id: d.id,
        order,
        status: typeof data['status'] === 'string' ? data['status'] : 'locked',
        title: typeof data['title'] === 'string' ? data['title'] : '',
      });
    });
    units.sort((a, b) => a.order - b.order);

    const current = units.find((u) => u.id === unitId);
    if (!current) {
      return { nextUnitUnlocked: false, nextUnitTitle: null };
    }

    const next = units
      .filter((u) => u.order > current.order)
      .sort((a, b) => a.order - b.order)[0];

    if (next && next.status === 'locked') {
      await updateDoc(doc(this.firestore, 'units', next.id), {
        status: 'available',
      });
      return {
        nextUnitUnlocked: true,
        nextUnitTitle: next.title || null,
      };
    }

    return { nextUnitUnlocked: false, nextUnitTitle: null };
  }

  /** Título (y datos mínimos) de una unidad para cabeceras sin suscribirse a la lista completa. */
  async getUnitSummary(
    unitId: string,
  ): Promise<{ title: string } | null> {
    const ref = doc(this.firestore, 'units', unitId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data() as Record<string, unknown>;
    return { title: typeof data['title'] === 'string' ? data['title'] : '' };
  }

  /** Subcolección `units/{unitId}/exercises`, ordenada por `order`. */
  getExercisesForUnit(unitId: string): Observable<ExerciseDoc[]> {
    return new Observable((observer) => {
      try {
        const exercisesCol = collection(
          this.firestore,
          'units',
          unitId,
          'exercises',
        );
        const q = query(exercisesCol, orderBy('order', 'asc'));
        const unsubscribe = onSnapshot(
          q,
          (querySnapshot) => {
            const list: ExerciseDoc[] = [];
            querySnapshot.forEach((d) => {
              list.push(
                normalizeExerciseFromFirestore(
                  d.id,
                  d.data() as Record<string, unknown>,
                ),
              );
            });
            list.sort((a, b) => a.order - b.order);
            observer.next(list);
          },
          (error) => observer.error(error),
        );
        return { unsubscribe };
      } catch (err) {
        observer.error(err);
        return;
      }
    });
  }
}
