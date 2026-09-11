import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { DataService } from '../../services/data.service';
import type { CuentoDoc, CuentoPage } from '../../models/cuento.types';

@Component({
  selector: 'app-cuento-reader',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="story-reader" *ngIf="cuento as current; else loading">
      <header class="reader-header">
        <button type="button" class="back-button" [routerLink]="['/cuentos']">←</button>
        <div class="reader-title-wrap">
          <span class="reader-label">Cuento</span>
          <h1>{{ current.title }}</h1>
        </div>
      </header>

      <main class="reader-card">
        <div class="cover-area" *ngIf="current.coverImageUrl || current.icon">
          <img *ngIf="current.coverImageUrl" [src]="current.coverImageUrl" [alt]="current.title" />
          <div *ngIf="!current.coverImageUrl" class="cover-placeholder">{{ current.icon }}</div>
        </div>

        <section class="page-panel" *ngIf="currentPage; else noPages">
          <div class="page-image" *ngIf="currentPage.imageUrl">
            <img [src]="currentPage.imageUrl" [alt]="current.title + ' página ' + currentPage.order" />
          </div>

          <div class="page-text">
            <div class="language-block">
              <h2>Kamëntsá</h2>
              <p>{{ currentPage.kamentsaText || '—' }}</p>
            </div>

            <div class="language-block">
              <h2>Español</h2>
              <p>{{ currentPage.spanishText || '—' }}</p>
            </div>
          </div>

          <div class="page-footer">
            <div class="page-progress">Página {{ currentPage.order }} / {{ pages.length }}</div>
            <div class="nav-buttons">
              <button type="button" [disabled]="currentPage.order === 1" (click)="prevPage()">← Anterior</button>
              <button type="button" [disabled]="currentPage.order === pages.length" (click)="nextPage()">Siguiente →</button>
            </div>
          </div>
        </section>

        <ng-template #noPages>
          <div class="empty-page">
            <h2>Este cuento aún no tiene páginas publicadas.</h2>
            <p>Se mantendrá compatibilidad con el contenido legacy mientras se completa la estructura de libro.</p>
          </div>
        </ng-template>
      </main>
    </div>

    <ng-template #loading>
      <div class="loading-state">Cargando cuento...</div>
    </ng-template>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background: #f4f7f6;
        color: #1e293b;
      }
      .story-reader {
        max-width: 860px;
        margin: 0 auto;
        padding: 20px 16px 40px;
      }
      .reader-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 18px;
      }
      .back-button {
        border: none;
        background: transparent;
        font-size: 28px;
        cursor: pointer;
      }
      .reader-title-wrap {
        flex: 1;
      }
      .reader-label {
        display: inline-block;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #64748b;
      }
      h1 {
        margin: 4px 0 0;
        font-size: clamp(1.8rem, 4vw, 2.5rem);
        line-height: 1.2;
      }
      .reader-card {
        background: #fff;
        border-radius: 24px;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
        overflow: hidden;
      }
      .cover-area {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 220px;
        background: linear-gradient(135deg, #f7971e 0%, #ffd200 100%);
      }
      .cover-area img {
        width: 100%;
        max-height: 260px;
        object-fit: cover;
      }
      .cover-placeholder {
        font-size: 72px;
      }
      .page-panel {
        display: flex;
        flex-direction: column;
        gap: 18px;
        padding: 20px 16px 18px;
      }
      .page-image img {
        width: 100%;
        max-height: 280px;
        object-fit: cover;
        border-radius: 16px;
      }
      .page-text {
        display: grid;
        gap: 18px;
      }
      .language-block {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        padding: 16px;
      }
      .language-block h2 {
        margin: 0 0 10px;
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #475569;
      }
      .language-block p {
        margin: 0;
        white-space: pre-line;
        line-height: 1.8;
        font-size: 1rem;
      }
      .page-footer {
        display: flex;
        flex-direction: column;
        gap: 14px;
        align-items: center;
        padding-top: 8px;
      }
      .page-progress {
        font-weight: 700;
        color: #334155;
      }
      .nav-buttons {
        display: flex;
        gap: 12px;
        width: 100%;
      }
      .nav-buttons button {
        flex: 1;
        border: none;
        border-radius: 12px;
        background: #e2e8f0;
        color: #0f172a;
        font-weight: 700;
        padding: 12px 14px;
        cursor: pointer;
      }
      .nav-buttons button:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
      .loading-state,
      .empty-page {
        text-align: center;
        padding: 40px 20px;
        color: #475569;
      }
      @media (min-width: 700px) {
        .page-panel {
          padding: 28px;
        }
        .page-footer {
          flex-direction: row;
          justify-content: space-between;
        }
        .nav-buttons {
          width: auto;
        }
      }
    `,
  ],
})
export class CuentoReaderComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private dataService = inject(DataService);
  private readonly subscription = new Subscription();

  cuento: CuentoDoc | null = null;
  pages: CuentoPage[] = [];
  currentPageIndex = 0;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }

    const cuentosSub = this.dataService.getCuentosFromFirebase().subscribe((cuentos) => {
      const match = cuentos.find((cuento) => cuento.id === id);
      if (!match) {
        this.cuento = null;
        this.pages = [];
        return;
      }

      this.cuento = match;
      const fallbackPages = this.buildLegacyPages(match);
      this.pages = (match.pages && match.pages.length > 0 ? match.pages : fallbackPages).sort((a, b) => a.order - b.order);
      this.currentPageIndex = Math.min(this.currentPageIndex, Math.max(this.pages.length - 1, 0));
    });

    this.subscription.add(cuentosSub);
  }

  get currentPage(): CuentoPage | undefined {
    return this.pages[this.currentPageIndex];
  }

  nextPage(): void {
    if (this.currentPageIndex < this.pages.length - 1) {
      this.currentPageIndex += 1;
    }
  }

  prevPage(): void {
    if (this.currentPageIndex > 0) {
      this.currentPageIndex -= 1;
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private buildLegacyPages(cuento: CuentoDoc): CuentoPage[] {
    const content = (cuento.content ?? '').trim();
    if (!content) {
      return [];
    }

    const paragraphs = content
      .split(/\n\s*\n+/)
      .map((value) => value.trim())
      .filter(Boolean);

    return paragraphs.map((text, index) => ({
      id: `legacy_page_${index + 1}`,
      order: index + 1,
      imageUrl: cuento.coverImageUrl ?? null,
      kamentsaText: text,
      spanishText: text,
    }));
  }
}
