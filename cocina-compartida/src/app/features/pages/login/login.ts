import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Auth } from '../../../shared/services/auth';
import { User } from '../../../shared/interfaces/user';
import Swal from 'sweetalert2'

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

  // ✅ CORRECCIÓN CLAVE: Cambiar 'email' por 'username' y ajustar sus validadores.
  loginForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(2)]], // Usar username
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  showPassword = false;
  isLoginting = false;


  // Verificar si un campo tiene error
  hasError(controlName: string, errorType: string) {
    const control = this.loginForm.get(controlName);
    return control && control.touched && control.hasError(errorType);
  }

  // Toggle para mostrar/ocultar contraseña
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  // Envío del formulario
  onLogin() {
    if (!this.loginForm.valid) {
            Swal.fire({
                title: "Ops!",
                text: "El formulario no es valido",
                icon: "error"
            });
            return;
        }
        let user = this.loginForm.value as User;

        let response = this.authService.login(user);
        if (response.success) {
            this.router.navigate(['/home'])
            return;
        }
        Swal.fire({
            title: "Ops!",
            text: response.message,
            icon: "error"
        });

    }
}