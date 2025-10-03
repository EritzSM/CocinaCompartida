import { Component, inject, HostListener, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecipeService, Recipe } from '../../../shared/services/recipe';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './explore.html',
  styleUrls: ['./explore.css']
})
export class Explore implements OnInit, OnDestroy {
  private recipeService = inject(RecipeService);
  private router = inject(Router);
  
  private recipesSubscription!: Subscription;
  
  allRecipes = signal<Recipe[]>([]);
  private recipesPerPage = 6;
  visibleRecipeCount = signal(this.recipesPerPage);
  isLoading = signal(false);
  
  recipesToShow = computed((): Recipe[] => {
    return this.allRecipes().slice(0, this.visibleRecipeCount());
  });

  ngOnInit(): void {
    this.recipesSubscription = this.recipeService.recipes$.subscribe(recipes => {
      this.allRecipes.set(recipes);
      
      if (recipes.length > 0) {
        this.visibleRecipeCount.set(Math.min(this.recipesPerPage, recipes.length));
        setTimeout(() => this.checkScrollPosition(), 100);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.recipesSubscription) {
      this.recipesSubscription.unsubscribe();
    }
  }

  trackByRecipeId(index: number, recipe: Recipe): string {
    return recipe.id;
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.checkScrollPosition();
  }

  private checkScrollPosition(): void {
    const totalRecipes = this.allRecipes().length;
    const currentVisible = this.visibleRecipeCount();

    if (currentVisible >= totalRecipes || this.isLoading()) {
      return;
    }

    const scrollPosition = window.innerHeight + window.scrollY;
    const documentHeight = document.documentElement.scrollHeight;
    const threshold = documentHeight - 500;

    if (scrollPosition >= threshold) {
      this.loadMoreRecipes();
    }
  }

  loadMoreRecipes(): void {
    const totalRecipes = this.allRecipes().length;
    const currentVisible = this.visibleRecipeCount();

    if (currentVisible < totalRecipes) {
      this.isLoading.set(true);
      
      const nextCount = currentVisible + this.recipesPerPage;
      this.visibleRecipeCount.set(Math.min(nextCount, totalRecipes));
      
      setTimeout(() => {
        this.isLoading.set(false);
      }, 500);
    }
  }
}