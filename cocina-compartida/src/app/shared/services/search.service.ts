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
  private searchSuggestions = signal<Recipe[]>([]);
  private sortBy = signal<SortOption>('recent');
  private searchQuery = signal<string>('');
  private categoryFilter = signal<string>('todas');

  // Expone las señales como solo lectura
  readonly results = this.searchResults.asReadonly();
  readonly suggestions = this.searchSuggestions.asReadonly();
  readonly currentSort = this.sortBy.asReadonly();
  readonly currentQuery = this.searchQuery.asReadonly();
  readonly currentCategory = this.categoryFilter.asReadonly();

  search(query: string) {
    this.searchQuery.set(query);
    this.updateSuggestions(query);
    this.updateResults();
  }

  private updateSuggestions(query: string) {
    if (!query.trim()) {
      this.searchSuggestions.set([]);
      return;
    }

    const queryLower = query.toLowerCase();
    const allRecipes = this.recipeService.recipes();

    // Filtrar por categoría primero si está aplicada
    let filteredRecipes = allRecipes;
    if (this.categoryFilter() !== 'todas') {
      filteredRecipes = allRecipes.filter(recipe => recipe.category === this.categoryFilter());
    }

    // Buscar sugerencias basadas en similitud
    const suggestions = filteredRecipes
      .filter(recipe => {
        const name = recipe.name.toLowerCase();
        const description = recipe.descripcion.toLowerCase();

        // Coincidencias más relevantes
        return name.includes(queryLower) ||
               description.includes(queryLower) ||
               name.startsWith(queryLower) ||
               this.calculateSimilarity(name, queryLower) > 0.6 ||
               this.calculateSimilarity(description, queryLower) > 0.6;
      })
      .map(recipe => ({
        recipe,
        relevance: this.calculateRelevance(recipe, query)
      }))
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 5) // Máximo 5 sugerencias
      .map(item => item.recipe);

    this.searchSuggestions.set(suggestions);
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
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

  clearFilters() {
    this.categoryFilter.set('todas');
    this.searchQuery.set('');
    this.sortBy.set('recent');
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