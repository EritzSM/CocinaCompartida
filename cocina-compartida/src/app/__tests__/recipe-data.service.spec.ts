import { TestBed } from '@angular/core/testing';
import { RecipeDataService } from '../shared/services/recipe-data.service';
import { RecipeService } from '../shared/services/recipe';
import { Auth } from '../shared/services/auth';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { Recipe } from '../shared/interfaces/recipe';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  RECIPE DATA SERVICE – Pruebas Unitarias (Patrón AAA)
//  Funcionalidad: Gestión de datos de recetas, modo edición
//
//  Tipos de Mocks:
//  1. Spy      – Verificar navigate, addRecipe, updateRecipe
//  2. Stub     – Retornos fijos de auth/recipes
//  3. Mock     – RecipeService, Auth
//  4. Dummy    – Datos de receta y usuario
//  5. Fake     – Signal fake para recipes(), Subject para params
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// --- Dummy ---
const DUMMY_RECIPE: Recipe = {
  id: 'r1', name: 'Test', descripcion: 'Desc',
  ingredients: ['a'], steps: ['b'], images: ['img.jpg'],
  category: 'Cat', user: { id: 'u1', username: 'chef' },
  likes: 5, likedBy: [], comments: []
};

describe('RecipeDataService – Pruebas Unitarias', () => {
  let service: RecipeDataService;
  let mockRecipeService: any;
  let mockAuthService: any;
  let mockRouter: any;
  let paramsSubject: Subject<any>;

  // Fake signal
  function fakeSignal<T>(val: T) {
    let v = val;
    const fn = () => v;
    fn.set = (newVal: T) => { v = newVal; };
    return fn;
  }

  beforeEach(() => {
    paramsSubject = new Subject<any>();

    // Test Double (Fake): señal de recetas
    const recipesSignal = fakeSignal<Recipe[]>([DUMMY_RECIPE]);

    // Test Double (Mock): RecipeService
    mockRecipeService = {
      recipes: recipesSignal,
      addRecipe: jasmine.createSpy('addRecipe'),
      updateRecipe: jasmine.createSpy('updateRecipe')
    };

    // Test Double (Stub): Auth
    mockAuthService = {
      getUserProfile: jasmine.createSpy('getUserProfile').and.returnValue({ id: 'u1', username: 'chef' }),
      getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue({ id: 'u1', username: 'chef', avatar: 'av.jpg' })
    };

    // Test Double (Spy): Router
    mockRouter = { navigate: jasmine.createSpy('navigate') };

    TestBed.configureTestingModule({
      providers: [
        RecipeDataService,
        { provide: RecipeService, useValue: mockRecipeService },
        { provide: Auth, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: { params: paramsSubject.asObservable() } }
      ]
    });

    service = TestBed.inject(RecipeDataService);
  });

  // ──────────── RDS-01 a RDS-03: Estado inicial ────────────
  describe('Estado inicial', () => {
    it('RDS-01: isEditMode es false por defecto (Dummy)', () => {
      expect(service.isEditMode).toBeFalse();
    });

    it('RDS-02: recipeIdToEdit es null por defecto', () => {
      expect(service.recipeIdToEdit).toBeNull();
    });

    it('RDS-03: recipeId genera un UUID válido', () => {
      expect(service.recipeId).toBeTruthy();
      expect(service.recipeId.length).toBeGreaterThan(0);
    });
  });

  // ──────────── RDS-04 a RDS-09: initializeEditMode ────────────
  describe('initializeEditMode', () => {
    it('RDS-04: sin id en params no hace nada', () => {
      // Arrange
      const callback = jasmine.createSpy('callback');

      // Act
      service.initializeEditMode('1', callback);
      paramsSubject.next({}); // sin id

      // Assert
      expect(callback).not.toHaveBeenCalled();
      expect(service.isEditMode).toBeFalse();
    });

    it('RDS-05: con id válido y receta propia activa editMode (Spy)', () => {
      // Arrange
      const callback = jasmine.createSpy('callback');

      // Act
      service.initializeEditMode('1', callback);
      paramsSubject.next({ id: 'r1' });

      // Assert
      expect(service.isEditMode).toBeTrue();
      expect(service.recipeIdToEdit).toBe('r1');
      expect(service.recipeId).toBe('r1');
      expect(callback).toHaveBeenCalledWith(true);
    });

    it('RDS-06: receta no encontrada llama callback(false) (Stub)', () => {
      // Arrange
      const callback = jasmine.createSpy('callback');

      // Act
      service.initializeEditMode('1', callback);
      paramsSubject.next({ id: 'no-existe' });

      // Assert
      expect(callback).toHaveBeenCalledWith(false);
    });

    it('RDS-07: receta de otro usuario llama callback(false) (Stub)', () => {
      // Arrange
      mockAuthService.getUserProfile.and.returnValue({ id: 'u-otro' });
      const callback = jasmine.createSpy('callback');

      // Act
      service.initializeEditMode('1', callback);
      paramsSubject.next({ id: 'r1' });

      // Assert
      expect(callback).toHaveBeenCalledWith(false);
    });

    it('RDS-08: sin usuario logueado userId es vacío (Stub null)', () => {
      // Arrange
      mockAuthService.getUserProfile.and.returnValue(null);
      const callback = jasmine.createSpy('callback');

      // Act
      service.initializeEditMode('1', callback);
      paramsSubject.next({ id: 'r1' }); // recipe.user.id='u1' != ''

      // Assert
      expect(callback).toHaveBeenCalledWith(false);
    });
  });

  // ──────────── RDS-09 a RDS-11: getRecipeForEdit ────────────
  describe('getRecipeForEdit', () => {
    it('RDS-09: retorna null si recipeIdToEdit es null (Stub)', () => {
      // Arrange
      service.recipeIdToEdit = null;

      // Act
      const result = service.getRecipeForEdit();

      // Assert
      expect(result).toBeNull();
    });

    it('RDS-10: retorna la receta si existe (Dummy)', () => {
      // Arrange
      service.recipeIdToEdit = 'r1';

      // Act
      const result = service.getRecipeForEdit();

      // Assert
      expect(result).toEqual(DUMMY_RECIPE);
    });

    it('RDS-11: retorna null si receta no existe', () => {
      // Arrange
      service.recipeIdToEdit = 'no-existe';

      // Act
      const result = service.getRecipeForEdit();

      // Assert
      expect(result).toBeNull();
    });
  });

  // ──────────── RDS-12 a RDS-14: createRecipeObject ────────────
  describe('createRecipeObject', () => {
    it('RDS-12: crea objeto receta con usuario actual (Mock)', () => {
      // Arrange
      const formData = { name: 'Pizza', descripcion: 'Italiana' };

      // Act
      const result = service.createRecipeObject(formData, ['img1.jpg']);

      // Assert
      expect(result.name).toBe('Pizza');
      expect(result.user.id).toBe('u1');
      expect(result.user.username).toBe('chef');
    });

    it('RDS-13: lanza error si no hay usuario autenticado (Stub null)', () => {
      // Arrange
      mockAuthService.getCurrentUser.and.returnValue(null);

      // Act & Assert
      expect(() => service.createRecipeObject({}, [])).toThrowError('Usuario no autenticado');
    });
  });

  // ──────────── RDS-14 a RDS-17: saveRecipe ────────────
  describe('saveRecipe', () => {
    it('RDS-14: en modo edición llama updateRecipe y navega a /recipe/:id (Spy)', () => {
      // Arrange
      service.isEditMode = true;
      service.recipeIdToEdit = 'r1';
      const formData = { name: 'Updated' };

      // Act
      service.saveRecipe(formData, ['img.jpg']);

      // Assert
      expect(mockRecipeService.updateRecipe).toHaveBeenCalledWith('r1', formData);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/recipe', 'r1']);
    });

    it('RDS-15: en modo creación llama addRecipe y navega a /home (Spy)', () => {
      // Arrange
      service.isEditMode = false;
      const formData = { name: 'New' };

      // Act
      service.saveRecipe(formData, ['img.jpg']);

      // Assert
      expect(mockRecipeService.addRecipe).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['home']);
    });
  });

  // ──────────── RDS-18: resetRecipeId ────────────
  describe('resetRecipeId', () => {
    it('RDS-16: genera nuevo UUID diferente al anterior (Fake)', () => {
      // Arrange
      const originalId = service.recipeId;

      // Act
      service.resetRecipeId();

      // Assert
      expect(service.recipeId).not.toBe(originalId);
      expect(service.recipeId.length).toBeGreaterThan(0);
    });
  });
});
