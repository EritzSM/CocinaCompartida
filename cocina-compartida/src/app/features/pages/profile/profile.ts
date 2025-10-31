import { Component, OnInit, computed, signal, WritableSignal, Signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';

import { Auth } from '../../../shared/services/auth';
import { RecipeService } from '../../../shared/services/recipe';
import { EditProfileService } from '../../../shared/services/edit-profile.service';
import { User } from '../../../shared/interfaces/user';
import { Recipe } from '../../../shared/interfaces/recipe';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterModule, FormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css'],
})
export class Profile implements OnInit {
  private router = inject(Router);
  private auth = inject(Auth);
  private recipesSvc = inject(RecipeService);
  private edit = inject(EditProfileService);

  user: WritableSignal<User | null> = signal(null);
  activeTab: WritableSignal<'created' | 'favorites'> = signal('created');

  createdRecipes: Signal<Recipe[]> = computed(() => {
    const all = this.recipesSvc.recipes();
    const username = this.auth.currentUsername();
    return all.filter(r => r.author === username);
  });

  favoriteRecipes: Signal<Recipe[]> = computed(() => {
    const all = this.recipesSvc.recipes();
    const u = this.auth.getCurrentUser();
    return u?.id ? all.filter(r => (r.likedBy ?? []).includes(u.id)) : [];
  });

  displayedRecipes: Signal<Recipe[]> = computed(() =>
    this.activeTab() === 'created' ? this.createdRecipes() : this.favoriteRecipes()
  );

  // Estado modal
  modalVisible = false;
  newUsername = '';
  newPassword = '';
  newAvatar: string | undefined;
  newBio = '';
  isUpdating = false;

  ngOnInit(): void {
    this.loadUserProfile();
  }

  private async loadUserProfile() {
    try {
      const cached = this.auth.getCurrentUser();
      if (!cached) await this.auth.verifyLoggedUser();
      this.user.set(this.auth.getCurrentUser());
    } catch (e) {
      console.error('Error loading user profile:', e);
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cargar el perfil del usuario' });
    }
  }

  selectTab(tab: 'created' | 'favorites') {
    this.activeTab.set(tab);
  }

  openUpdateProfile() {
    const u = this.user();
    this.newUsername = u?.username ?? '';
    this.newPassword = '';
    this.newAvatar = u?.avatar;
    this.newBio = u?.bio ?? '';
    this.modalVisible = true;
  }

  closeUpdateProfile() {
    this.modalVisible = false;
  }

  async onAvatarSelected(ev: any) {
    const file: File | undefined = ev?.target?.files?.[0];
    if (!file) return;
    this.newAvatar = await this.edit.uploadAvatar(file);
  }

  async saveProfileUpdates() {
    const username = (this.newUsername || '').trim();
    if (!username) {
      Swal.fire({ icon: 'warning', title: 'El nombre no puede estar vacío' });
      return;
    }

    this.isUpdating = true;
    const payload = {
      username,
      avatar: this.newAvatar,
      bio: this.newBio,
      ...(this.newPassword && { password: this.newPassword }),
    };

    const updated = await this.edit.updateProfile(payload);
    if (updated) {
      this.user.set(updated);
      this.modalVisible = false;
    }
    this.isUpdating = false;
  }

  async deleteAccount() {
    const success = await this.edit.deleteAccount();
    if (success) this.router.navigate(['/login']);
  }
}
