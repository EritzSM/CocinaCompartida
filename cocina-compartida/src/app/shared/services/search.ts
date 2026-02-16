import { Injectable, signal } from '@angular/core';
import { Recipe } from '../interfaces/recipe';
import { RecipeService } from './recipe';
import { inject } from '@angular/core';

export type SortOption = 'recent' | 'oldest' | 'likes';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private recipeService = inject(RecipeService);
  
  private searchResults = signal<Recipe[]>([]);
  private sortBy = signal<SortOption>('recent');
  private searchQuery = signal<string>('');

  readonly results = this.searchResults.asReadonly();
  readonly currentSort = this.sortBy.asReadonly();
  readonly currentQuery = this.searchQuery.asReadonly();

  search(query: string) {
    this.searchQuery.set(query);
    this.updateResults();
  }

  setSortOption(option: SortOption) {
    this.sortBy.set(option);
    this.updateResults();
  }

  private updateResults() {
    const query = this.searchQuery().toLowerCase();
    let results = this.recipeService.recipes().filter(recipe => 
      recipe.name.toLowerCase().includes(query) || 
      recipe.descripcion.toLowerCase().includes(query)
    );

    results = this.sortResults(results);
    this.searchResults.set(results);
  }

  private sortResults(recipes: Recipe[]): Recipe[] {
    switch (this.sortBy()) {
      case 'recent':
        return [...recipes].sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
      case 'oldest':
        return [...recipes].sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateA - dateB;
        });
      case 'likes':
        return [...recipes].sort((a, b) => {
          const likesA = a.likes ?? 0;
          const likesB = b.likes ?? 0;
          return likesB - likesA;
        });
      default:
        return recipes;
    }
  }
}