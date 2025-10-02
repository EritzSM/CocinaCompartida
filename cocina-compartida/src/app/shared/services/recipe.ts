// En: recipe.ts (o donde tengas tu RecipeService)

import { Injectable, signal, effect } from '@angular/core';

export interface Recipe {
  name: string;
  descripcion: string;
  ingredients: string[];
  steps: string[];
  images: string[];
  author: string;
  avatar: string;
}

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  // 1. Definimos una clave para guardar en localStorage
  private readonly STORAGE_KEY = 'my_recipes';

  // 2. Al iniciar, intentamos cargar las recetas desde localStorage
  private _recipes = signal<Recipe[]>(this.loadRecipesFromStorage());

  // El getter público no cambia
  get recipes() {
    return this._recipes.asReadonly();
  }

  constructor() {
    // 3. (Opcional pero recomendado) Usamos un 'effect' para guardar automáticamente
    // cada vez que la señal _recipes cambie.
    effect(() => {
      this.saveRecipesToStorage(this._recipes());
    });
  }

  addRecipe(recipe: Recipe) {
    this._recipes.update((list) => [...list, recipe]);
  }
  
  // Función privada para cargar desde localStorage
  private loadRecipesFromStorage(): Recipe[] {
    try {
      const storedRecipes = localStorage.getItem(this.STORAGE_KEY);
      return storedRecipes ? JSON.parse(storedRecipes) : [];
    } catch (e) {
      console.error("Error loading recipes from localStorage", e);
      return []; // Devuelve un array vacío si hay un error
    }
  }

  // Función privada para guardar en localStorage
  private saveRecipesToStorage(recipes: Recipe[]) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recipes));
    } catch (e) {
      console.error("Error saving recipes to localStorage", e);
    }
  }
}