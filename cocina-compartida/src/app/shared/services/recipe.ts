import { Injectable, inject, computed } from '@angular/core';
import { Recipe } from '../interfaces/recipe';
import { RecipeCrudService } from './recipe-crud.service';
import { RecipeInteractionService } from './recipe-interaction.service';
import { RecipeStateService } from './recipe-state.service';
import { Comment as RecipeComment } from '../interfaces/comment';

@Injectable({ 
  providedIn: 'root' 
})
export class RecipeService {
  private crudService = inject(RecipeCrudService);
  private interactionService = inject(RecipeInteractionService);
  private stateService = inject(RecipeStateService);

  recipes = computed(() => this.stateService.recipes());
  loading = computed(() => this.stateService.loading());
  error = computed(() => this.stateService.error());

  constructor() {
    this.crudService.loadRecipes();
  }

  loadRecipes(): Promise<void> {
    return this.crudService.loadRecipes();
  }

  loadTopLikedRecipes(): Promise<Recipe[]> {
    return this.crudService.loadTopLikedRecipes();
  }

  getRecipeById(recipeId: string): Promise<Recipe | null> {
    return this.crudService.getRecipeById(recipeId);
  }

  addRecipe(
    recipeInput: Omit<Recipe, 'id' | 'likes' | 'likedBy' | 'comments' | 'user'> & { images?: string[] }
  ): Promise<Recipe | null> {
    return this.crudService.createRecipe(recipeInput);
  }

  updateRecipe(recipeId: string, changes: Partial<Recipe>): Promise<Recipe | null> {
    return this.crudService.updateRecipe(recipeId, changes);
  }

  deleteRecipe(recipeId: string): Promise<boolean> {
    return this.crudService.deleteRecipe(recipeId);
  }

  toggleLike(recipeId: string): Promise<void> {
    return this.interactionService.toggleLike(recipeId);
  }

  addComment(recipeId: string, comment: { message: string }): Promise<void> {
    return this.interactionService.addComment(recipeId, comment);
  }

  loadComments(recipeId: string): Promise<RecipeComment[]> {
    return this.interactionService.loadComments(recipeId);
  }

  deleteComment(commentId: string): Promise<void> {
    return this.interactionService.deleteComment(commentId);
  }

  canUserDeleteComment(commentAuthorId: string): boolean {
    return this.interactionService.canUserDeleteComment(commentAuthorId);
  }

  isRecipeLikedByCurrentUser(recipeId: string): boolean {
    return this.interactionService.isRecipeLikedByCurrentUser(recipeId);
  }

  getCurrentUserId(): string | null {
    return this.interactionService.getCurrentUserId();
  }

  downloadPDF(recipeId: string): Promise<void> {
    return this.crudService.downloadPDF(recipeId);
  }

  downloadImage(recipeId: string): Promise<void> {
    return this.crudService.downloadImage(recipeId);
  }

  updateAuthorForUser(oldUsername: string, newUsername: string, newAvatar?: string): void {
    this.stateService.updateRecipes(list =>
      list.map(recipe => {
        const currentUsername = recipe.user?.username;
        if (currentUsername !== oldUsername) return recipe;
        
        return {
          ...recipe,
          user: { 
            ...(recipe.user ?? { id: '' }), 
            username: newUsername, 
            avatar: newAvatar ?? recipe.user?.avatar 
          },
        } as Recipe;
      })
    );
  }
}