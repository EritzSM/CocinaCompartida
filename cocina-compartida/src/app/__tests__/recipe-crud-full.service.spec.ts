import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RecipeCrudService } from '../shared/services/recipe-crud.service';
import { RecipeStateService } from '../shared/services/recipe-state.service';
import { Recipe } from '../shared/interfaces/recipe';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  RECIPE CRUD SERVICE – Pruebas Unitarias Completas (Patrón AAA)
//  Funcionalidad: CRUD de recetas (create, read, update, delete)
//  + downloadPDF, downloadImage
//
//  Tipos de Mocks:
//  1. Spy      – jasmine.createSpyObj para RecipeStateService
//  2. Stub     – Retornos predefinidos en HTTP (flush)
//  3. Mock     – HttpTestingController interceptando requests
//  4. Dummy    – Datos de receta de prueba
//  5. Fake     – Funciones callback en updateRecipes
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// --- Dummy Data ---
const DUMMY_RECIPE: Recipe = {
  id: 'r1', name: 'Tacos', descripcion: 'Tacos mexicanos',
  ingredients: ['tortilla', 'carne'], steps: ['preparar', 'servir'],
  images: ['img1.jpg'], category: 'Mexicana',
  user: { id: 'u1', username: 'chef' },
  likes: 5, likedBy: ['u2'], comments: []
};

const DUMMY_RECIPES: Recipe[] = [
  DUMMY_RECIPE,
  { ...DUMMY_RECIPE, id: 'r2', name: 'Sushi', likes: 20 },
  { ...DUMMY_RECIPE, id: 'r3', name: 'Paella', likes: 15 }
];

