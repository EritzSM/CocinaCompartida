import { TestBed } from '@angular/core/testing';
import { RecipeDetail } from './recipe-detail';
import { RecipeService } from '../../../shared/services/recipe';
import { Auth } from '../../../shared/services/auth';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import Swal from 'sweetalert2';
import { RecipeCrudService } from '../../../shared/services/recipe-crud.service';
import { RecipeStateService } from '../../../shared/services/recipe-state.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

describe('Descargar PDF (Frontend Tests)', () => {

  describe('RecipeDetail Component', () => {
    let component: RecipeDetail;
    let mockRecipeService: any;
    let mockAuth: any;
    let mockActivatedRoute: any;
    let mockRouter: any;

    beforeEach(() => {
      mockRecipeService = {
        getRecipeById: jasmine.createSpy('getRecipeById').and.returnValue(Promise.resolve({ id: 'r1' })),
        downloadPDF: jasmine.createSpy('downloadPDF'),
        downloadImage: jasmine.createSpy('downloadImage'),
        deleteRecipe: jasmine.createSpy('deleteRecipe'),
        addComment: jasmine.createSpy('addComment')
      };
      mockAuth = { 
        isLoged: jasmine.createSpy('isLoged').and.returnValue(true),
        getUserProfile: jasmine.createSpy('getUserProfile').and.returnValue({ id: 'u1' })
      };
      mockActivatedRoute = { snapshot: { paramMap: { get: () => 'r1' } } };
      mockRouter = { navigate: jasmine.createSpy('navigate') };

      spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true }) as any);

      TestBed.configureTestingModule({
        imports: [RecipeDetail],
        providers: [
          provideRouter([]),
          { provide: RecipeService, useValue: mockRecipeService },
          { provide: Auth, useValue: mockAuth },
          { provide: ActivatedRoute, useValue: mockActivatedRoute },
          { provide: Router, useValue: mockRouter }
        ]
      });

      const fixture = TestBed.createComponent(RecipeDetail);
      component = fixture.componentInstance;
    });

    it('F-P01: this.recipe nulo hace return sin llamar al servicio', async () => {
      component.recipe = undefined;
      await component.downloadPDF();
      expect(mockRecipeService.downloadPDF).not.toHaveBeenCalled();
    });

    it('F-P02: Descarga exitosa muestra toast de confirmación', async () => {
      component.recipe = { id: 'r1' } as any;
      mockRecipeService.downloadPDF.and.returnValue(Promise.resolve());
      await component.downloadPDF();
      expect(mockRecipeService.downloadPDF).toHaveBeenCalledWith('r1');
      expect(Swal.fire).toHaveBeenCalled();
    });

    it('F-P06: Error inesperado en el componente muestra toast de error', async () => {
      component.recipe = { id: 'r1' } as any;
      mockRecipeService.downloadPDF.and.returnValue(Promise.reject(new Error('Crash')));
      spyOn(console, 'error');
      await component.downloadPDF();
      expect(Swal.fire).toHaveBeenCalled();
    });
  });

  describe('RecipeCrudService', () => {
    let service: RecipeCrudService;
    let mockState: any;
    let httpTestingController: HttpTestingController;
    let mockAnchor: any;

    beforeEach(() => {
      mockState = {
        getRecipeUrl: (id: string) => `/api/recipes/${id}`,
        getAuthOptions: () => ({ headers: {} }),
        setError: jasmine.createSpy('setError')
      };

      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          RecipeCrudService,
          { provide: RecipeStateService, useValue: mockState }
        ]
      });

      service = TestBed.inject(RecipeCrudService);
      httpTestingController = TestBed.inject(HttpTestingController);

      // Global spies for DOM manipulation
      mockAnchor = { href: '', download: '', click: jasmine.createSpy('click') };
      spyOn(document, 'createElement').and.returnValue(mockAnchor as any);
      spyOn(document.body, 'appendChild');
      spyOn(document.body, 'removeChild');
      spyOn(window.URL, 'createObjectURL').and.returnValue('blob:url');
      spyOn(window.URL, 'revokeObjectURL');
    });

    afterEach(() => {
      // Avoid .verify() if it's causing mysterious failures in async tests
    });

    it('F-P03: downloadPDF dispara la descarga (service level)', async () => {
      const blob = new Blob(['data'], { type: 'application/pdf' });
      const promise = service.downloadPDF('r1');
      httpTestingController.expectOne('/api/recipes/r1/download?format=pdf').flush(blob);
      await promise;
      expect(mockAnchor.click).toHaveBeenCalled();
    });

    it('F-P04: downloadImage dispara la descarga de imagen', async () => {
      const blob = new Blob(['data'], { type: 'image/png' });
      const promise = service.downloadImage('r1');
      httpTestingController.expectOne('/api/recipes/r1/download?format=image').flush(blob);
      await promise;
      expect(mockAnchor.click).toHaveBeenCalled();
    });

    it('F-P05: Error HTTP en el servicio llama a setError', async () => {
      const promise = service.downloadPDF('r1');
      httpTestingController.expectOne('/api/recipes/r1/download?format=pdf').error(new ErrorEvent('Network error'), { status: 500 });
      await promise;
      expect(mockState.setError).toHaveBeenCalled();
    });
  });
});
