export type CuentoStatus = 'coming_soon' | 'available';

export interface CuentoDoc {
  id: string;
  title: string;
  description: string;
  icon: string;
  order: number;
  level: string;
  status: CuentoStatus;
  content?: string;
  readingTimeMinutes?: number;
}
