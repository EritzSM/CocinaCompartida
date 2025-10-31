// shared/services/edit-profile.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';

import { Auth } from './auth';
import { UploadService } from './upload';
import { RecipeService } from './recipe';
import { User } from '../interfaces/user';

@Injectable({ providedIn: 'root' })
export class EditProfileService {
  private http = inject(HttpClient);
  private auth = inject(Auth);
  private upload = inject(UploadService);
  private recipes = inject(RecipeService);

  // ==== Config (ajusta a tu API) ====
  private readonly BASE_URL = 'http://localhost:3000/api/v1';
  private readonly USERS = `${this.BASE_URL}/user`;   // p. ej.: /user/:id  (si tu API usa /users, cambia aquí)

  /** Si ya tienes HttpInterceptor que agrega Authorization, elimina este helper y no pases headers en las llamadas */
  private getAuthOptions() {
    const token = localStorage.getItem('token'); // SOLO lectura
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      })
    };
  }

  // ---- Helpers de UI ----
  private toast(title: string, icon: 'success' | 'error' | 'warning' = 'success') {
    return Swal.fire({ toast: true, position: 'top-end', icon, title, showConfirmButton: false, timer: 1500 });
  }

  private alert(title: string, text = '', icon: 'success' | 'error' | 'warning' = 'error') {
    return Swal.fire({ icon, title, text });
  }

  private current(): User | null {
    return this.auth.getCurrentUser();
  }

  // ---- Subida de avatar (se mantiene igual) ----
  async uploadAvatar(file: File): Promise<string | undefined> {
    const u = this.current();
    const username = u?.username || `tmp-${Math.random().toString(36).slice(2, 9)}`;
    try {
      const res = await this.upload.uploadFile(file, true, username);
      if (res.success && res.data) {
        this.toast('Avatar cargado');
        return res.data as string;
      }
      this.alert('Error al subir la imagen', res.error || '');
    } catch (e) {
      console.error('upload avatar', e);
      this.alert('Error', 'No se pudo subir la imagen');
    }
    return undefined;
  }

  // ---- Actualización de perfil (sin ApiService) ----
  async updateProfile(updateData: Partial<User> & { password?: string }): Promise<User | null> {
    const u = this.current();
    if (!u?.id) {
      this.alert('Error', 'No se encontró el usuario actual');
      return null;
    }
    try {
      // PATCH /user/:id (ajusta si tu ruta es /users/:id)
      const updated = await firstValueFrom(
        this.http.patch<User>(`${this.USERS}/${u.id}`, updateData, this.getAuthOptions())
      );

      // Actualiza el estado global de Auth
      this.auth.currentUser.set(updated);
      this.auth.currentUsername.set(updated.username);

      // Si quieres refrescar recetas del usuario (por cambios de username/avatar)
      // puedes sincronizar optimistamente o recargar todo:
      // this.recipes.updateAuthorForUser(u.username, updated.username, updated.avatar);
      this.recipes.loadRecipes();

      this.toast('Perfil actualizado');
      return updated;
    } catch (e) {
      console.error('update profile', e);
      this.alert('Error', 'No se pudo actualizar el perfil');
      return null;
    }
  }

  // ---- Eliminación de cuenta (sin ApiService) ----
  async deleteAccount(): Promise<boolean> {
    const confirm = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer. Se eliminarán todas tus recetas y datos.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar cuenta',
      cancelButtonText: 'Cancelar',
    });
    if (!confirm.isConfirmed) return false;

    const u = this.current();
    if (!u?.id) return false;

    try {
      // DELETE /user/:id (ajusta si tu ruta es /users/:id)
      await firstValueFrom(
        this.http.delete<void>(`${this.USERS}/${u.id}`, this.getAuthOptions())
      );

      await Swal.fire({
        title: 'Cuenta eliminada',
        text: 'Tu cuenta ha sido eliminada exitosamente',
        icon: 'success',
      });

      this.auth.logout();
      return true;
    } catch (e) {
      console.error('delete account', e);
      this.alert('Error', 'No se pudo eliminar la cuenta');
      return false;
    }
  }
}
