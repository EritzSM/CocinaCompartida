import { Component , inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Auth } from "../../../shared/services/auth";
import { User } from "../../../shared/interfaces/user";
import Swal from 'sweetalert2'

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './sign-up.html',
  styleUrls: ['./sign-up.css']
})
export class SignUp {

  title = 'Registro de usuario';

  showPassword = false;

  showrePassword = false;

  isSubmitting = false;

  fb= inject(FormBuilder);

  router = inject(Router);

  authService = inject(Auth);
    
  signUpForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rePassword: ['', [Validators.required]]
    }, { validators: this.passwordsMatchValidator })

  
  passwordsMatchValidator(group: FormGroup) {
  const pass = group.get('password')?.value;
  const rePass = group.get('rePassword')?.value;
  return pass === rePass ? null : { passwordMismatch: true };
}

      // Toggle para mostrar/ocultar contraseña
  togglePasswordVisibility(field: 'password' | 'rePassword') {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showrePassword = !this.showrePassword;
    }
  }

  // Verificar si un campo tiene error
  hasError(controlName: string, errorType: string) {
    const control = this.signUpForm.get(controlName);
    return control && control.touched && control.hasError(errorType);
  }
  // Validador personalizado para confirmar contraseña
  onSignUp() {
        if (!this.signUpForm.valid) {
            Swal.fire({
                title: "Ops!",
                text: "El formulario no es valido",
                icon: "error"
            });
            return;
        }
        let user = this.signUpForm.value as User;

        let response = this.authService.onSignUp(user);

        if (!response.success) {
            Swal.fire({
                title: "Ops!",
                text: response.message,
                icon: "error"
            });
            return;
        }
        this.router.navigate([response.redirectTo]);
    }



}