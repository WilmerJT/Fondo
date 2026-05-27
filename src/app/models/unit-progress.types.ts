/** Estado del camino por usuario en `users/{uid}/progress/{unitId}` */
export type UnitProgressStatus = 'locked' | 'available' | 'completed';

export interface UnitProgressDoc {
  status: UnitProgressStatus;
  updatedAt?: string;
}
