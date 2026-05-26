import { Routes } from '@angular/router';

import { WelcomeComponent } from './components/welcome/welcome.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LearningPathComponent } from './components/learning-path/learning-path.component';
import { LessonComponent } from './components/lesson/lesson.component';
import { ProfileComponent } from './components/profile/profile.component';

export const routes: Routes = [
  { path: '', redirectTo: 'welcome', pathMatch: 'full' },
  // Redirige al inicio
  { path: 'welcome', component: WelcomeComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'learning-path', component: LearningPathComponent },
  { path: 'lesson/:id', component: LessonComponent },
  { path: 'profile', component: ProfileComponent },
];
