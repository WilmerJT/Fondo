import { Component, HostListener, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface GardenPlant {
  id: number;
  name: string;
  stage: number;
  watered: boolean;
  cleaned: boolean;
  image: string;
  positionX: number;
  positionY: number;
}

@Component({
  selector: 'app-garden-game',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="game-play-card">
      <h3>🌱 Cuida tu huerto</h3>
      <p>Riega, limpia y cuida tus plantas para que crezcan sanas.</p>

      <div class="garden-background" [style.backgroundImage]="'url(/images/huerta/fondos/fondo_huerta.png)'">
        <div class="garden-view">
          <div class="garden-top">
            <div class="status-card">
              <span class="label">Progreso del huerto</span>
              <strong>{{ progress }}%</strong>
              <div class="bar"><div class="bar-fill" [style.width.%]="progress"></div></div>
            </div>
          </div>

          <div class="garden-ground">
            <div
              *ngFor="let plant of plants"
              class="plant-card"
              [class.expanded]="isPlantExpanded(plant.id)"
              [class.dragging]="draggingPlantId === plant.id"
              [style.left.%]="plant.positionX"
              [style.top.%]="plant.positionY"
            >
              <div class="plant-visual" (pointerdown)="startDrag($event, plant.id)" (click)="togglePlantDetails($event, plant.id)">
                <img class="plant-image" [src]="plant.image" [alt]="plant.name" />
              </div>
              <div class="plant-details">
                <div class="plant-meta">
                  <span class="plant-stage">{{ plant.stage }}/3</span>
                  <h4>{{ plant.name }}</h4>
                  <p>{{ plantStatusText(plant) }}</p>
                </div>
                <div class="plant-actions">
                  <button type="button" class="action-btn" (click)="waterPlant(plant.id); $event.stopPropagation()">💧 Regar</button>
                  <button type="button" class="action-btn" (click)="cleanPlant(plant.id); $event.stopPropagation()">🧹 Limpiar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p class="feedback" [class.success]="isHealthy" [class.error]="showWarning">{{ feedbackMessage }}</p>
    </section>
  `,
  styles: [
    `:host { display: block; }`,
    `.game-play-card { background: white; border-radius: 20px; padding: 20px; box-shadow: 0 4px 16px rgba(15,23,42,0.08); }`,
    `.garden-background { border-radius: 18px; padding: 16px; background-size: cover; background-position: center; min-height: 520px; display: flex; align-items: stretch; }`,
    `.garden-view { display: grid; gap: 16px; width: 100%; min-height: 100%; align-content: start; }`,
    `.garden-top { display: flex; justify-content: center; }`,
    `.status-card { background: linear-gradient(135deg, rgba(254, 252, 232, 0.96) 0%, rgba(220, 252, 231, 0.96) 100%); border-radius: 14px; padding: 12px 14px; width: 100%; max-width: 320px; box-shadow: 0 6px 18px rgba(15, 23, 42, 0.12); }`,
    `.label { display: block; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; }`,
    `.bar { width: 100%; height: 10px; background: #e2e8f0; border-radius: 999px; overflow: hidden; margin-top: 8px; }`,
    `.bar-fill { height: 100%; background: linear-gradient(90deg, #22c55e, #16a34a); }`,
    `.garden-ground { position: relative; min-height: 360px; margin-top: auto; padding-top: 8px; overflow: hidden; }`,
    `.plant-card { position: absolute; width: min(168px, 42vw); background: transparent; border: none; border-radius: 16px; padding: 12px; display: flex; flex-direction: column; justify-content: space-between; min-height: 250px; box-shadow: none; transform: translate(-50%, -50%); z-index: 2; transition: transform 0.2s ease; }`,
    `.plant-card.expanded, .plant-card.dragging { background: linear-gradient(135deg, rgba(248, 250, 252, 0.95) 0%, rgba(238, 253, 243, 0.95) 100%); border: 1px solid rgba(209, 250, 229, 0.95); box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08); }`,
    `.plant-visual { display: flex; justify-content: center; align-items: center; cursor: grab; }`,
    `.plant-card.dragging .plant-visual { cursor: grabbing; }`,
    `.plant-image { width: 100%; max-width: 110px; border-radius: 14px; transition: transform 0.2s ease, filter 0.2s ease; display: block; }`,
    `.plant-card:hover .plant-image, .plant-card.expanded .plant-image { transform: scale(1.03); }`,
    `.plant-details { display: grid; gap: 8px; max-height: 0; opacity: 0; overflow: hidden; pointer-events: none; transition: max-height 0.2s ease, opacity 0.2s ease; }`,
    `.plant-card.expanded .plant-details { max-height: 220px; opacity: 1; pointer-events: auto; }`,
    `.plant-meta { text-align: center; margin-top: 4px; }`,
    `.plant-stage { display: inline-block; font-size: 12px; font-weight: 700; color: #64748b; margin-bottom: 4px; }`,
    `.plant-meta h4 { margin: 0 0 4px; font-size: 15px; color: #14532d; }`,
    `.plant-meta p { margin: 0; font-size: 13px; color: #475569; min-height: 42px; }`,
    `.plant-actions { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }`,
    `.action-btn { flex: 1 1 calc(50% - 4px); padding: 8px 10px; border: none; border-radius: 10px; background: #16a34a; color: white; cursor: pointer; font-weight: 600; }`,
    `.feedback { min-height: 24px; margin-top: 12px; font-weight: 600; }`,
    `.success { color: #15803d; }`,
    `.error { color: #dc2626; }`
  ],
})
export class GardenGameComponent implements OnInit {
  @Input() examples: string[] = [];
  plants: GardenPlant[] = [];
  feedbackMessage = 'Cuida las plantas para que crezcan.';
  isHealthy = false;
  showWarning = false;
  expandedPlantId: number | null = null;
  draggingPlantId: number | null = null;
  private dragMoved = false;

  ngOnInit(): void {
    this.loadGarden();
  }

  isPlantExpanded(plantId: number): boolean {
    return this.expandedPlantId === plantId;
  }

  togglePlantDetails(event: MouseEvent, plantId: number): void {
    event.stopPropagation();
    if (this.draggingPlantId) {
      return;
    }

    this.expandedPlantId = this.expandedPlantId === plantId ? null : plantId;
  }

  startDrag(event: PointerEvent, plantId: number): void {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.dragMoved = false;
    this.draggingPlantId = plantId;
    this.expandedPlantId = plantId;
  }

  @HostListener('document:pointermove', ['$event'])
  onDocumentPointerMove(event: PointerEvent): void {
    if (!this.draggingPlantId) {
      return;
    }

    const gardenElement = document.querySelector('.garden-ground') as HTMLElement | null;
    if (!gardenElement) {
      return;
    }

    const rect = gardenElement.getBoundingClientRect();
    const nextX = ((event.clientX - rect.left) / rect.width) * 100;
    const nextY = ((event.clientY - rect.top) / rect.height) * 100;
    const clampedX = this.clamp(nextX, 12, 88);
    const clampedY = this.clamp(nextY, 18, 84);

    const plant = this.plants.find((item) => item.id === this.draggingPlantId);
    if (!plant) {
      return;
    }

    if (Math.abs(clampedX - plant.positionX) > 1 || Math.abs(clampedY - plant.positionY) > 1) {
      this.dragMoved = true;
    }

    if (this.canPlacePlant(clampedX, clampedY, plant.id)) {
      plant.positionX = clampedX;
      plant.positionY = clampedY;
    }
  }

  @HostListener('document:pointerup', ['$event'])
  onDocumentPointerUp(event: PointerEvent): void {
    if (!this.draggingPlantId) {
      return;
    }

    event.stopPropagation();
    this.draggingPlantId = null;
    this.dragMoved = false;
  }

  waterPlant(plantId: number): void {
    const plant = this.plants.find((item) => item.id === plantId);
    if (!plant) {
      return;
    }

    plant.watered = true;
    plant.stage = Math.min(3, plant.stage + 1);
    plant.image = this.getPlantImage(plant.stage);
    this.updateStatus();
  }

  cleanPlant(plantId: number): void {
    const plant = this.plants.find((item) => item.id === plantId);
    if (!plant) {
      return;
    }

    plant.cleaned = true;
    plant.stage = Math.min(3, plant.stage + 1);
    plant.image = this.getPlantImage(plant.stage);
    this.updateStatus();
  }

  plantStageIcon(plant: GardenPlant): string {
    return '';
  }

  plantStatusText(plant: GardenPlant): string {
    if (plant.stage >= 3 && plant.watered && plant.cleaned) {
      return 'Listo para recoger.';
    }
    if (plant.watered && plant.cleaned) {
      return 'Muy bien cuidada.';
    }
    return 'Falta cuidado.';
  }

  get progress(): number {
    if (!this.plants.length) {
      return 0;
    }
    const completed = this.plants.filter((plant) => plant.watered && plant.cleaned).length;
    return Math.round((completed / this.plants.length) * 100);
  }

  private loadGarden(): void {
    const names = this.examples.length ? this.examples : ['carrot', 'tomato', 'lettuce'];
    const positions = [
      { positionX: 20, positionY: 70 },
      { positionX: 50, positionY: 60 },
      { positionX: 78, positionY: 72 },
    ];

    this.plants = names.slice(0, 3).map((name, index) => ({
      id: index + 1,
      name: name.split('→')[0].trim(),
      stage: 1,
      watered: false,
      cleaned: false,
      image: '/images/huerta/carrot/carrot_01.jpg',
      ...positions[index],
    }));
    this.feedbackMessage = 'Cuida las plantas para que crezcan.';
    this.isHealthy = false;
    this.showWarning = false;
  }

  private getPlantImage(stage: number): string {
    if (stage >= 3) {
      return '/images/huerta/carrot/carrot_03.jpg';
    }
    if (stage === 2) {
      return '/images/huerta/carrot/carrot_02.jpg';
    }
    return '/images/huerta/carrot/carrot_01.jpg';
  }

  private canPlacePlant(positionX: number, positionY: number, currentPlantId: number): boolean {
    return this.plants.every((plant) => {
      if (plant.id === currentPlantId) {
        return true;
      }

      const distanceX = Math.abs(plant.positionX - positionX);
      const distanceY = Math.abs(plant.positionY - positionY);
      return distanceX > 22 || distanceY > 22;
    });
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  private updateStatus(): void {
    const allHealthy = this.plants.every((plant) => plant.watered && plant.cleaned);
    if (allHealthy) {
      this.isHealthy = true;
      this.showWarning = false;
      this.feedbackMessage = '¡Tu huerto está perfecto!';
      return;
    }

    this.isHealthy = false;
    this.showWarning = true;
    this.feedbackMessage = 'Sigue regando y limpiando.';
  }
}
