import { Component, OnInit, computed, signal, WritableSignal, Signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, RouterLink, ActivatedRoute } from '@angular/router';
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
  private route = inject(ActivatedRoute);
  private auth = inject(Auth);
  private recipesSvc = inject(RecipeService);
  private edit = inject(EditProfileService);

  user: WritableSignal<User | null> = signal(null);
  isOwnProfile: WritableSignal<boolean> = signal(true);
  activeTab: WritableSignal<'created' | 'favorites'> = signal('created');

  createdRecipes: Signal<Recipe[]> = computed(() => {
    const all = this.recipesSvc.recipes();
    const currentUser = this.user();
    if (!currentUser) return [];
    return all.filter(r => r.user.username === currentUser.username);
  });

  favoriteRecipes: Signal<Recipe[]> = computed(() => {
    if (!this.isOwnProfile()) return [];
    const all = this.recipesSvc.recipes();
    const u = this.auth.getCurrentUser();
    return u?.id ? all.filter(r => (r.likedBy ?? []).includes(u.id)) : [];
  });

  displayedRecipes: Signal<Recipe[]> = computed(() =>
    this.activeTab() === 'created' ? this.createdRecipes() : this.favoriteRecipes()
  );

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
      const userId = this.route.snapshot.paramMap.get('id');
      if (userId) {
        this.isOwnProfile.set(false);
        const user = await this.edit.fetchUserById(userId);
        if (user && user !== 'unauthorized') {
          this.user.set(user);
          this.activeTab.set('created');
        } else if (user === 'unauthorized') {

          this.router.navigate(['/home']);
        } else {
          Swal.fire({ icon: 'error', title: 'Error', text: 'Usuario no encontrado' });
          this.router.navigate(['/home']);
        }
      } else {

        this.isOwnProfile.set(true);
        const cached = this.auth.getCurrentUser();
        if (!cached) await this.auth.verifyLoggedUser();
        this.user.set(this.auth.getCurrentUser());
      }
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
