// sign-up.ts
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Auth } from "../../../shared/services/auth";
import { SignUpResponse } from "../../../shared/interfaces/login-response";
import { User } from "../../../shared/interfaces/user";
import { UploadService } from '../../../shared/services/upload';
import { v4 as uuidv4 } from 'uuid';
import Swal from 'sweetalert2'

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './sign-up.html',
  styleUrls: ['./sign-up.css']
})
export class SignUp {
  readonly DEFAULT_AVATAR = 'logos/default.webp';
  
  avatarPreview: string = this.DEFAULT_AVATAR;
  showPassword = false;
  showrePassword = false;
  isUploadingAvatar = false;

  fb = inject(FormBuilder);
  router = inject(Router);
  authService = inject(Auth);
  uploadService = inject(UploadService);

  signUpForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rePassword: ['', [Validators.required]],
    avatar: [this.DEFAULT_AVATAR],
    bio: ['', [Validators.maxLength(200)]] // Campo 'bio' añadido al formulario
  }, { validators: this.passwordsMatchValidator })

  passwordsMatchValidator(group: FormGroup) {
    const pass = group.get('password')?.value;
    const rePass = group.get('rePassword')?.value;
    return pass === rePass ? null : { passwordMismatch: true };
  }

  togglePasswordVisibility(field: 'password' | 'rePassword') {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showrePassword = !this.showrePassword;
    }
  }

  hasError(controlName: string, errorType: string) {
    const control = this.signUpForm.get(controlName);
    return control && control.touched && control.hasError(errorType);
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];
    this.isUploadingAvatar = true;

    try {
      const result = await this.uploadService.uploadFile(file, true);
      
      if (result.success && result.data) {
        this.avatarPreview = result.data as string;
        this.signUpForm.patchValue({
          avatar: result.data
        });
        this.showToast('success', 'Avatar subido correctamente');
      } else {
        this.showAlert('Error', result.error || 'Error al subir el avatar');
      }
    } catch (error: any) {
      this.showAlert('Error', error.message || 'Error al subir el avatar');
    } finally {
      this.isUploadingAvatar = false;
    }
  }

  removeAvatar(): void {
    this.avatarPreview = this.DEFAULT_AVATAR;
    this.signUpForm.patchValue({
      avatar: this.DEFAULT_AVATAR
    });
    this.showToast('info', 'Avatar restablecido al predeterminado');
  }

  onSignUp() {
    if (!this.signUpForm.valid) {
      this.showAlert('Ops!', 'Por favor complete todos los campos requeridos correctamente');
      return;
    }

    if (this.signUpForm.hasError('passwordMismatch')) {
      this.showAlert('Ops!', 'Las contraseñas no coinciden');
      return;
    }

    const formValue = this.signUpForm.value;
    
    // Asumimos que la interfaz User ahora acepta un campo opcional 'bio'
    const user: User = {
      id: uuidv4(),
      username: formValue.username?.trim() || '',
      email: formValue.email?.trim() || '',
      password: formValue.password || '',
      avatar: formValue.avatar || this.DEFAULT_AVATAR,
      bio: formValue.bio?.trim() || '' // Propiedad 'bio' añadida al objeto de usuario
    };
    
    try {
      const response: SignUpResponse = this.authService.onSignUp(user);

      if (!response.success) {
        const errorMessage = response.message || 'Error en el registro. Por favor intente nuevamente.';
        this.showAlert('Ops!', errorMessage);
        return;
      }

      const redirectTo = response.redirectTo || 'home';
      this.router.navigate([redirectTo]);
      
    } catch (error: any) {
      console.error('Error en registro:', error);
      this.showAlert('Error', 'Ocurrió un error inesperado. Por favor intente nuevamente.');
    }
  }

  private showAlert(title: string, text: string, icon: 'success' | 'error' | 'warning' = 'error') {
    Swal.fire({
      title,
      text,
      icon,
      confirmButtonText: 'Entendido'
    });
  }

  private showToast(icon: 'success' | 'error' | 'warning' | 'info', title: string) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon,
      title,
      showConfirmButton: false,
      timer: 3000
    });
  }
}