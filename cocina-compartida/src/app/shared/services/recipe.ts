import { Injectable, signal, effect } from '@angular/core';
import { RECIPES_DATA } from './recipe.data';
import { Recipe } from '../interfaces/recipe';

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  private readonly STORAGE_KEY = 'my_recipes';
  private _recipes = signal<Recipe[]>(this.initializeRecipes());
  
  private recipesSubject = new BehaviorSubject<Recipe[]>(this._recipes());
  public recipes$ = this.recipesSubject.asObservable();

  get recipes() {
    return this._recipes.asReadonly();
  }

  constructor() {
    effect(() => {
      const currentRecipes = this._recipes();
      this.saveRecipesToStorage(currentRecipes);
      this.recipesSubject.next(currentRecipes);
    });
  }

  private initializeRecipes(): Recipe[] {
    try {
      const storedRecipes = localStorage.getItem(this.STORAGE_KEY);
      let recipes: Recipe[];

      if (storedRecipes) {
        const parsedStoredRecipes = JSON.parse(storedRecipes) as Recipe[];
        
        // Combinar recetas: primero las precargadas, luego las del localStorage
        // y eliminar duplicados por ID
        const allRecipes = [...RECIPES_DATA, ...parsedStoredRecipes];
        const uniqueRecipes = this.removeDuplicateRecipes(allRecipes);
        
        return uniqueRecipes;
      } else {
        // Si no hay nada en localStorage, devolvemos solo las recetas precargadas
        return RECIPES_DATA;
      }

      return recipes.map(recipe => ({
        ...recipe,
        avatar: this.validateAvatar(recipe.avatar)
      }));

    } catch (e) {
      console.error("Error loading recipes from localStorage", e);
      return RECIPES_DATA; // En caso de error, devolvemos las recetas precargadas
    }
    return avatar;
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

  private optimizeRecipesForStorage(recipes: Recipe[]): Recipe[] {
    const limitedRecipes = recipes.slice(-50);
    return limitedRecipes.map(recipe => ({
      ...recipe,
      images: recipe.images.map(image => {
        if (image.startsWith('data:image') && image.length > 50000) {
          return image;
        }
        return image;
      }).slice(0, 3)
    }));
  }

  private handleStorageError(error: any, recipes: Recipe[]) {
    if (error.name === 'QuotaExceededError') {
      const essentialRecipes = this.getEssentialRecipes(recipes);
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(essentialRecipes));
      } catch (e) {
        localStorage.removeItem(this.STORAGE_KEY);
      }
    }
  }

  // Opcional: Método para resetear a las recetas precargadas
  resetToDefaultRecipes() {
    this._recipes.set(RECIPES_DATA);
  }

  getUserRecipes(): Recipe[] {
    const precargadasIds = new Set(RECIPES_DATA.map(recipe => recipe.id));
    return this._recipes().filter(recipe => !precargadasIds.has(recipe.id));
  }

  clearStorage() {
    localStorage.removeItem(this.STORAGE_KEY);
    this._recipes.set(RECIPES);
  }

  searchRecipes(searchTerm: string): Recipe[] {
    if (!searchTerm.trim()) {
      return this._recipes();
    }
    const term = searchTerm.toLowerCase().trim();
    return this._recipes().filter(recipe => 
      recipe.name.toLowerCase().includes(term) ||
      recipe.descripcion.toLowerCase().includes(term) ||
      recipe.ingredients.some(ing => ing.toLowerCase().includes(term)) ||
      recipe.author.toLowerCase().includes(term)
    );
  }

  getRecipesByAuthor(author: string): Recipe[] {
    return this._recipes().filter(recipe => 
      recipe.author.toLowerCase() === author.toLowerCase()
    );
  }
}