import { TestBed } from '@angular/core/testing';
import { RecipeUploadService } from '../shared/services/recipe-upload.service';
import { RecipeFormService } from '../shared/services/recipe-form.service';
import { RecipeImageService } from '../shared/services/recipe-image.service';
import { RecipeDataService } from '../shared/services/recipe-data.service';
import { NotificationService } from '../shared/services/notificacion.service';
import { Auth } from '../shared/services/auth';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  RECIPE UPLOAD SERVICE – Pruebas complementarias (Patrón AAA)
//  Funcionalidad: initializeEditMode, onDeleteCurrentImage,
//  loadRecipeIntoForm (via initializeEditMode)
//
//  Tipos de Mocks: Spy, Stub, Mock, Dummy, Fake
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('RecipeUploadService – Pruebas complementarias', () => {
  let service: RecipeUploadService;
  let mockFormService: any;
  let mockImageService: any;
  let mockDataService: any;
  let mockNotification: any;
  let mockAuth: any;
  let mockRouter: any;
  let fb: FormBuilder;

  beforeEach(() => {
    fb = new FormBuilder();

    mockFormService = {
      createRecipeForm: jasmine.createSpy('createRecipeForm').and.returnValue(
        fb.group({ name: [''], descripcion: [''], category: [''], ingredients: fb.array(['']), steps: fb.array(['']) })
      ),
      addFormArrayItem: jasmine.createSpy('addFormArrayItem'),
      removeFormArrayItem: jasmine.createSpy('removeFormArrayItem').and.returnValue(true),
      markAllFieldsAsTouched: jasmine.createSpy('markAllFieldsAsTouched'),
      validateField: jasmine.createSpy('validateField').and.returnValue(false),
      validateArrayField: jasmine.createSpy('validateArrayField').and.returnValue(false),
      prepareFormData: jasmine.createSpy('prepareFormData').and.returnValue({}),
      clearAndLoadFormArray: jasmine.createSpy('clearAndLoadFormArray')
    };

    mockImageService = {
      images: ['img.jpg'],
      currentIndex: 0,
      isUploading: false,
      uploadFiles: jasmine.createSpy('uploadFiles').and.returnValue(Promise.resolve(true)),
      removeImage: jasmine.createSpy('removeImage').and.returnValue(Promise.resolve()),
      navigateImages: jasmine.createSpy('navigateImages'),
      resetImages: jasmine.createSpy('resetImages')
    };

    // Test Double (Mock): DataService con callback support
    mockDataService = {
      isEditMode: false,
      recipeId: 'test-id',
      initializeEditMode: jasmine.createSpy('initializeEditMode'),
      getRecipeForEdit: jasmine.createSpy('getRecipeForEdit'),
      saveRecipe: jasmine.createSpy('saveRecipe'),
      resetRecipeId: jasmine.createSpy('resetRecipeId')
    };

    mockNotification = {
      showToast: jasmine.createSpy('showToast'),
      showConfirmation: jasmine.createSpy('showConfirmation').and.returnValue(Promise.resolve({ isConfirmed: true }))
    };

    mockAuth = {
      getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue({ id: 'u1', username: 'test' })
    };

    mockRouter = { navigate: jasmine.createSpy('navigate') };

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      providers: [
        RecipeUploadService,
        { provide: RecipeFormService, useValue: mockFormService },
        { provide: RecipeImageService, useValue: mockImageService },
        { provide: RecipeDataService, useValue: mockDataService },
        { provide: NotificationService, useValue: mockNotification },
        { provide: Auth, useValue: mockAuth },
        { provide: Router, useValue: mockRouter }
      ]
    });

    service = TestBed.inject(RecipeUploadService);
  });

  // ──────────── RUE-01 a RUE-04: initializeEditMode ────────────
  describe('initializeEditMode', () => {
    it('RUE-01: callback false si dataService falla (Stub)', () => {
      // Arrange
      mockDataService.initializeEditMode.and.callFake((cb: (s: boolean) => void) => cb(false));
      const form = fb.group({ name: [''], descripcion: [''], ingredients: fb.array(['']), steps: fb.array(['']) });
      const callback = jasmine.createSpy('callback');

      // Act
      service.initializeEditMode('1', form, callback);

      // Assert
      expect(callback).toHaveBeenCalledWith(false);
      expect(mockNotification.showToast).toHaveBeenCalledWith('error', 'Receta no encontrada o sin permisos');
    });

    it('RUE-02: callback true con receta carga datos en form (Mock)', () => {
      // Arrange
      const recipe = {
        name: 'Pizza', descripcion: 'Italiana',
        ingredients: ['harina', 'tomate'], steps: ['hornear'],
        images: ['pizza.jpg', 'pizza2.jpg']
      };
      mockDataService.initializeEditMode.and.callFake((cb: (s: boolean) => void) => cb(true));
      mockDataService.getRecipeForEdit.and.returnValue(recipe);

      const form = fb.group({ name: [''], descripcion: [''], ingredients: fb.array(['']), steps: fb.array(['']) });
      const callback = jasmine.createSpy('callback');

      // Act
      service.initializeEditMode('1', form, callback);

      // Assert
      expect(callback).toHaveBeenCalledWith(true);
      expect(form.get('name')!.value).toBe('Pizza');
      expect(mockFormService.clearAndLoadFormArray).toHaveBeenCalledTimes(2);
      expect(mockImageService.images).toEqual(['pizza.jpg', 'pizza2.jpg']);
    });

    it('RUE-03: callback false si getRecipeForEdit retorna null', () => {
      // Arrange
      mockDataService.initializeEditMode.and.callFake((cb: (s: boolean) => void) => cb(true));
      mockDataService.getRecipeForEdit.and.returnValue(null);

      const form = fb.group({ name: [''] });
      const callback = jasmine.createSpy('callback');

      // Act
      service.initializeEditMode('1', form, callback);

      // Assert
      expect(callback).toHaveBeenCalledWith(false);
    });
  });

  // ──────────── RUE-04 a RUE-06: onDeleteCurrentImage ────────────
  describe('onDeleteCurrentImage', () => {
    it('RUE-04: con imágenes muestra confirmación (Spy)', async () => {
      // Arrange
      mockImageService.images = ['img1.jpg'];
      mockImageService.currentIndex = 0;

      // Act
      await service.onDeleteCurrentImage();

      // Assert
      expect(mockNotification.showConfirmation).toHaveBeenCalledWith(
        'Eliminar imagen',
        '¿Estás seguro que quieres eliminar esta imagen?'
      );
    });

    it('RUE-05: sin imágenes no muestra confirmación (Stub)', async () => {
      // Arrange
      mockImageService.images = [];

      // Act
      await service.onDeleteCurrentImage();

      // Assert
      expect(mockNotification.showConfirmation).not.toHaveBeenCalled();
    });
  });

  // ──────────── RUE-06: addFormArrayItem sin minItems ────────────
  describe('addFormArrayItem edge cases', () => {
    it('RUE-06: addFormArrayItem pasa minItems por defecto (Spy)', () => {
      // Arrange
      const arr = fb.array(['']);

      // Act
      service.addFormArrayItem(arr);

      // Assert
      expect(mockFormService.addFormArrayItem).toHaveBeenCalledWith(arr);
    });
  });
});
