import { TestBed } from '@angular/core/testing';
import { Header } from '../shared/components/header/header';
import { Auth } from '../shared/services/auth';
import { SearchService, SortOption } from '../shared/services/search.service';
import { Router } from '@angular/router';
import { Recipe } from '../shared/interfaces/recipe';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component } from '@angular/core';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  HEADER COMPONENT – Pruebas Unitarias (Patrón AAA)
//  Funcionalidad: Búsqueda, categorías, sugerencias, navegación teclado
//
//  Tipos de Mocks:
//  1. Spy      – Verificación de llamadas a navigate, search
//  2. Stub     – Retornos fijos de auth
//  3. Mock     – SearchService completo
//  4. Dummy    – Receta de prueba para sugerencias
//  5. Fake     – Signal fakes para SearchService
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// --- Dummy ---
const DUMMY_RECIPE: Recipe = {
  id: 'r1', name: 'Paella', descripcion: 'Arroz',
  ingredients: ['a'], steps: ['b'], images: ['c'],
  category: 'platos-fuertes', user: { id: 'u1', username: 'chef' },
  likes: 5, likedBy: [], comments: []
};

describe('Header Component – Pruebas Unitarias', () => {
  let component: Header;
  let mockRouter: any;
  let mockSearchService: any;
  let mockAuthService: any;

  // Fake signal helper
  function fakeSignal<T>(val: T) {
    let v = val;
    const fn = () => v;
    fn.set = (newVal: T) => { v = newVal; };
    fn.update = (updater: (v: T) => T) => { v = updater(v); };
    fn.asReadonly = () => fn;
    return fn;
  }

  beforeEach(() => {
    // Test Double (Spy): Router
    mockRouter = { navigate: jasmine.createSpy('navigate') };

    // Test Double (Fake): SearchService con signals fake
    mockSearchService = {
      results: fakeSignal<Recipe[]>([]),
      suggestions: fakeSignal<Recipe[]>([DUMMY_RECIPE]),
      currentSort: fakeSignal<SortOption>('recent'),
      currentQuery: fakeSignal(''),
      currentCategory: fakeSignal('todas'),
      search: jasmine.createSpy('search'),
      clearFilters: jasmine.createSpy('clearFilters'),
      filterByCategory: jasmine.createSpy('filterByCategory'),
      setSortOption: jasmine.createSpy('setSortOption')
    };

    // Test Double (Stub): Auth
    mockAuthService = {
      isLoged: fakeSignal(true),
      currentUsername: fakeSignal('testuser'),
      currentUser: fakeSignal({ id: 'u1', username: 'testuser' }),
      getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue({ id: 'u1' }),
      logout: jasmine.createSpy('logout')
    };

    TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: SearchService, useValue: mockSearchService },
        { provide: Auth, useValue: mockAuthService }
      ]
    }).overrideComponent(Header, {
      set: {
        template: '<div></div>',  // Override template to avoid templateUrl resolution
        imports: [CommonModule, FormsModule]
      }
    });

    const fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
  });

  // ──────────── HD-01: goToLogin ────────────
  describe('goToLogin', () => {
    it('HD-01: navega a /login (Spy)', () => {
      // Act
      component.goToLogin();

      // Assert
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  // ──────────── HD-02: onSearch ────────────
  describe('onSearch', () => {
    it('HD-02: oculta sugerencias y llama search (Spy)', () => {
      // Arrange
      component.searchQuery = 'paella';

      // Act
      component.onSearch();

      // Assert
      expect(component.showSuggestions()).toBeFalse();
      expect(component.selectedSuggestionIndex()).toBe(-1);
      expect(mockSearchService.search).toHaveBeenCalledWith('paella');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/explore']);
    });
  });

  // ──────────── HD-03 a HD-04: onSearchInput ────────────
  describe('onSearchInput', () => {
    it('HD-03: con query no vacío activa búsqueda y sugerencias (Spy)', () => {
      // Arrange
      component.searchQuery = 'taco';

      // Act
      component.onSearchInput();

      // Assert
      expect(mockSearchService.search).toHaveBeenCalledWith('taco');
      expect(component.showSuggestions()).toBeTrue();
    });

    it('HD-04: con query vacío oculta sugerencias (Stub)', () => {
      // Arrange
      component.searchQuery = '   ';

      // Act
      component.onSearchInput();

      // Assert
      expect(component.showSuggestions()).toBeFalse();
      expect(component.selectedSuggestionIndex()).toBe(-1);
    });
  });

  // ──────────── HD-05: selectSuggestion ────────────
  describe('selectSuggestion', () => {
    it('HD-05: establece query con nombre de receta y ejecuta búsqueda (Mock)', () => {
      // Arrange
      const recipe = { ...DUMMY_RECIPE, name: 'Tacos al Pastor' };

      // Act
      component.selectSuggestion(recipe);

      // Assert
      expect(component.searchQuery).toBe('Tacos al Pastor');
      expect(component.showSuggestions()).toBeFalse();
      expect(mockSearchService.search).toHaveBeenCalledWith('Tacos al Pastor');
    });
  });

  // ──────────── HD-06 a HD-14: onKeyDown ────────────
  describe('onKeyDown', () => {
    it('HD-06: ArrowDown incrementa selectedSuggestionIndex (Fake)', () => {
      // Arrange
      component.showSuggestions.set(true);
      component.selectedSuggestionIndex.set(-1);
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      spyOn(event, 'preventDefault');

      // Act
      component.onKeyDown(event);

      // Assert
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.selectedSuggestionIndex()).toBe(0);
    });

    it('HD-07: ArrowDown al final wraps a 0', () => {
      // Arrange
      component.showSuggestions.set(true);
      component.selectedSuggestionIndex.set(0); // última posición (solo 1 sugerencia)
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      spyOn(event, 'preventDefault');

      // Act
      component.onKeyDown(event);

      // Assert
      expect(component.selectedSuggestionIndex()).toBe(0);
    });

    it('HD-08: ArrowUp decrementa selectedSuggestionIndex (Fake)', () => {
      // Arrange
      component.showSuggestions.set(true);
      component.selectedSuggestionIndex.set(0);
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      spyOn(event, 'preventDefault');

      // Act
      component.onKeyDown(event);

      // Assert
      expect(event.preventDefault).toHaveBeenCalled();
      // Con 1 sugerencia: index 0 > 0 es false, así que va a length-1 = 0
      expect(component.selectedSuggestionIndex()).toBe(0);
    });

    it('HD-09: Enter con sugerencia seleccionada selecciona esa sugerencia (Spy)', () => {
      // Arrange
      component.showSuggestions.set(true);
      component.selectedSuggestionIndex.set(0);
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      spyOn(event, 'preventDefault');

      // Act
      component.onKeyDown(event);

      // Assert
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.searchQuery).toBe('Paella');
    });

    it('HD-10: Enter sin sugerencia seleccionada ejecuta onSearch (Spy)', () => {
      // Arrange
      component.showSuggestions.set(true);
      component.selectedSuggestionIndex.set(-1);
      component.searchQuery = 'test';
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      spyOn(event, 'preventDefault');

      // Act
      component.onKeyDown(event);

      // Assert
      expect(mockSearchService.search).toHaveBeenCalledWith('test');
    });

    it('HD-11: Escape oculta sugerencias', () => {
      // Arrange
      component.showSuggestions.set(true);
      component.selectedSuggestionIndex.set(0);
      const event = new KeyboardEvent('keydown', { key: 'Escape' });

      // Act
      component.onKeyDown(event);

      // Assert
      expect(component.showSuggestions()).toBeFalse();
      expect(component.selectedSuggestionIndex()).toBe(-1);
    });

    it('HD-12: Enter sin sugerencias visibles ejecuta onSearch (Stub)', () => {
      // Arrange
      component.showSuggestions.set(false);
      component.searchQuery = 'xyz';
      const event = new KeyboardEvent('keydown', { key: 'Enter' });

      // Act
      component.onKeyDown(event);

      // Assert
      expect(mockSearchService.search).toHaveBeenCalledWith('xyz');
    });

    it('HD-13: tecla con sugerencias vacías no navega arrows', () => {
      // Arrange
      component.showSuggestions.set(true);
      mockSearchService.suggestions = fakeSignal<Recipe[]>([]);
      component.searchQuery = 'xyz';
      const event = new KeyboardEvent('keydown', { key: 'Enter' });

      // Act
      component.onKeyDown(event);

      // Assert - falls through to onSearch since suggestions empty
      expect(mockSearchService.search).toHaveBeenCalledWith('xyz');
    });
  });

  // ──────────── HD-14: hideSuggestions ────────────
  describe('hideSuggestions', () => {
    it('HD-14: oculta sugerencias después de delay (Spy)', (done) => {
      // Arrange
      component.showSuggestions.set(true);
      component.selectedSuggestionIndex.set(2);

      // Act
      component.hideSuggestions();

      // Assert - after 150ms delay
      setTimeout(() => {
        expect(component.showSuggestions()).toBeFalse();
        expect(component.selectedSuggestionIndex()).toBe(-1);
        done();
      }, 200);
    });
  });

  // ──────────── HD-15: onCategoryChange ────────────
  describe('onCategoryChange', () => {
    it('HD-15: establece categoría y navega a /explore (Spy)', () => {
      // Act
      component.onCategoryChange('postres');

      // Assert
      expect(component.selectedCategory).toBe('postres');
      expect(mockSearchService.filterByCategory).toHaveBeenCalledWith('postres');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/explore']);
    });
  });

  // ──────────── HD-16: onSortChange ────────────
  describe('onSortChange', () => {
    it('HD-16: establece sort y navega a /explore (Spy)', () => {
      // Arrange
      component.sortOption = 'likes';

      // Act
      component.onSortChange();

      // Assert
      expect(mockSearchService.setSortOption).toHaveBeenCalledWith('likes');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/explore']);
    });
  });

  // ──────────── HD-17: categories ────────────
  describe('categories', () => {
    it('HD-17: contiene 6 categorías incluyendo "todas" (Dummy)', () => {
      // Assert
      expect(component.categories.length).toBe(6);
      expect(component.categories[0].id).toBe('todas');
      expect(component.categories.some(c => c.id === 'postres')).toBeTrue();
    });
  });
});
