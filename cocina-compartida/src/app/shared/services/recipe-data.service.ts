import { Injectable, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RecipeService } from './recipe';
import { Auth } from './auth';
import { v4 as uuidv4 } from 'uuid';
import { Recipe } from '../interfaces/recipe';

@Injectable({
  providedIn: 'root'
})
export class RecipeDataService {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(Auth);
  private recipeService = inject(RecipeService);

  isEditMode = false;
  recipeIdToEdit: string | null = null;
  recipeId: string = uuidv4();

  initializeEditMode(callback: (success: boolean) => void): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (!id) return;

      this.isEditMode = true;
      this.recipeIdToEdit = id;
      this.recipeId = id;
      
      const recipe = this.recipeService.recipes().find(r => r.id === id);
      if (!recipe) {
        callback(false);
        return;
      }

      const currentUser = this.authService.getUserProfile();
      const userId = currentUser?.id || '';
      
      if (recipe.user.id !== userId) {
        callback(false);
        return;
      }

      callback(true);
    });
  }

  getRecipeForEdit(): Recipe | null {
    if (!this.recipeIdToEdit) return null;
    return this.recipeService.recipes().find(r => r.id === this.recipeIdToEdit) || null;
  }

  createRecipeObject(formData: any, images: string[]): Recipe {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }

    return {
      id: this.recipeId,
      ...formData,
      user: {
        id: currentUser.id,
        username: currentUser.username,
        avatar: currentUser.avatar
      }
    } as Recipe;
  }

  saveRecipe(formData: any, images: string[]): void {
    if (this.isEditMode && this.recipeIdToEdit) {
      this.recipeService.updateRecipe(this.recipeIdToEdit, formData);
      this.router.navigate(['/recipe', this.recipeIdToEdit]);
    } else {
      const recipe = this.createRecipeObject(formData, images);
      this.recipeService.addRecipe(recipe);
      this.router.navigate(['home']);
    }
  }

  resetRecipeId(): void {
    this.recipeId = uuidv4();
  }
}