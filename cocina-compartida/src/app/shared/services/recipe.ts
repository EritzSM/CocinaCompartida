// recipe.service.ts
import { Injectable, signal, effect } from '@angular/core';
import { RECIPES_DATA } from './recipe.data';
import { Recipe } from '../interfaces/recipe';

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  private readonly STORAGE_KEY = 'my_recipes';
  private _recipes = signal<Recipe[]>(this.initializeRecipes());

  get recipes() {
    return this._recipes.asReadonly();
  }

  constructor() {
    effect(() => {
      this.saveRecipesToStorage(this._recipes());
    });
  }

  addRecipe(recipe: Recipe) {
    // Insertar nuevas recetas al inicio para que se vean primero en Explore
    this._recipes.update((list) => [recipe, ...list]);
  }

  updateRecipe(recipeId: string, changes: Partial<Recipe>) {
    this._recipes.update((list) =>
      list.map((r) => (r.id === recipeId ? { ...r, ...changes } : r))
    );
  }

  deleteRecipe(recipeId: string) {
    this._recipes.update((list) => list.filter((r) => r.id !== recipeId));
  }
  
  private initializeRecipes(): Recipe[] {
    try {
      const storedRecipes = localStorage.getItem(this.STORAGE_KEY);
      
      if (storedRecipes) {
        // Si hay recetas en localStorage, usamos esas como fuente de verdad
        const parsedStoredRecipes = JSON.parse(storedRecipes) as Recipe[];
        const uniqueStored = this.removeDuplicateRecipes(parsedStoredRecipes);
        return uniqueStored;
      } else {
        // Si no hay nada en localStorage, devolvemos solo las recetas precargadas
        return RECIPES_DATA;
      }

    } catch (e) {
      console.error("Error loading recipes from localStorage", e);
      return RECIPES_DATA; // En caso de error, devolvemos las recetas precargadas
    }
  }

  private removeDuplicateRecipes(recipes: Recipe[]): Recipe[] {
    const seen = new Set();
    return recipes.filter(recipe => {
      if (seen.has(recipe.id)) {
        return false;
      }
      seen.add(recipe.id);
      return true;
    });
  }

  private saveRecipesToStorage(recipes: Recipe[]) {
    try {
      // Guardamos todas las recetas (precargadas + nuevas) en localStorage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recipes));
    } catch (e) {
      console.error("Error saving recipes to localStorage", e);
    }
  }

  // Opcional: Método para resetear a las recetas precargadas
  resetToDefaultRecipes() {
    this._recipes.set(RECIPES_DATA);
  }

  // Opcional: Método para obtener solo las recetas del usuario (excluyendo precargadas)
  getUserRecipes(): Recipe[] {
    const precargadasIds = new Set(RECIPES_DATA.map(recipe => recipe.id));
    return this._recipes().filter(recipe => !precargadasIds.has(recipe.id));
  }

  toggleLike(recipeId: string, userId: string): void {
    this._recipes.update((list) =>
      list.map((recipe) => {
        if (recipe.id !== recipeId) return recipe;
        const currentLikedBy = recipe.likedBy ? [...recipe.likedBy] : [];
        const hasLiked = currentLikedBy.includes(userId);
        const newLikedBy = hasLiked
          ? currentLikedBy.filter((id) => id !== userId)
          : [...currentLikedBy, userId];
        const newLikes = newLikedBy.length;
        return {
          ...recipe,
          likedBy: newLikedBy,
          likes: newLikes,
        };
      })
    );
  }

  addComment(recipeId: string, comment: import('../interfaces/comment').Comment): void {
    this._recipes.update((list) =>
      list.map((recipe) => {
        if (recipe.id !== recipeId) return recipe;
        const currentComments = recipe.comments ? [...recipe.comments] : [];
        return {
          ...recipe,
          comments: [...currentComments, comment],
        };
      })
    );
  }

  updateAuthorForUser(oldUsername: string, newUsername: string, newAvatar?: string): void {
    this._recipes.update((list) =>
      list.map((recipe) => {
        if (recipe.author !== oldUsername) return recipe;
        return {
          ...recipe,
          author: newUsername,
          avatar: newAvatar ?? recipe.avatar,
        };
      })
    );
  }
}
