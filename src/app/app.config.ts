import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBsU7IB77g7CLQcuSy73c2VVuccA_gtjDU',
  authDomain: 'app-idioma-85f50.firebaseapp.com',
  projectId: 'app-idioma-85f50',
  storageBucket: 'app-idioma-85f50.firebasestorage.app',
  messagingSenderId: '654391091875',
  appId: '1:654391091875:web:f39340bac6279d7b05d516',
  measurementId: 'G-6EXLXY7DFC',
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    // Configuración necesaria para AngularFire
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
  ],
};

