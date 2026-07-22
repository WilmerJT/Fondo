import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  doc,
  onSnapshot,
  collection,
  query,
  orderBy,
  getDocs,
  getDoc,
  runTransaction,
  setDoc,
  writeBatch,
} from '@angular/fire/firestore';

import {
  Observable,
  combineLatest,
  from,
  map,
  of,
  shareReplay,
  switchMap,
} from 'rxjs';
import type { ExerciseDoc } from '../models/exercise.types';
import type { JuegoDoc, JuegoStatus, JuegoType } from '../models/juego.types';
import type { CuentoDoc, CuentoStatus } from '../models/cuento.types';
import type { UnitProgressStatus } from '../models/unit-progress.types';
import { normalizeExerciseFromFirestore } from '../models/exercise-from-firestore';
import { AuthService } from './auth.service';

export interface UnitWithProgress {
  id: string;
  title: string;
  icon?: string;
  description?: string;
  order: number;
  status: UnitProgressStatus;
}

@Injectable({ providedIn: 'root' })
export class DataService {
  private firestore = inject(Firestore);
  private auth = inject(AuthService);
  private userStats$: Observable<any>;

  constructor() {
    this.userStats$ = this.auth.user$.pipe(
      switchMap((user) => {
        if (!user) {
          return of(null);
        }
        const userDocRef = doc(this.firestore, 'users', user.uid);
        return new Observable<any>((observer) => {
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
        });
      }),
      shareReplay(1),
    );
  }

  getUserStats(): Observable<any> {
    return this.userStats$;
  }

  private requireUid(): string {
    const uid = this.auth.getCurrentUid();
    if (!uid) {
      throw new Error('NOT_AUTHENTICATED');
    }
    return uid;
  }

  private userDocRef() {
    return doc(this.firestore, 'users', this.requireUid());
  }

  private progressDocRef(uid: string, unitId: string) {
    return doc(this.firestore, 'users', uid, 'progress', unitId);
  }

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
    const userDocRef = this.userDocRef();

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

  /** Lista de unidades globales (solo contenido, sin `status` de progreso). */
  private async fetchGlobalUnitsList(): Promise<
    Omit<UnitWithProgress, 'status'>[]
  > {
    const unitsCol = collection(this.firestore, 'units');
    const q = query(unitsCol, orderBy('order', 'asc'));
    const snap = await getDocs(q);
    const units: Omit<UnitWithProgress, 'status'>[] = [];
    snap.forEach((d) => {
      const data = d.data() as Record<string, unknown>;
      const orderVal = data['order'];
      const order =
        typeof orderVal === 'number' ? orderVal : Number(orderVal) || 0;
      units.push({
        id: d.id,
        title: typeof data['title'] === 'string' ? data['title'] : '',
        icon: typeof data['icon'] === 'string' ? data['icon'] : undefined,
        description:
          typeof data['description'] === 'string'
            ? data['description']
            : undefined,
        order,
      });
    });
    units.sort((a, b) => a.order - b.order);
    return units;
  }

  /**
   * Crea `users/{uid}/progress/{unitId}` para cada unidad global.
   * Primera por `order` → `available`, resto → `locked`.
   */
  async initializeUserProgress(uid: string): Promise<void> {
    const progressCol = collection(this.firestore, 'users', uid, 'progress');
    const existing = await getDocs(progressCol);
    if (!existing.empty) {
      return;
    }

    const units = await this.fetchGlobalUnitsList();
    if (units.length === 0) {
      return;
    }

    const batch = writeBatch(this.firestore);
    const now = new Date().toISOString();

    units.forEach((unit, index) => {
      const status: UnitProgressStatus =
        index === 0 ? 'available' : 'locked';
      batch.set(doc(progressCol, unit.id), {
        status,
        updatedAt: now,
      });
    });

    await batch.commit();
  }

