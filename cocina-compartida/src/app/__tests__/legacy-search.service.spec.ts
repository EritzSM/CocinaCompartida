import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { SearchService } from '../shared/services/search';
import { RecipeService } from '../shared/services/recipe';
import { Recipe } from '../shared/interfaces/recipe';

function recipe(overrides: Partial<Recipe>): Recipe {
  return {
    id: 'r1',
    name: 'Base',
    descripcion: 'Descripcion',
    ingredients: [],
    steps: [],
    images: [],
    category: 'postres',
    user: { id: 'u1', username: 'chef' },
    likes: 0,
    likedBy: [],
    comments: [],
    ...overrides,
  };
}

describe('Legacy SearchService', () => {
  let service: SearchService;
  const recipes = signal<Recipe[]>([]);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SearchService,
        { provide: RecipeService, useValue: { recipes } },
      ],
    });

    recipes.set([
      recipe({ id: 'a', name: 'Arepa', descripcion: 'Maiz', likes: 3, createdAt: '2026-01-01T00:00:00Z' }),
      recipe({ id: 'b', name: 'Brownie', descripcion: 'Chocolate', likes: 8, createdAt: '2026-02-01T00:00:00Z' }),
      recipe({ id: 'c', name: 'Ceviche', descripcion: 'Pescado fresco', likes: 5, createdAt: '2025-12-01T00:00:00Z' }),
    ]);
    service = TestBed.inject(SearchService);
  });

  it('LS-01: filtra por nombre o descripcion', () => {
    service.search('chocolate');

    expect(service.results().map(r => r.id)).toEqual(['b']);
  });

  it('LS-02: ordena por recientes', () => {
    service.search('');
    service.setSortOption('recent');

    expect(service.results().map(r => r.id)).toEqual(['b', 'a', 'c']);
  });

  it('LS-03: ordena por antiguos', () => {
    service.search('');
    service.setSortOption('oldest');

    expect(service.results().map(r => r.id)).toEqual(['c', 'a', 'b']);
  });

  it('LS-04: ordena por likes', () => {
    service.search('');
    service.setSortOption('likes');

    expect(service.results().map(r => r.id)).toEqual(['b', 'c', 'a']);
  });
});
