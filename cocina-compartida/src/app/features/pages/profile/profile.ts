import { Component, OnInit, computed, signal, WritableSignal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth } from '../../../shared/services/auth';
import { RecipeService } from '../../../shared/services/recipe';
import { Recipe } from '../../../shared/interfaces/recipe';
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


  private loadUserProfile(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      
      this.user.set(currentUser);
    }
  }

  selectTab(tab: 'created' | 'favorites'): void {
    this.activeTab.set(tab);
  }
}