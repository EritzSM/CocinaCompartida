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
  private categoryFilter = signal<string>('todas');

  // Expone las señales como solo lectura
  readonly results = this.searchResults.asReadonly();
  readonly currentSort = this.sortBy.asReadonly();
  readonly currentQuery = this.searchQuery.asReadonly();
  readonly currentCategory = this.categoryFilter.asReadonly();

  search(query: string) {
    this.searchQuery.set(query);
    this.updateResults();
  }

  setSortOption(option: SortOption) {
    this.sortBy.set(option);
    this.updateResults();
  }

  private calculateRelevance(recipe: Recipe, query: string): number {
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    if (searchTerms.length === 0) return 0;

    let relevance = 0;
    const name = recipe.name.toLowerCase();
    const description = recipe.descripcion.toLowerCase();

    for (const term of searchTerms) {
      // Coincidencia exacta en el nombre (más peso)
      if (name === term) relevance += 10;
      // Coincidencia al inicio del nombre
      if (name.startsWith(term)) relevance += 8;
      // Coincidencia en cualquier parte del nombre
      if (name.includes(term)) relevance += 5;
      
      // Coincidencia en la descripción
      if (description.includes(term)) relevance += 3;
      
      // Coincidencia en palabras completas
      const nameWords = name.split(' ');
      if (nameWords.includes(term)) relevance += 4;
    }

    return relevance;
  }

  filterByCategory(category: string) {
    this.categoryFilter.set(category);
    this.updateResults();
  }

  private updateResults() {
    const query = this.searchQuery().toLowerCase();
    const category = this.categoryFilter();
    
    // Primero filtramos por categoría si es necesario
    let results = this.recipeService.recipes();
    if (category !== 'todas') {
      results = results.filter(recipe => recipe.category === category);
    }

    // Si no hay búsqueda, solo aplicamos el ordenamiento
    if (!query) {
      this.searchResults.set(this.sortResults(results));
      return;
    }

    // Si hay búsqueda, aplicamos filtro de búsqueda
    results = results
      .filter(recipe => 
        recipe.name.toLowerCase().includes(query) || 
        recipe.descripcion.toLowerCase().includes(query)
      )
      .map(recipe => ({
        recipe,
        relevance: this.calculateRelevance(recipe, query)
      }))
      .sort((a, b) => b.relevance - a.relevance)
      .map(item => item.recipe);

    // Aplicar ordenamiento secundario si está seleccionado
    if (this.sortBy() !== 'recent') {
      results = this.sortResults(results);
    }

    this.searchResults.set(results);
  }

  private sortResults(recipes: Recipe[]): Recipe[] {
    switch (this.sortBy()) {
      case 'recent':
        return [...recipes].sort((a, b) => b.id.localeCompare(a.id));
      case 'oldest':
        return [...recipes].sort((a, b) => a.id.localeCompare(b.id));
      case 'likes':
        return [...recipes].sort((a, b) => (b.likes || 0) - (a.likes || 0));
      default:
        return recipes;
    }
  }
}