  private watchGlobalUnits(): Observable<Omit<UnitWithProgress, 'status'>[]> {
    return new Observable((observer) => {
      const unitsCol = collection(this.firestore, 'units');
      const q = query(unitsCol, orderBy('order', 'asc'));
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const units: Omit<UnitWithProgress, 'status'>[] = [];
          querySnapshot.forEach((docSnap) => {
            const data = docSnap.data() as Record<string, unknown>;
            const orderVal = data['order'];
            const order =
              typeof orderVal === 'number'
                ? orderVal
                : Number(orderVal) || 0;
            units.push({
              id: docSnap.id,
              title: typeof data['title'] === 'string' ? data['title'] : '',
              icon: typeof data['icon'] === 'string' ? data['icon'] : undefined,
              description:
                typeof data['description'] === 'string'
                  ? data['description']
                  : undefined,
              order,
            });
          });
          units.sort((a, b) => a.order - b.order);
          observer.next(units);
        },
        (error) => observer.error(error),
      );
      return { unsubscribe };
    });
  }

  private watchUserProgress(
    uid: string,
  ): Observable<Map<string, UnitProgressStatus>> {
    return new Observable((observer) => {
      const progressCol = collection(
        this.firestore,
        'users',
        uid,
        'progress',
      );
      const unsubscribe = onSnapshot(
        progressCol,
        (snap) => {
          const map = new Map<string, UnitProgressStatus>();
          snap.forEach((d) => {
            const data = d.data() as Record<string, unknown>;
            const s = data['status'];
            if (
              s === 'locked' ||
              s === 'available' ||
              s === 'completed'
            ) {
              map.set(d.id, s);
            }
          });
          observer.next(map);
        },
        (error) => observer.error(error),
      );
      return { unsubscribe };
    });
  }

  private mergeUnitsWithProgress(
    units: Omit<UnitWithProgress, 'status'>[],
    progress: Map<string, UnitProgressStatus>,
  ): UnitWithProgress[] {
    return units.map((unit) => ({
      ...unit,
      status: progress.get(unit.id) ?? 'locked',
    }));
  }

  /**
   * Unidades globales + estado por usuario en `users/{uid}/progress`.
   */
  getUnitsFromFirebase(): Observable<UnitWithProgress[]> {
    return this.auth.user$.pipe(
      switchMap((user) => {
        if (!user) {
          return of([]);
        }
        const uid = user.uid;
        return combineLatest([
          this.watchGlobalUnits(),
          this.watchUserProgress(uid),
        ]).pipe(
          switchMap(([units, progressMap]) => {
            if (units.length === 0) {
              return of([]);
            }
            if (progressMap.size === 0) {
              return from(this.initializeUserProgress(uid)).pipe(
                switchMap(() =>
                  of(
                    this.mergeUnitsWithProgress(
                      units,
                      new Map(
                        units.map((u, i) => [
                          u.id,
                          (i === 0 ? 'available' : 'locked') as UnitProgressStatus,
                        ]),
                      ),
                    ),
                  ),
                ),
              );
            }
            return of(this.mergeUnitsWithProgress(units, progressMap));
          }),
        );
      }),
    );
  }

  async completeUnit(unitId: string): Promise<{
    nextUnitUnlocked: boolean;
    nextUnitTitle: string | null;
  }> {
    const uid = this.requireUid();
    const now = new Date().toISOString();

    await setDoc(
      this.progressDocRef(uid, unitId),
      { status: 'completed', updatedAt: now },
      { merge: true },
    );

    const units = await this.fetchGlobalUnitsList();
    const current = units.find((u) => u.id === unitId);
    if (!current) {
      return { nextUnitUnlocked: false, nextUnitTitle: null };
    }

    const next = units
      .filter((u) => u.order > current.order)
      .sort((a, b) => a.order - b.order)[0];

    if (!next) {
      return { nextUnitUnlocked: false, nextUnitTitle: null };
    }

    const nextProgressRef = this.progressDocRef(uid, next.id);
    const nextSnap = await getDoc(nextProgressRef);
    const nextStatus = nextSnap.exists()
      ? (nextSnap.data() as { status?: string })?.status
      : 'locked';

    if (nextStatus === 'locked') {
      await setDoc(
        nextProgressRef,
        { status: 'available', updatedAt: now },
        { merge: true },
      );
      return {
        nextUnitUnlocked: true,
        nextUnitTitle: next.title || null,
      };
    }

    return { nextUnitUnlocked: false, nextUnitTitle: null };
  }

  async getUnitSummary(
    unitId: string,
  ): Promise<{ title: string } | null> {
    const ref = doc(this.firestore, 'units', unitId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data() as Record<string, unknown>;
    return { title: typeof data['title'] === 'string' ? data['title'] : '' };
  }

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

  getJuegosFromFirebase(): Observable<JuegoDoc[]> {
    return this.watchOrderedCollection('juegos', (id, data) =>
      this.mapJuegoDoc(id, data),
    ).pipe(map((juegos) => juegos.filter((juego) => this.isAllowedJuego(juego))));
  }

  getCuentosFromFirebase(): Observable<CuentoDoc[]> {
    return this.watchOrderedCollection('cuentos', (id, data) =>
      this.mapCuentoDoc(id, data),
    );
  }

  private watchOrderedCollection<T>(
    collectionName: string,
    mapper: (id: string, data: Record<string, unknown>) => T,
  ): Observable<T[]> {
    return new Observable((observer) => {
      const colRef = collection(this.firestore, collectionName);
      const q = query(colRef, orderBy('order', 'asc'));
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const items: T[] = [];
          querySnapshot.forEach((docSnap) => {
            items.push(
              mapper(docSnap.id, docSnap.data() as Record<string, unknown>),
            );
          });
          items.sort((a, b) => {
            const orderA = (a as { order?: number }).order ?? 0;
            const orderB = (b as { order?: number }).order ?? 0;
            return orderA - orderB;
          });
          observer.next(items);
        },
        (error) => observer.error(error),
      );
      return { unsubscribe };
    });
  }

  private isAllowedJuego(juego: Pick<JuegoDoc, 'id' | 'type'>): boolean {
    return ['paint', 'crossword', 'word_search', 'garden'].includes(juego.id) || ['paint', 'crossword', 'word_search', 'garden'].includes(juego.type);
  }

  private mapJuegoDoc(id: string, data: Record<string, unknown>): JuegoDoc {
    const orderVal = data['order'];
    const order =
      typeof orderVal === 'number' ? orderVal : Number(orderVal) || 0;
    const xpVal = data['xpReward'];
    const xpReward =
      xpVal === undefined
        ? undefined
        : typeof xpVal === 'number'
          ? xpVal
          : Number(xpVal) || 0;
    const statusRaw = data['status'];
    const status: JuegoStatus =
      statusRaw === 'available' ? 'available' : 'coming_soon';
    const typeRaw = data['type'];
    const type: JuegoType =
      typeRaw === 'paint' || typeRaw === 'crossword' || typeRaw === 'word_search' || typeRaw === 'garden'
        ? typeRaw
        : 'paint';
    const examplesRaw = data['examples'];
    const examples = Array.isArray(examplesRaw)
      ? examplesRaw.filter((example): example is string => typeof example === 'string')
      : [];

    return {
      id,
      title: typeof data['title'] === 'string' ? data['title'] : '',
      description:
        typeof data['description'] === 'string' ? data['description'] : '',
      icon: typeof data['icon'] === 'string' ? data['icon'] : '🎮',
      order,
      type,
      level: typeof data['level'] === 'string' ? data['level'] : '',
      status,
      xpReward,
      examples,
    };
  }

  private mapCuentoDoc(id: string, data: Record<string, unknown>): CuentoDoc {
    const orderVal = data['order'];
    const order =
      typeof orderVal === 'number' ? orderVal : Number(orderVal) || 0;
    const minutesVal = data['readingTimeMinutes'];
    const readingTimeMinutes =
      minutesVal === undefined
        ? undefined
        : typeof minutesVal === 'number'
          ? minutesVal
          : Number(minutesVal) || 0;
    const statusRaw = data['status'];
    const status: CuentoStatus =
      statusRaw === 'available' ? 'available' : 'coming_soon';

    return {
      id,
      title: typeof data['title'] === 'string' ? data['title'] : '',
      description:
        typeof data['description'] === 'string' ? data['description'] : '',
      icon: typeof data['icon'] === 'string' ? data['icon'] : '📖',
      order,
      level: typeof data['level'] === 'string' ? data['level'] : '',
      status,
      content: typeof data['content'] === 'string' ? data['content'] : undefined,
      readingTimeMinutes,
    };
  }
}
