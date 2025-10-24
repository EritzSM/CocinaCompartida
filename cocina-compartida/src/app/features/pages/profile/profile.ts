import { Component, OnInit, computed, signal, WritableSignal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../../shared/services/auth';
import { RecipeService } from '../../../shared/services/recipe';
import { Recipe } from '../../../shared/interfaces/recipe';
import { User } from '../../../shared/interfaces/user';
import {Router, RouterModule, RouterLink } from '@angular/router';
import { inject } from '@angular/core';
import { UploadService } from '../../../shared/services/upload';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterModule, FormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class Profile implements OnInit {

  private router = inject(Router);
  // 2. La señal ahora usará tu interfaz User importada
  user: WritableSignal<User | null> = signal(null);

  activeTab: WritableSignal<'created' | 'favorites'> = signal('created');

  createdRecipes: Signal<Recipe[]> = computed(() => {
    const allRecipes = this.recipeService.recipes();
    const currentUser = this.authService.currentUsername();
    return allRecipes.filter(recipe => recipe.author === currentUser);
  });

  favoriteRecipes: Signal<Recipe[]> = computed(() => {
    const allRecipes = this.recipeService.recipes();
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return [];
    return allRecipes.filter(r => (r.likedBy ?? []).includes(currentUser.id));
  });

  displayedRecipes: Signal<Recipe[]> = computed(() => {
    return this.activeTab() === 'created'
      ? this.createdRecipes()
      : this.favoriteRecipes();
  });

  constructor(
    private authService: Auth,
    private recipeService: RecipeService,
    private uploadService: UploadService
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
  }

  private loadUserProfile(): void {
    const username = this.authService.getCurrentUsername();
    if (username) {
      const userStr = localStorage.getItem(username);
      if (userStr) {
        this.user.set(JSON.parse(userStr) as User);
      }
    }
  }

  selectTab(tab: 'created' | 'favorites'): void {
    this.activeTab.set(tab);
  }

  // Campos para el formulario de actualización
  modalVisible: boolean = false;
  newUsername: string = '';
  newPassword: string = '';
  newAvatar: string | undefined;
  newBio: string = ''; // Propiedad para la nueva biografía

  openUpdateProfile(): void {
    const current = this.user();
    this.newUsername = current?.username || '';
    this.newPassword = '';
    this.newAvatar = current?.avatar;
    this.newBio = current?.bio || ''; // Inicializar con la biografía actual
    this.modalVisible = true;
  }

  closeUpdateProfile(): void {
    this.modalVisible = false;
  }

  async onAvatarSelected(ev: any) {
    const file: File | undefined = ev?.target?.files?.[0];
    if (!file) return;
    const res = await this.uploadService.uploadFile(file);
    if (res.success && res.data) {
      this.newAvatar = res.data as string;
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Avatar cargado', showConfirmButton: false, timer: 1500 });
    } else {
      Swal.fire({ icon: 'error', title: 'Error al subir la imagen', text: res.error || '' });
    }
  }

  saveProfileUpdates(): void {
    const current = this.user();
    if (!current) return;

    const trimmedUsername = (this.newUsername || '').trim();
    if (!trimmedUsername) {
      Swal.fire({ icon: 'warning', title: 'El nombre no puede estar vacío' });
      return;
    }

    const updatedUser: User = {
      ...current,
      username: trimmedUsername,
      avatar: this.newAvatar || current.avatar,
      password: this.newPassword ? this.newPassword : current.password,
      bio: this.newBio // Guardar la nueva biografía
    };

    if (trimmedUsername !== current.username) {
      if (localStorage.getItem(trimmedUsername)) {
        Swal.fire({ icon: 'error', title: 'El nombre de usuario ya existe' });
        return;
      }
      localStorage.removeItem(current.username);
      localStorage.setItem(trimmedUsername, JSON.stringify(updatedUser));
      sessionStorage.setItem('userLogged', trimmedUsername);
      this.recipeService.updateAuthorForUser(current.username, trimmedUsername, updatedUser.avatar);
    } else {
      localStorage.setItem(current.username, JSON.stringify(updatedUser));
    }

    this.user.set(updatedUser);
    this.authService.currentUsername.set(updatedUser.username);
    this.modalVisible = false;
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Perfil actualizado', showConfirmButton: false, timer: 1500 });
  }
}