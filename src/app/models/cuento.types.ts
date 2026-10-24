export type CuentoStatus = 'coming_soon' | 'available' | 'published';

export interface CuentoPage {
  id: string;
  order: number;
  imageUrl?: string | null;
  imageStoragePath?: string | null;
  kamentsaText: string;
  spanishText: string;
}

export interface CuentoDoc {
  id: string;
  title: string;
  description: string;
  icon: string;
  coverImageUrl?: string | null;
  coverImageStoragePath?: string | null;
  order: number;
  level: string;
  status: CuentoStatus;
  content?: string;
  readingTimeMinutes?: number;
  pages?: CuentoPage[];
}
