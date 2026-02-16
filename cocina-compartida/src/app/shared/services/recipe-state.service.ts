import { Injectable, signal, computed } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { Recipe } from '../interfaces/recipe';

@Injectable({
  providedIn: 'root'
})
export class RecipeStateService {

  private _recipes = signal<Recipe[]>([]);
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);
  private readonly BASE_URL = '/api';
  private readonly RECIPES = `${this.BASE_URL}/recipes`;

  recipes = computed(() => this._recipes());
  loading = computed(() => this._loading());
  error = computed(() => this._error());

  get recipesUrl(): string {
    return this.RECIPES;
  }

  getRecipeUrl(recipeId: string): string {
    return `${this.RECIPES}/${recipeId}`;
  }

  getRecipeLikeUrl(recipeId: string): string {
    return `${this.RECIPES}/${recipeId}/like`;
  }

  getRecipeCommentsUrl(recipeId: string): string {
    return `${this.RECIPES}/${recipeId}/comments`;
  }

  getCommentUrl(commentId: string): string {
    return `${this.RECIPES}/comments/${commentId}`;
  }

  getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }

  getAuthOptions() {
    return { headers: this.getAuthHeaders() };
  }

  setRecipes(recipes: Recipe[]): void {
    this._recipes.set(Array.isArray(recipes) ? recipes : []);
  }

  updateRecipes(updater: (recipes: Recipe[]) => Recipe[]): void {
    this._recipes.update(updater);
  }

  setLoading(loading: boolean): void {
    this._loading.set(loading);
  }

  setError(error: string | null): void {
    this._error.set(error);
  }

  getRecipeById(recipeId: string): Recipe | undefined {
    return this._recipes().find(recipe => recipe.id === recipeId);
  }

  rollbackRecipes(previousState: Recipe[]): void {
    this._recipes.set(previousState);
  }

  clearError(): void {
    this._error.set(null);
  }

  getRecipesCount(): number {
    return this._recipes().length;
  }

  getRecipesByUser(userId: string): Recipe[] {
    return this._recipes().filter(recipe => recipe.user?.id === userId);
  }

  isRecipeLikedByUser(recipeId: string, userId: string): boolean {
    const recipe = this.getRecipeById(recipeId);
    return recipe?.likedBy?.includes(userId) || false;
  }
}