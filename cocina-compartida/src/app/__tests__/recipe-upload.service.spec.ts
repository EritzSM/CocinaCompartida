import { TestBed } from '@angular/core/testing';
import { RecipeUploadService } from '../shared/services/recipe-upload.service';
import { RecipeFormService } from '../shared/services/recipe-form.service';
import { RecipeImageService } from '../shared/services/recipe-image.service';
import { RecipeDataService } from '../shared/services/recipe-data.service';
import { NotificationService } from '../shared/services/notificacion.service';
import { Auth } from '../shared/services/auth';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule } from '@angular/forms';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  RECIPE UPLOAD SERVICE – Pruebas Unitarias (Patrón AAA)
//  Funcionalidad: Orquestación de upload de recetas
//
//  Tipos de Mocks: Spy, Stub, Mock, Dummy, Fake
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('RecipeUploadService – Pruebas Unitarias', () => {
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

    // Test Double (Mock): Todos los servicios dependientes
    mockFormService = {
      createRecipeForm: jasmine.createSpy('createRecipeForm').and.returnValue(
        fb.group({ name: ['Test'], descripcion: ['Desc larga test'], category: ['Cat'], ingredients: fb.array(['ing']), steps: fb.array(['step']) })
      ),
      addFormArrayItem: jasmine.createSpy('addFormArrayItem'),
      removeFormArrayItem: jasmine.createSpy('removeFormArrayItem').and.returnValue(true),
      markAllFieldsAsTouched: jasmine.createSpy('markAllFieldsAsTouched'),
      validateField: jasmine.createSpy('validateField').and.returnValue(false),
      validateArrayField: jasmine.createSpy('validateArrayField').and.returnValue(false),
      prepareFormData: jasmine.createSpy('prepareFormData').and.returnValue({
        name: 'Test', descripcion: 'Desc', category: 'Cat',
        ingredients: ['ing'], steps: ['step'], images: ['img.jpg']
      }),
      clearAndLoadFormArray: jasmine.createSpy('clearAndLoadFormArray')
    };

    // Test Double (Stub): ImageService
    mockImageService = {
      images: ['img.jpg'],
      currentIndex: 0,
      isUploading: false,
      uploadFiles: jasmine.createSpy('uploadFiles').and.returnValue(Promise.resolve(true)),
      removeImage: jasmine.createSpy('removeImage').and.returnValue(Promise.resolve()),
      navigateImages: jasmine.createSpy('navigateImages'),
      resetImages: jasmine.createSpy('resetImages')
    };

    // Test Double (Stub): DataService
    mockDataService = {
      isEditMode: false,
      recipeId: 'test-id',
      initializeEditMode: jasmine.createSpy('initializeEditMode'),
      getRecipeForEdit: jasmine.createSpy('getRecipeForEdit'),
      saveRecipe: jasmine.createSpy('saveRecipe'),
      resetRecipeId: jasmine.createSpy('resetRecipeId')
    };

    // Test Double (Spy): NotificationService
    mockNotification = {
      showToast: jasmine.createSpy('showToast'),
      showConfirmation: jasmine.createSpy('showConfirmation')
    };

    // Test Double (Stub): Auth
    mockAuth = {
      getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue({ id: 'u1', username: 'test' })
    };

    // Test Double (Spy): Router
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

  // ──────────── Getters proxy ────────────
  describe('Getters proxy', () => {
    it('RU-01: images devuelve las imágenes del ImageService', () => {
      expect(service.images).toEqual(['img.jpg']);
    });

    it('RU-02: currentIndex devuelve el índice del ImageService', () => {
      expect(service.currentIndex).toBe(0);
    });

    it('RU-03: isUploading devuelve el estado del ImageService', () => {
      expect(service.isUploading).toBeFalse();
    });

    it('RU-04: isEditMode devuelve el estado del DataService', () => {
      expect(service.isEditMode).toBeFalse();
    });
  });

  // ──────────── createRecipeForm ────────────
  describe('createRecipeForm', () => {
    it('RU-05: delega a RecipeFormService (Spy)', () => {
      // Act
      const form = service.createRecipeForm();

      // Assert
      expect(mockFormService.createRecipeForm).toHaveBeenCalled();
      expect(form).toBeTruthy();
    });
  });

  describe('initializeEditMode', () => {
    it('RU-21: carga receta existente en el formulario y en las imagenes', () => {
      const form = fb.group({
        name: [''],
        descripcion: [''],
        category: [''],
        ingredients: fb.array(['']),
        steps: fb.array([''])
      });
      const recipe = {
        name: 'Receta editada',
        descripcion: 'Descripcion editada',
        category: 'Cena',
        ingredients: ['arroz', 'sal'],
        steps: ['mezclar'],
        images: ['editada.jpg']
      };
      const callback = jasmine.createSpy('callback');
      mockDataService.initializeEditMode.and.callFake((_id: string, cb: (success: boolean) => void) => cb(true));
      mockDataService.getRecipeForEdit.and.returnValue(recipe);

      service.initializeEditMode('recipe-1', form, callback);

      expect(form.value.name).toBe('Receta editada');
      expect(mockFormService.clearAndLoadFormArray).toHaveBeenCalledTimes(2);
      expect(mockImageService.images).toEqual(['editada.jpg']);
      expect(mockImageService.currentIndex).toBe(0);
      expect(callback).toHaveBeenCalledWith(true);
    });

    it('RU-22: notifica y corta si no se puede inicializar la edicion', () => {
      const callback = jasmine.createSpy('callback');
      mockDataService.initializeEditMode.and.callFake((_id: string, cb: (success: boolean) => void) => cb(false));

      service.initializeEditMode('recipe-404', fb.group({}), callback);

      expect(mockNotification.showToast).toHaveBeenCalledWith('error', 'Receta no encontrada o sin permisos');
      expect(mockDataService.getRecipeForEdit).not.toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(false);
    });

    it('RU-23: informa false si el modo edicion no devuelve receta', () => {
      const callback = jasmine.createSpy('callback');
      mockDataService.initializeEditMode.and.callFake((_id: string, cb: (success: boolean) => void) => cb(true));
      mockDataService.getRecipeForEdit.and.returnValue(null);

      service.initializeEditMode('recipe-empty', fb.group({}), callback);

      expect(callback).toHaveBeenCalledWith(false);
    });
  });

  // ──────────── FormArray operations ────────────
  describe('FormArray operations', () => {
    it('RU-06: addFormArrayItem delega al FormService', () => {
      // Arrange
      const mockArray = {} as FormArray;

      // Act
      service.addFormArrayItem(mockArray);

      // Assert
      expect(mockFormService.addFormArrayItem).toHaveBeenCalledWith(mockArray);
    });

    it('RU-07: removeFormArrayItem exitoso retorna true', () => {
      // Arrange
      const mockArray = {} as FormArray;

      // Act
      const result = service.removeFormArrayItem(mockArray, 0, 1);

      // Assert
      expect(result).toBeTrue();
    });

    it('RU-08: removeFormArrayItem fallido muestra toast warning', () => {
      // Arrange
      mockFormService.removeFormArrayItem.and.returnValue(false);
      const mockArray = {} as FormArray;

      // Act
      const result = service.removeFormArrayItem(mockArray, 0, 1);

      // Assert
      expect(result).toBeFalse();
      expect(mockNotification.showToast).toHaveBeenCalledWith('warning', jasmine.stringContaining('al menos'));
    });
  });

  // ──────────── uploadFiles ────────────
  describe('uploadFiles', () => {
    it('RU-09: upload exitoso muestra toast success (Spy)', async () => {
      // Arrange
      const files = [new File([''], 'test.jpg')];

      // Act
      const result = await service.uploadFiles(files);

      // Assert
      expect(result).toBeTrue();
      expect(mockNotification.showToast).toHaveBeenCalledWith('success', 'Imágenes subidas correctamente');
    });

    it('RU-10: upload fallido muestra toast error', async () => {
      // Arrange
      mockImageService.uploadFiles.and.returnValue(Promise.resolve(false));

      // Act
      const result = await service.uploadFiles([new File([''], 'x.jpg')]);

      // Assert
      expect(result).toBeFalse();
      expect(mockNotification.showToast).toHaveBeenCalledWith('error', 'Error al subir imágenes');
    });
  });

  // ──────────── removeImage ────────────
  describe('uploadFiles limit', () => {
    it('RU-24: upload con limite muestra warning y retorna false', async () => {
      mockImageService.MAX_IMAGES = 5;
      mockImageService.uploadFiles.and.returnValue(Promise.resolve('limit'));

      const result = await service.uploadFiles([new File([''], 'x.jpg')]);

      expect(result).toBeFalse();
      expect(mockNotification.showToast).toHaveBeenCalledWith('warning', jasmine.stringContaining('5'));
    });
  });

  describe('removeImage', () => {
    it('RU-11: delega al ImageService y muestra toast', async () => {
      // Act
      await service.removeImage(0);

      // Assert
      expect(mockImageService.removeImage).toHaveBeenCalledWith(0);
      expect(mockNotification.showToast).toHaveBeenCalledWith('success', 'Imagen eliminada');
    });
  });

  // ──────────── navigateImages ────────────
  describe('navigateImages', () => {
    it('RU-12: delega next al ImageService', () => {
      service.navigateImages('next');
      expect(mockImageService.navigateImages).toHaveBeenCalledWith('next');
    });

    it('RU-13: delega prev al ImageService', () => {
      service.navigateImages('prev');
      expect(mockImageService.navigateImages).toHaveBeenCalledWith('prev');
    });
  });

  // ──────────── submitRecipe ────────────
  describe('submitRecipe', () => {
    let validForm: FormGroup;

    beforeEach(() => {
      validForm = fb.group({
        name: ['Pizza'], descripcion: ['Desc larga suficiente'],
        category: ['Italiana'], ingredients: fb.array(['harina']), steps: fb.array(['hornear'])
      });
    });

    it('RU-14: formulario inválido muestra error y retorna false (Stub)', async () => {
      // Arrange
      const invalidForm = fb.group({ name: [''] });
      invalidForm.setErrors({ invalid: true });

      // Act
      const result = await service.submitRecipe(invalidForm);

      // Assert
      expect(result).toBeFalse();
      expect(mockNotification.showToast).toHaveBeenCalledWith('error', 'Por favor complete todos los campos requeridos');
    });

    it('RU-15: sin imágenes muestra error y retorna false', async () => {
      // Arrange
      mockImageService.images = [];

      // Act
      const result = await service.submitRecipe(validForm);

      // Assert
      expect(result).toBeFalse();
      expect(mockNotification.showToast).toHaveBeenCalledWith('error', 'Debe subir al menos una imagen');
    });

    it('RU-16: sin usuario logueado redirige a login (Stub null)', async () => {
      // Arrange
      mockAuth.getCurrentUser.and.returnValue(null);

      // Act
      const result = await service.submitRecipe(validForm);

      // Assert
      expect(result).toBeFalse();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('RU-17: submit exitoso en modo creación guarda y resetea (Spy)', async () => {
      // Arrange
      mockDataService.isEditMode = false;

      // Act
      const result = await service.submitRecipe(validForm);

      // Assert
      expect(result).toBeTrue();
      expect(mockDataService.saveRecipe).toHaveBeenCalled();
      expect(mockNotification.showToast).toHaveBeenCalledWith('success', 'Receta cargada correctamente');
      expect(mockImageService.resetImages).toHaveBeenCalled();
      expect(mockDataService.resetRecipeId).toHaveBeenCalled();
    });

    it('RU-18: submit exitoso en modo edición no resetea form', async () => {
      // Arrange
      mockDataService.isEditMode = true;

      // Act
      const result = await service.submitRecipe(validForm);

      // Assert
      expect(result).toBeTrue();
      expect(mockNotification.showToast).toHaveBeenCalledWith('success', 'Receta actualizada correctamente');
      expect(mockImageService.resetImages).not.toHaveBeenCalled();
    });
  });

  // ──────────── validate delegations ────────────
  describe('Validate delegations', () => {
    it('RU-19: validateField delega al FormService', () => {
      const form = fb.group({ name: [''] });
      service.validateField(form, 'name');
      expect(mockFormService.validateField).toHaveBeenCalledWith(form, 'name');
    });

    it('RU-20: validateArrayField delega al FormService', () => {
      const arr = fb.array(['']);
      service.validateArrayField(arr, 0);
      expect(mockFormService.validateArrayField).toHaveBeenCalledWith(arr, 0);
    });
  });

  describe('onDeleteCurrentImage', () => {
    it('RU-25: no pide confirmacion si no hay imagenes', async () => {
      mockImageService.images = [];

      const result = await service.onDeleteCurrentImage();

      expect(result).toBeUndefined();
      expect(mockNotification.showConfirmation).not.toHaveBeenCalled();
    });

    it('RU-26: pide confirmacion cuando hay imagen actual', async () => {
      mockNotification.showConfirmation.and.returnValue(Promise.resolve({ isConfirmed: true }));

      await service.onDeleteCurrentImage();

      expect(mockNotification.showConfirmation).toHaveBeenCalledWith(
        'Eliminar imagen',
        jasmine.stringContaining('seguro')
      );
    });
  });
});
