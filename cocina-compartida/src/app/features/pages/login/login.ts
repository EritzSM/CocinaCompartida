import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Auth } from '../../../shared/services/auth';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})

export class Login {
  fb = inject(FormBuilder);
  router = inject(Router);
  authService = inject(Auth);

  loginForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(2)]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  showPassword = false;
  isLoggingIn = false;

  hasError(controlName: string, errorType: string) {
    const control = this.loginForm.get(controlName);
    return !!(control && control.touched && control.hasError(errorType));
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async onLogin(): Promise<void> {
    this.loginForm.markAllAsTouched();

    if (this.isLoggingIn || !this.loginForm.valid) {
      Swal.fire({ title: "Ops!", text: "Por favor complete todos los campos correctamente", icon: "error" });
      return;
    }

    this.isLoggingIn = true;

    try {
      const { username, password } = this.loginForm.getRawValue() as { username: string; password: string };

      const response = await this.authService.login({
        username: username.trim(),
        password
      });

      if (response.success) {
        await this.router.navigate(['/home'], { replaceUrl: true });
      } else {
        Swal.fire({
          title: "Ops!",
          text: response.message || "Error al iniciar sesión",
          icon: "error"
        });
      }
    } catch (error) {
      console.error('Error en login:', error);
      Swal.fire({ title: "Error", text: "Ocurrió un error inesperado", icon: "error" });
    } finally {
      this.isLoggingIn = false;
    }
  }
}