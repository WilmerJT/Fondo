import { Routes } from '@angular/router';

import { WelcomeComponent } from './components/welcome/welcome.component';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LearningPathComponent } from './components/learning-path/learning-path.component';
import { LessonComponent } from './components/lesson/lesson.component';
import { ProfileComponent } from './components/profile/profile.component';
import { JuegosComponent } from './components/juegos/juegos.component';
import { GameDetailComponent } from './components/juegos/game-detail.component';
import { PaintPageComponent } from './components/juegos/paint-page.component';
import { CrosswordPageComponent } from './components/juegos/crossword-page.component';
import { WordSearchPageComponent } from './components/juegos/word-search-page.component';
import { GardenPageComponent } from './components/juegos/garden-page.component';
import { CuentosComponent } from './components/cuentos/cuentos.component';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'welcome', pathMatch: 'full' },
  { path: 'welcome', component: WelcomeComponent },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard],
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
  },
  {
    path: 'learning-path',
    component: LearningPathComponent,
    canActivate: [authGuard],
  },
  {
    path: 'lesson/:id',
    component: LessonComponent,
    canActivate: [authGuard],
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard],
  },
  {
    path: 'juegos',
    component: JuegosComponent,
    canActivate: [authGuard],
  },
  {
    path: 'juegos/paint',
    component: PaintPageComponent,
    canActivate: [authGuard],
  },
  {
    path: 'juegos/crossword',
    component: CrosswordPageComponent,
    canActivate: [authGuard],
  },
  {
    path: 'juegos/word-search',
    component: WordSearchPageComponent,
    canActivate: [authGuard],
  },
  {
    path: 'juegos/garden',
    component: GardenPageComponent,
    canActivate: [authGuard],
  },
  {
    path: 'juegos/:id',
    component: GameDetailComponent,
    canActivate: [authGuard],
  },
  {
    path: 'cuentos',
    component: CuentosComponent,
    canActivate: [authGuard],
  },
];
