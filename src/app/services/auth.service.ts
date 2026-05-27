import { Injectable, inject } from '@angular/core';
import {
  Auth,
  authState,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  getDoc,
  setDoc,
} from '@angular/fire/firestore';
import { Observable, firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  /** Usuario autenticado o `null` si no hay sesión. */
  readonly user$: Observable<User | null> = authState(this.auth);

  getCurrentUid(): string | null {
    return this.auth.currentUser?.uid ?? null;
  }

  async signIn(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email.trim(), password);
    await this.ensureUserProfile();
  }

  async signUp(
    email: string,
    password: string,
    username?: string,
  ): Promise<void> {
    const cred = await createUserWithEmailAndPassword(
      this.auth,
      email.trim(),
      password,
    );
    await this.createUserProfile(cred.user, username);
  }

  async signOut(): Promise<void> {
    await signOut(this.auth);
  }

  /** Crea el documento `users/{uid}` si no existe (registro o primer login). */
  async ensureUserProfile(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) return;
    const ref = doc(this.firestore, 'users', user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await this.createUserProfile(user);
    }
  }

  private async createUserProfile(
    user: User,
    username?: string,
  ): Promise<void> {
    const ref = doc(this.firestore, 'users', user.uid);
    const defaultName =
      username?.trim() ||
      user.displayName?.trim() ||
      user.email?.split('@')[0] ||
      'Usuario';
    await setDoc(
      ref,
      {
        username: defaultName,
        email: user.email ?? '',
        xp: 0,
        level: 'Principiante A1',
        streak: 0,
        lastStreakDate: '',
      },
      { merge: true },
    );
    // Progreso del mapa: se inicializa en DataService al abrir learning-path
  }

  mapAuthError(code: string): string {
    switch (code) {
      case 'auth/invalid-email':
        return 'El correo no es válido.';
      case 'auth/user-disabled':
        return 'Esta cuenta está deshabilitada.';
      case 'auth/user-not-found':
        return 'No existe una cuenta con ese correo.';
      case 'auth/wrong-password':
        return 'Contraseña incorrecta.';
      case 'auth/invalid-credential':
        return 'Correo o contraseña incorrectos.';
      case 'auth/email-already-in-use':
        return 'Ese correo ya está registrado.';
      case 'auth/weak-password':
        return 'La contraseña debe tener al menos 6 caracteres.';
      case 'auth/too-many-requests':
        return 'Demasiados intentos. Espera un momento.';
      default:
        return 'No se pudo completar la operación. Inténtalo de nuevo.';
    }
  }

  async waitForAuthReady(): Promise<User | null> {
    return firstValueFrom(this.user$);
  }
}