describe('RecipeCrudService – Pruebas Unitarias Completas', () => {
  let service: RecipeCrudService;
  let httpMock: HttpTestingController;
  let stateSpy: jasmine.SpyObj<RecipeStateService>;

  beforeEach(() => {
    // Test Double (Spy): Estado central con todos los métodos espiados
    stateSpy = jasmine.createSpyObj('RecipeStateService', [
      'setLoading', 'clearError', 'setRecipes', 'setError',
      'updateRecipes', 'rollbackRecipes', 'recipes'
    ]);

    // Test Double (Stub): URLs
    Object.defineProperty(stateSpy, 'recipesUrl', { get: () => '/api/recipes' });
    stateSpy.getRecipeUrl = jasmine.createSpy('getRecipeUrl').and.callFake(
      (id: string) => `/api/recipes/${id}`
    );
    stateSpy.getAuthOptions = jasmine.createSpy('getAuthOptions').and.returnValue({
      headers: { Authorization: 'Bearer mock-token' }
    });

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        RecipeCrudService,
        { provide: RecipeStateService, useValue: stateSpy }
      ]
    });

    service = TestBed.inject(RecipeCrudService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ──────────────────────────────────────────────────────────
  //  CRUD-01 a CRUD-04: loadRecipes
  // ──────────────────────────────────────────────────────────
  describe('loadRecipes()', () => {
    it('CRUD-01: GET /api/recipes, setLoading, clearError, setRecipes (Spy)', async () => {
      // Arrange
      const mockData = [...DUMMY_RECIPES];

      // Act
      const promise = service.loadRecipes();

      // Assert intermedios
      expect(stateSpy.setLoading).toHaveBeenCalledWith(true);
      expect(stateSpy.clearError).toHaveBeenCalled();

      // Mock HTTP
      const req = httpMock.expectOne('/api/recipes');
      expect(req.request.method).toBe('GET');
      req.flush(mockData);
      await promise;

      // Assert finales
      expect(stateSpy.setRecipes).toHaveBeenCalledWith(mockData);
      expect(stateSpy.setLoading).toHaveBeenCalledWith(false);
    });

    it('CRUD-02: error HTTP llama setError y setLoading(false) (Stub error)', async () => {
      // Arrange
      spyOn(console, 'error');

      // Act
      const promise = service.loadRecipes();
      httpMock.expectOne('/api/recipes').flush(null, { status: 500, statusText: 'Error' });
      await promise;

      // Assert
      expect(stateSpy.setError).toHaveBeenCalledWith('No se pudieron cargar las recetas');
      expect(stateSpy.setLoading).toHaveBeenCalledWith(false);
    });
  });

  // ──────────────────────────────────────────────────────────
  //  CRUD-05 a CRUD-07: getRecipeById
  // ──────────────────────────────────────────────────────────
  describe('getRecipeById()', () => {
    it('CRUD-05: retorna receta en GET exitoso (Mock HTTP)', async () => {
      // Arrange
      stateSpy.getRecipeUrl = jasmine.createSpy().and.returnValue('/api/recipes/r1');

      // Act
      const promise = service.getRecipeById('r1');
      httpMock.expectOne('/api/recipes/r1').flush(DUMMY_RECIPE);
      const result = await promise;

      // Assert
      expect(result).toEqual(DUMMY_RECIPE);
      expect(stateSpy.setLoading).toHaveBeenCalledWith(true);
      expect(stateSpy.setLoading).toHaveBeenCalledWith(false);
    });

    it('CRUD-06: retorna null en error HTTP (Stub)', async () => {
      // Arrange
      stateSpy.getRecipeUrl = jasmine.createSpy().and.returnValue('/api/recipes/bad-id');
      spyOn(console, 'error');

      // Act
      const promise = service.getRecipeById('bad-id');
      httpMock.expectOne('/api/recipes/bad-id').flush(null, { status: 404, statusText: 'Not Found' });
      const result = await promise;

      // Assert
      expect(result).toBeNull();
      expect(stateSpy.setError).toHaveBeenCalledWith('No se pudo encontrar la receta');
    });

    it('CRUD-07: llama clearError al iniciar (Spy)', async () => {
      // Arrange
      stateSpy.getRecipeUrl = jasmine.createSpy().and.returnValue('/api/recipes/r1');

      // Act
      const promise = service.getRecipeById('r1');
      expect(stateSpy.clearError).toHaveBeenCalled();
      httpMock.expectOne('/api/recipes/r1').flush(DUMMY_RECIPE);
      await promise;

      // Assert (ya verificado arriba)
    });
  });

  // ──────────────────────────────────────────────────────────
  //  CRUD-08 a CRUD-11: createRecipe
  // ──────────────────────────────────────────────────────────
  describe('createRecipe()', () => {
    const newRecipeInput = {
      name: ' Nueva Receta ',
      descripcion: ' Descripción test ',
      ingredients: ['ing1'],
      steps: ['step1'],
      images: ['img1.jpg'],
      category: 'Test'
    } as any;

    it('CRUD-08: POST /api/recipes con payload limpio (Spy + Dummy)', async () => {
      // Arrange
      const created = { ...DUMMY_RECIPE, id: 'r-new' };

      // Act
      const promise = service.createRecipe(newRecipeInput);
      const req = httpMock.expectOne('/api/recipes');

      // Assert
      expect(req.request.method).toBe('POST');
      expect(req.request.body.name).toBe('Nueva Receta'); // trimmed
      expect(req.request.body.descripcion).toBe('Descripción test'); // trimmed
      req.flush(created);
      const result = await promise;

      expect(result).toEqual(created);
      expect(stateSpy.updateRecipes).toHaveBeenCalled();
    });

    it('CRUD-09: retorna null si HTTP falla (Stub error)', async () => {
      // Arrange
      spyOn(console, 'error');

      // Act
      const promise = service.createRecipe(newRecipeInput);
      httpMock.expectOne('/api/recipes').flush(null, { status: 400, statusText: 'Bad Request' });
      const result = await promise;

      // Assert
      expect(result).toBeNull();
      expect(stateSpy.setError).toHaveBeenCalledWith('No se pudo crear la receta');
    });

    it('CRUD-10: prepareRecipePayload maneja ingredients/steps undefined (Dummy)', async () => {
      // Arrange
      const input = { name: 'Test', descripcion: 'Desc', category: 'X' } as any;

      // Act
      const promise = service.createRecipe(input);
      const req = httpMock.expectOne('/api/recipes');

      // Assert - payload debe tener arrays vacíos
      expect(req.request.body.ingredients).toEqual([]);
      expect(req.request.body.steps).toEqual([]);
      expect(req.request.body.images).toEqual([]);
      req.flush({ ...DUMMY_RECIPE });
      await promise;
    });
  });

  // ──────────────────────────────────────────────────────────
  //  CRUD-12 a CRUD-16: updateRecipe
  // ──────────────────────────────────────────────────────────
  describe('updateRecipe()', () => {
    it('CRUD-12: PATCH con optimistic update y confirm del server (Mock + Fake)', async () => {
      // Arrange
      stateSpy.getRecipeUrl = jasmine.createSpy().and.returnValue('/api/recipes/r1');
      stateSpy.recipes.and.returnValue([...DUMMY_RECIPES]);
      const changes = { name: 'Tacos Mejorados' };
      const updated = { ...DUMMY_RECIPE, name: 'Tacos Mejorados' };

      // Act
      const promise = service.updateRecipe('r1', changes);

      // Assert: optimistic update ya fue llamado
      expect(stateSpy.updateRecipes).toHaveBeenCalled();

      const req = httpMock.expectOne('/api/recipes/r1');
      expect(req.request.method).toBe('PATCH');
      req.flush(updated);
      const result = await promise;

      // Assert: server update reemplaza optimistic
      expect(result).toEqual(updated);
      expect(stateSpy.updateRecipes).toHaveBeenCalledTimes(2); // optimistic + server
    });

    it('CRUD-13: rollback en error HTTP (Stub + Spy)', async () => {
      // Arrange
      stateSpy.getRecipeUrl = jasmine.createSpy().and.returnValue('/api/recipes/r1');
      const previousState = [...DUMMY_RECIPES];
      stateSpy.recipes.and.returnValue(previousState);
      spyOn(console, 'error');

      // Act
      const promise = service.updateRecipe('r1', { name: 'Fail' });
      httpMock.expectOne('/api/recipes/r1').flush(null, { status: 500, statusText: 'Error' });
      const result = await promise;

      // Assert
      expect(result).toBeNull();
      expect(stateSpy.rollbackRecipes).toHaveBeenCalledWith(previousState);
      expect(stateSpy.setError).toHaveBeenCalledWith('No se pudo actualizar la receta');
    });
  });

  // ──────────────────────────────────────────────────────────
  //  CRUD-17 a CRUD-20: deleteRecipe
  // ──────────────────────────────────────────────────────────
  describe('deleteRecipe()', () => {
    it('CRUD-17: DELETE con optimistic remove y retorna true (Mock)', async () => {
      // Arrange
      stateSpy.getRecipeUrl = jasmine.createSpy().and.returnValue('/api/recipes/r1');
      stateSpy.recipes.and.returnValue([...DUMMY_RECIPES]);

      // Act
      const promise = service.deleteRecipe('r1');

      // Assert: optimistic remove
      expect(stateSpy.updateRecipes).toHaveBeenCalled();

      httpMock.expectOne('/api/recipes/r1').flush(null);
      const result = await promise;

      expect(result).toBeTrue();
    });

    it('CRUD-18: rollback en error y retorna false (Stub)', async () => {
      // Arrange
      stateSpy.getRecipeUrl = jasmine.createSpy().and.returnValue('/api/recipes/r1');
      const previousState = [...DUMMY_RECIPES];
      stateSpy.recipes.and.returnValue(previousState);
      spyOn(console, 'error');

      // Act
      const promise = service.deleteRecipe('r1');
      httpMock.expectOne('/api/recipes/r1').flush(null, { status: 500, statusText: 'Error' });
      const result = await promise;

      // Assert
      expect(result).toBeFalse();
      expect(stateSpy.rollbackRecipes).toHaveBeenCalledWith(previousState);
      expect(stateSpy.setError).toHaveBeenCalledWith('No se pudo eliminar la receta');
    });
  });

  // ──────────────────────────────────────────────────────────
  //  CRUD-21 a CRUD-24: downloadPDF
  // ──────────────────────────────────────────────────────────
  describe('downloadPDF()', () => {
    it('CRUD-21: GET correcto con responseType blob (Mock)', async () => {
      // Arrange
      stateSpy.getRecipeUrl = jasmine.createSpy().and.returnValue('/api/recipes/r1');
      const blob = new Blob(['pdf-data'], { type: 'application/pdf' });
      spyOn(window.URL, 'createObjectURL').and.returnValue('blob:url');
      spyOn(window.URL, 'revokeObjectURL');
      const mockAnchor = { href: '', download: '', click: jasmine.createSpy() };
      spyOn(document, 'createElement').and.returnValue(mockAnchor as any);
      spyOn(document.body, 'appendChild');
      spyOn(document.body, 'removeChild');

      // Act
      const promise = service.downloadPDF('r1');
      httpMock.expectOne('/api/recipes/r1/download?format=pdf').flush(blob);
      await promise;

      // Assert
      expect(mockAnchor.download).toBe('receta.pdf');
      expect(mockAnchor.click).toHaveBeenCalled();
      expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:url');
    });

    it('CRUD-22: error HTTP llama setError (Stub)', async () => {
      // Arrange
      stateSpy.getRecipeUrl = jasmine.createSpy().and.returnValue('/api/recipes/r1');
      spyOn(console, 'error');

      // Act
      const promise = service.downloadPDF('r1');
      httpMock.expectOne('/api/recipes/r1/download?format=pdf').flush(null, { status: 500, statusText: 'Error' });
      await promise;

      // Assert
      expect(stateSpy.setError).toHaveBeenCalledWith('No se pudo descargar el PDF');
    });
  });

  // ──────────────────────────────────────────────────────────
  //  CRUD-25 a CRUD-26: downloadImage
  // ──────────────────────────────────────────────────────────
  describe('downloadImage()', () => {
    it('CRUD-25: GET imagen con filename receta.jpg (Mock)', async () => {
      // Arrange
      stateSpy.getRecipeUrl = jasmine.createSpy().and.returnValue('/api/recipes/r1');
      const blob = new Blob(['img-data'], { type: 'image/jpeg' });
      spyOn(window.URL, 'createObjectURL').and.returnValue('blob:url');
      spyOn(window.URL, 'revokeObjectURL');
      const mockAnchor = { href: '', download: '', click: jasmine.createSpy() };
      spyOn(document, 'createElement').and.returnValue(mockAnchor as any);
      spyOn(document.body, 'appendChild');
      spyOn(document.body, 'removeChild');

      // Act
      const promise = service.downloadImage('r1');
      httpMock.expectOne('/api/recipes/r1/download?format=image').flush(blob);
      await promise;

      // Assert
      expect(mockAnchor.download).toBe('receta.jpg');
      expect(mockAnchor.click).toHaveBeenCalled();
    });

    it('CRUD-26: error HTTP llama setError para imagen (Stub)', async () => {
      // Arrange
      stateSpy.getRecipeUrl = jasmine.createSpy().and.returnValue('/api/recipes/r1');
      spyOn(console, 'error');

      // Act
      const promise = service.downloadImage('r1');
      httpMock.expectOne('/api/recipes/r1/download?format=image').flush(null, { status: 500, statusText: 'Error' });
      await promise;

      // Assert
      expect(stateSpy.setError).toHaveBeenCalledWith('No se pudo descargar la imagen');
    });
  });

  // ──────────────────────────────────────────────────────────
  //  CRUD-27 a CRUD-28: loadTopLikedRecipes
  // ──────────────────────────────────────────────────────────
  describe('loadTopLikedRecipes()', () => {
    it('CRUD-27: GET /api/recipes/top-liked retorna recetas (Mock)', async () => {
      // Arrange
      const topRecipes = [DUMMY_RECIPES[1], DUMMY_RECIPES[2]]; // Sushi, Paella

      // Act
      const promise = service.loadTopLikedRecipes();
      httpMock.expectOne('/api/recipes/top-liked').flush(topRecipes);
      const result = await promise;

      // Assert
      expect(result.length).toBe(2);
      expect(result[0].name).toBe('Sushi');
    });

    it('CRUD-28: retorna [] en error (Stub)', async () => {
      // Arrange
      spyOn(console, 'error');

      // Act
      const promise = service.loadTopLikedRecipes();
      httpMock.expectOne('/api/recipes/top-liked').flush(null, { status: 500, statusText: 'Error' });
      const result = await promise;

      // Assert
      expect(result).toEqual([]);
    });
  });
});
