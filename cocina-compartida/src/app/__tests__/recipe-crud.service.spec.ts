import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RecipeCrudService } from '../shared/services/recipe-crud.service';
import { RecipeStateService } from '../shared/services/recipe-state.service';
import { Recipe } from '../shared/interfaces/recipe';

describe('Frontend - RecipeCrudService (Recetas Populares)', () => {
  let service: RecipeCrudService;
  let httpMock: HttpTestingController;
  let stateSpy: jasmine.SpyObj<RecipeStateService>;

  beforeEach(() => {
    // Arrange: Preparamos los Spies para aislar el State Service de la lógica del CRUD
    stateSpy = jasmine.createSpyObj('RecipeStateService', [
      'setLoading', 'clearError', 'setRecipes', 'setError',
      'updateRecipes', 'rollbackRecipes'
    ]);
    // Definimos getters falsos (Stubs) para variables internas del estado
    Object.defineProperty(stateSpy, 'recipesUrl', { get: () => '/api/recipes' });

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

  // RP-01 a RP-06: Recetas Populares (Top Liked)

  describe('loadTopLikedRecipes()', () => {
    it('RP-01/RP-04/RP-05: debe hacer un GET a /api/recipes/top-liked y devolver arreglos ordenados', async () => {
      // Arrange
      // Test Double (Dummy): Lista de recetas retornada por backend ordenadas por likes (RP-01) 
      const mockTopRecipes: Recipe[] = [
        { id: 'r1', name: 'Receta más popular', likes: 100 } as Recipe,
        { id: 'r2', name: 'Receta mediana', likes: 50 } as Recipe,
        { id: 'r3', name: 'Receta menos popular', likes: 10 } as Recipe
      ];

      // Act
      const getPromise = service.loadTopLikedRecipes();

      // Test Double (Mock Http)
      const req = httpMock.expectOne('/api/recipes/top-liked');
      expect(req.request.method).toBe('GET');
      req.flush(mockTopRecipes); // Flush simula la respuesta exitosa

      const result = await getPromise;

      // Assert
      expect(result.length).toBe(3);
      expect(result[0].likes).toBe(100); // Valida RP-01: Están ordenadas según respondió backend
      expect(result).toEqual(mockTopRecipes); // Valida RP-05: Estructura de respuesta
    });

    it('RP-02: debe retornar lista vacía si backend no devuelve recetas (Test Double Stub [])', async () => {
      // Arrange
      const emptyRecipes: Recipe[] = [];

      // Act
      const getPromise = service.loadTopLikedRecipes();

      // Test Double (Stub): Backend devuelve array vacío de registros
      httpMock.expectOne('/api/recipes/top-liked').flush(emptyRecipes);

      const result = await getPromise;

      // Assert
      expect(result.length).toBe(0);
      expect(result).toEqual([]);
    });

    it('RP-06 / Error nativo: debe retornar lista vacía y capturar console.error si falla el endpoint', async () => {
      // Arrange
      // Test Double (Spy): Espiamos la consola para no ensuciar el output y validar que se maneja el error
      spyOn(console, 'error');

      // Act
      const getPromise = service.loadTopLikedRecipes();

      // Test Double (Stub): Forzamos error 500
      const req = httpMock.expectOne('/api/recipes/top-liked');
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });

      const result = await getPromise;

      // Assert
      expect(result).toEqual([]); // El catch bloquea la excepción y retorna catchError([])
      expect(console.error).toHaveBeenCalled();
    });
  });

  // Validaciones Adicionales: Comprobar el manejo del Loading/Error
  describe('loadRecipes() global', () => {
    it('debe actualizar el estado global (setLoading, clearError, setRecipes) - Test Double Spies', async () => {
      // Arrange
      const dummyRecipes = [{ id: '1' }] as Recipe[];

      // Act
      const p = service.loadRecipes();

      // Assert inmediato (SetLoading true)
      expect(stateSpy.setLoading).toHaveBeenCalledWith(true);
      expect(stateSpy.clearError).toHaveBeenCalled();

      // Mock Http
      httpMock.expectOne('/api/recipes').flush(dummyRecipes);
      await p;

      // Assert posterior
      expect(stateSpy.setRecipes).toHaveBeenCalledWith(dummyRecipes);
      expect(stateSpy.setLoading).toHaveBeenCalledWith(false); // Finally se ejecuta
    });
  });
});
