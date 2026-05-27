import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FirebaseError } from 'firebase/app';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  mode: 'login' | 'register' = 'login';
  email = '';
  password = '';
  username = '';
  loading = false;
  errorMessage: string | null = null;

  setMode(mode: 'login' | 'register') {
    this.mode = mode;
    this.errorMessage = null;
  }

  async submit() {
    this.errorMessage = null;
    if (!this.email.trim() || !this.password) {
      this.errorMessage = 'Completa correo y contraseña.';
      return;
    }
    if (this.mode === 'register' && !this.username.trim()) {
      this.errorMessage = 'Indica un nombre de usuario.';
      return;
    }

    this.loading = true;
    try {
      if (this.mode === 'login') {
        await this.auth.signIn(this.email, this.password);
      } else {
        await this.auth.signUp(
          this.email,
          this.password,
          this.username,
        );
      }
      await this.router.navigate(['/dashboard']);
    } catch (err: unknown) {
      const code =
        err instanceof FirebaseError
          ? err.code
          : (err as { code?: string })?.code ?? '';
      this.errorMessage = this.auth.mapAuthError(code);
    } finally {
      this.loading = false;
    }
  }
}
