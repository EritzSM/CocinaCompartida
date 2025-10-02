import { Component, OnInit, computed, signal, WritableSignal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth } from '../../../shared/services/auth';
import { Recipe, RecipeService } from '../../../shared/services/recipe';
import { User } from '../../../shared/interfaces/user';
import {Router, RouterModule, RouterLink } from '@angular/router';
import { inject } from '@angular/core';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterModule],
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

  favoriteRecipes: Signal<Recipe[]> = computed(() => []);

  displayedRecipes: Signal<Recipe[]> = computed(() => {
    return this.activeTab() === 'created'
      ? this.createdRecipes()
      : this.favoriteRecipes();
  });

  constructor(
    private authService: Auth,
    private recipeService: RecipeService
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
  }

  // 3. El método se actualiza para cargar el objeto User desde localStorage
  private loadUserProfile(): void {
    const username = this.authService.getCurrentUsername();
    if (username) {
      const userStr = localStorage.getItem(username);
      if (userStr) {
        // La información parseada ahora encaja con tu interfaz
        this.user.set(JSON.parse(userStr) as User);
      }
    }
  }

  selectTab(tab: 'created' | 'favorites'): void {
    this.activeTab.set(tab);
  }
}