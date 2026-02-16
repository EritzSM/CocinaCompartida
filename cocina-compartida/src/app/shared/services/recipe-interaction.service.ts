import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Auth } from './auth';
import { Comment as RecipeComment } from '../interfaces/comment';
import { RecipeStateService } from './recipe-state.service';
import { Recipe } from '../interfaces/recipe';

@Injectable({
  providedIn: 'root'
})
export class RecipeInteractionService {
  private http = inject(HttpClient);
  private auth = inject(Auth);
  private state = inject(RecipeStateService);


  async toggleLike(recipeId: string): Promise<void> {
    const userId = this.auth.getCurrentUser()?.id;
    if (!userId) return;

    const previousState = this.state.recipes();
    this.applyOptimisticLike(recipeId, userId);

    try {
      const response = await firstValueFrom(
        this.http.post<{ likes: number; likedBy: string[] }>(
          this.state.getRecipeLikeUrl(recipeId),
          {},
          this.state.getAuthOptions()
        )
      );

      if (this.isValidLikeResponse(response)) {
        this.updateRecipeLikes(recipeId, response.likes, response.likedBy);
      }
    } catch (error) {
      console.error('toggleLike error', error);
      this.state.rollbackRecipes(previousState);
      this.state.setError('No se pudo actualizar el like');
    }
  }

  private applyOptimisticLike(recipeId: string, userId: string): void {
    this.state.updateRecipes(list =>
      list.map(recipe => {
        if (recipe.id !== recipeId) return recipe;
        
        const likedBy = recipe.likedBy ?? [];
        const hasLiked = likedBy.includes(userId);
        const newLikedBy = hasLiked 
          ? likedBy.filter(id => id !== userId) 
          : [...likedBy, userId];
        
        return { 
          ...recipe, 
          likedBy: newLikedBy, 
          likes: newLikedBy.length 
        } as Recipe;
      })
    );
  }

  private updateRecipeLikes(recipeId: string, likes: number, likedBy: string[]): void {
    this.state.updateRecipes(list =>
      list.map(r => 
        r.id === recipeId ? { ...r, likes, likedBy } : r
      )
    );
  }

  private isValidLikeResponse(response: any): response is { likes: number; likedBy: string[] } {
    return response && 
           typeof response.likes === 'number' && 
           Array.isArray(response.likedBy);
  }

  async addComment(recipeId: string, comment: { message: string }): Promise<void> {
    try {
      const created = await firstValueFrom(
        this.http.post<RecipeComment>(
          this.state.getRecipeCommentsUrl(recipeId),
          comment,
          this.state.getAuthOptions()
        )
      );

      this.updateRecipeComments(recipeId, currentComments => [...currentComments, created]);
    } catch (error) {
      console.error('addComment error', error);
      this.state.setError('No se pudo agregar el comentario');
    }
  }

  async loadComments(recipeId: string): Promise<RecipeComment[]> {
    try {
      return await firstValueFrom(
        this.http.get<RecipeComment[]>(this.state.getRecipeCommentsUrl(recipeId))
      );
    } catch (error) {
      console.error('loadComments error', error);
      return [];
    }
  }

  async deleteComment(commentId: string): Promise<void> {
    const previousState = this.state.recipes();
    
    try {
      await firstValueFrom(
        this.http.delete<void>(
          this.state.getCommentUrl(commentId),
          this.state.getAuthOptions()
        )
      );

      this.removeCommentFromAllRecipes(commentId);
    } catch (error) {
      console.error('deleteComment error', error);
      this.state.rollbackRecipes(previousState);
      this.state.setError('No se pudo eliminar el comentario');
    }
  }

  private updateRecipeComments(
    recipeId: string, 
    updater: (comments: RecipeComment[]) => RecipeComment[]
  ): void {
    this.state.updateRecipes(list =>
      list.map(r => {
        if (r.id !== recipeId) return r;
        const currentComments = r.comments || [];
        return { ...r, comments: updater(currentComments) } as Recipe;
      })
    );
  }

  private removeCommentFromAllRecipes(commentId: string): void {
    this.state.updateRecipes(list =>
      list.map(r => ({
        ...r,
        comments: (r.comments || []).filter(c => c.id !== commentId),
      } as Recipe))
    );
  }

  canUserDeleteComment(commentAuthorId: string): boolean {
    const currentUser = this.auth.getCurrentUser();
    return currentUser?.id === commentAuthorId;
  }

  isRecipeLikedByCurrentUser(recipeId: string): boolean {
    const currentUser = this.auth.getCurrentUser();
    if (!currentUser) return false;
    
    const recipe = this.state.getRecipeById(recipeId);
    return recipe?.likedBy?.includes(currentUser.id) || false;
  }

  getCurrentUserId(): string | null {
    return this.auth.getCurrentUser()?.id || null;
  }
}