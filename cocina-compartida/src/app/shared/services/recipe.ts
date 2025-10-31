import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Recipe } from '../interfaces/recipe';
import { Auth } from './auth';
import { Comment as RecipeComment } from '../interfaces/comment';

@Injectable({ providedIn: 'root' })
export class RecipeService {
  private http = inject(HttpClient);
  private auth = inject(Auth);

  // ===== Config (sin /api/v1) =====
  private readonly BASE_URL = 'http://localhost:3000';
  private readonly RECIPES = `${this.BASE_URL}/recipes`;



  // ===== State =====
  private _recipes = signal<Recipe[]>([]);
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);

  // ===== Selectores =====
  recipes = computed(() => this._recipes());
  loading = computed(() => this._loading());
  error = computed(() => this._error());

  constructor() {
    this.loadRecipes();
  }

  // ===== CRUD =====
  async loadRecipes(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const data = await firstValueFrom(
        this.http.get<Recipe[]>(this.RECIPES)
      );
      this._recipes.set(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('loadRecipes error', e);
      this._error.set('No se pudieron cargar las recetas');
    } finally {
      this._loading.set(false);
    }
  }

  async addRecipe(
    recipeInput: Omit<Recipe, 'id' | 'likes' | 'likedBy' | 'comments'> & { images?: string[] }
  ): Promise<Recipe | null> {
    try {
      const created = await firstValueFrom(
        this.http.post<Recipe>(this.RECIPES, recipeInput)
      );
      this._recipes.update(list => [created, ...list]);
      return created;
    } catch (e) {
      console.error('addRecipe error', e);
      this._error.set('No se pudo crear la receta');
      return null;
    }
  }

  async updateRecipe(recipeId: string, changes: Partial<Recipe>): Promise<Recipe | null> {
    // Optimistic update + rollback
    const prev = this._recipes();
    this._recipes.update(list => list.map(r => (r.id === recipeId ? { ...r, ...changes } as Recipe : r)));

    try {
      const updated = await firstValueFrom(
        this.http.patch<Recipe>(`${this.RECIPES}/${recipeId}`, changes)
      );
      this._recipes.update(list => list.map(r => (r.id === recipeId ? updated : r)));
      return updated;
    } catch (e) {
      console.error('updateRecipe error', e);
      this._recipes.set(prev); // rollback
      this._error.set('No se pudo actualizar la receta');
      return null;
    }
  }

  async deleteRecipe(recipeId: string): Promise<boolean> {
    // Optimistic delete + rollback
    const prev = this._recipes();
    this._recipes.update(list => list.filter(r => r.id !== recipeId));

    try {
      await firstValueFrom(
        this.http.delete<void>(`${this.RECIPES}/${recipeId}`)
      );
      return true;
    } catch (e) {
      console.error('deleteRecipe error', e);
      this._recipes.set(prev); // rollback
      this._error.set('No se pudo eliminar la receta');
      return false;
    }
  }

  // ===== Like por PATCH /recipes/:id (no existe /like en tu backend) =====
  async toggleLike(recipeId: string): Promise<void> {
    const userId = this.auth.getCurrentUser()?.id;
    if (!userId) return;

    // Optimistic
    const prev = this._recipes();
    this._recipes.update(list =>
      list.map(recipe => {
        if (recipe.id !== recipeId) return recipe;
        const likedBy = recipe.likedBy ?? [];
        const hasLiked = likedBy.includes(userId);
        const newLikedBy = hasLiked ? likedBy.filter(id => id !== userId) : [...likedBy, userId];
        return { ...recipe, likedBy: newLikedBy, likes: newLikedBy.length } as Recipe;
      })
    );

    try {
      // Convención: PATCH con operación semántica
      const payload = { op: 'toggleLike' };
      const updated = await firstValueFrom(
        this.http.patch<Recipe>(`${this.RECIPES}/${recipeId}`, payload)
      );

      // Sincroniza con respuesta del backend (likes/likedBy definitivos)
      this._recipes.update(list => list.map(r => (r.id === recipeId ? updated : r)));
    } catch (e) {
      console.error('toggleLike error', e);
      this._recipes.set(prev); // rollback
      this._error.set('No se pudo actualizar el like');
    }
  }

  // ===== Comentarios por PATCH /recipes/:id (no existe /comments en tu backend) =====
  async addComment(recipeId: string, comment: { text: string }): Promise<void> {
    const prev = this._recipes();
    const currentUser = this.auth.getCurrentUser();
    if (!currentUser?.id) return;

    try {
      // Convención: PATCH con operación semántica
      const payload = { op: 'addComment', data: comment };
      const updated = await firstValueFrom(
        this.http.patch<Recipe>(`${this.RECIPES}/${recipeId}`, payload)
      );

      // Reemplaza la receta con la versión actualizada (que ya incluye el comentario)
      this._recipes.update(list => list.map(r => (r.id === recipeId ? updated : r)));
    } catch (e) {
      console.error('addComment error', e);
      this._recipes.set(prev); // rollback
      this._error.set('No se pudo agregar el comentario');
    }
  }

  // Solo front (compatibilidad)
  updateAuthorForUser(oldUsername: string, newUsername: string, newAvatar?: string): void {
    this._recipes.update(list =>
      list.map(recipe =>
        recipe.author !== oldUsername
          ? recipe
          : { ...recipe, author: newUsername, avatar: newAvatar ?? recipe.avatar } as Recipe
      )
    );
  }
}
