import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { Home } from '../features/pages/home/home';
import { RecipeService } from '../shared/services/recipe';
import { Auth } from '../shared/services/auth';
import { RecipeInteractionService } from '../shared/services/recipe-interaction.service';
import { Recipe } from '../shared/interfaces/recipe';
import Swal from 'sweetalert2';

// --- Dummy Recipe Factory ---
function dummyRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: 'r1', name: 'Test', descripcion: 'Desc', ingredients: ['a'],
    steps: ['s1'], images: ['img.jpg'], user: { id: 'u1', username: 'chef' },
    category: 'postres', likes: 0, likedBy: [], comments: [],
    ...overrides
  };
}

describe('Home Component', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;
  let mockRouter: jasmine.SpyObj<Router>;
  // Fake signal for recipes
  const recipesSignal = signal<Recipe[]>([]);
  let mockRecipeService: any;
  let mockAuth: any;
  let mockInteraction: any;

  beforeEach(async () => {
    // Arrange — Stubs & Spies
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockRouter.navigate.and.returnValue(Promise.resolve(true));

    mockRecipeService = { recipes: recipesSignal };

    // Fake isLoged signal
    const isLogedSignal = signal(false);
    mockAuth = {
      isLoged: isLogedSignal,
      getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue(null),
      currentUser: signal(null),
      currentUsername: signal(''),
      verifyLoggedUser: jasmine.createSpy('verifyLoggedUser')
    };

    mockInteraction = {
      toggleLike: jasmine.createSpy('toggleLike').and.returnValue(Promise.resolve())
    };

    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: false, isDenied: false, isDismissed: true } as any));

    await TestBed.configureTestingModule({
      imports: [Home, CommonModule],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: RecipeService, useValue: mockRecipeService },
        { provide: Auth, useValue: mockAuth },
        { provide: RecipeInteractionService, useValue: mockInteraction }
      ]
    }).overrideComponent(Home, {
      set: { template: '<div></div>', imports: [CommonModule] }
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    recipesSignal.set([]);
    fixture.detectChanges();
  });

  // HM-01: featuredRecipes devuelve top 3 ordenado por likes descendente
  it('HM-01: featuredRecipes returns top 3 by likes descending', () => {
    // Arrange
    recipesSignal.set([
      dummyRecipe({ id: 'a', likes: 10 }),
      dummyRecipe({ id: 'b', likes: 50 }),
      dummyRecipe({ id: 'c', likes: 30 }),
      dummyRecipe({ id: 'd', likes: 90 }),
      dummyRecipe({ id: 'e', likes: 5 })
    ]);

    // Act
    const result = component.featuredRecipes;

    // Assert
    expect(result.length).toBe(3);
    expect(result[0].id).toBe('d');
    expect(result[1].id).toBe('b');
    expect(result[2].id).toBe('c');
  });

  // HM-02: featuredRecipes con NaN likes los trata como 0
  it('HM-02: featuredRecipes treats NaN likes as 0', () => {
    // Arrange
    recipesSignal.set([
      dummyRecipe({ id: 'a', likes: NaN }),
      dummyRecipe({ id: 'b', likes: 20 })
    ]);

    // Act
    const result = component.featuredRecipes;

    // Assert
    expect(result[0].id).toBe('b');
  });

  // HM-03: trackByRecipeId devuelve el id
  it('HM-03: trackByRecipeId returns recipe id', () => {
    // Arrange
    const recipe = { id: 'recipe-123' };

    // Act
    const result = component.trackByRecipeId(0, recipe);

    // Assert
    expect(result).toBe('recipe-123' as any);
  });

  // HM-04: navigateToExplore navega a /explore
  it('HM-04: navigateToExplore navigates to /explore', () => {
    // Act
    component.navigateToExplore();

    // Assert
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/explore']);
  });

  // HM-05: checkAuthAndNavigate cuando está logueado va a /recipe-upload
  it('HM-05: checkAuthAndNavigate when logged navigates to /recipe-upload', () => {
    // Arrange
    (mockAuth.isLoged as any).set(true);

    // Act
    component.checkAuthAndNavigate();

    // Assert
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/recipe-upload']);
  });

  // HM-06: checkAuthAndNavigate cuando no está logueado muestra Swal
  it('HM-06: checkAuthAndNavigate when not logged shows Swal warning', () => {
    // Arrange
    (mockAuth.isLoged as any).set(false);

    // Act
    component.checkAuthAndNavigate();

    // Assert
    expect(Swal.fire).toHaveBeenCalled();
  });

  // HM-07: toggleLike cuando no está logueado muestra Swal y no llama toggleLike
  it('HM-07: toggleLike when not logged shows Swal warning', async () => {
    // Arrange
    (mockAuth.isLoged as any).set(false);
    const recipe = dummyRecipe();

    // Act
    await component.toggleLike(recipe);

    // Assert
    expect(Swal.fire).toHaveBeenCalled();
    expect(mockInteraction.toggleLike).not.toHaveBeenCalled();
  });
});
