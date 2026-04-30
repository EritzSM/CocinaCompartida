import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormArray, FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import Swal from 'sweetalert2';
import { RecipeUpload } from '../features/pages/recipe-upload/recipe-upload';
import { RecipeUploadService } from '../shared/services/recipe-upload.service';

describe('RecipeUpload Component - cobertura complementaria', () => {
  let fixture: ComponentFixture<RecipeUpload>;
  let component: RecipeUpload;
  let uploadService: any;
  let router: jasmine.SpyObj<Router>;
  let fb: FormBuilder;

  async function createComponent(params: Record<string, string> = {}) {
    fb = new FormBuilder();
    router = jasmine.createSpyObj('Router', ['navigate']);
    router.navigate.and.returnValue(Promise.resolve(true));

    uploadService = {
      images: ['img-1.jpg', 'img-2.jpg'],
      currentIndex: 1,
      isUploading: false,
      isEditMode: false,
      createRecipeForm: jasmine.createSpy('createRecipeForm').and.returnValue(
        fb.group({
          name: ['Arepa'],
          descripcion: ['Receta de prueba'],
          ingredients: fb.array(['maiz']),
          steps: fb.array(['asar']),
        }),
      ),
      initializeEditMode: jasmine.createSpy('initializeEditMode'),
      addFormArrayItem: jasmine.createSpy('addFormArrayItem'),
      removeFormArrayItem: jasmine.createSpy('removeFormArrayItem'),
      uploadFiles: jasmine.createSpy('uploadFiles').and.returnValue(Promise.resolve(true)),
      removeImage: jasmine.createSpy('removeImage'),
      navigateImages: jasmine.createSpy('navigateImages'),
      submitRecipe: jasmine.createSpy('submitRecipe').and.returnValue(Promise.resolve(true)),
      validateField: jasmine.createSpy('validateField').and.returnValue(false),
      validateArrayField: jasmine.createSpy('validateArrayField').and.returnValue(false),
    };

    await TestBed.configureTestingModule({
      imports: [RecipeUpload, ReactiveFormsModule],
      providers: [
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { params: of(params) } },
      ],
    })
      .overrideComponent(RecipeUpload, {
        set: {
          providers: [{ provide: RecipeUploadService, useValue: uploadService }],
          template: '<div></div>',
          imports: [ReactiveFormsModule],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(RecipeUpload);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
    await createComponent();
  });

  it('RU-C01: expone getters desde RecipeUploadService', () => {
    expect(component.images).toEqual(['img-1.jpg', 'img-2.jpg']);
    expect(component.currentIndex).toBe(1);
    expect(component.isUploading).toBeFalse();
    expect(component.isEditMode).toBeFalse();
  });

  it('RU-C02: delega operaciones de ingredientes y pasos', () => {
    component.addIngredient();
    component.removeIngredient(0);
    component.addStep();
    component.removeStep(0);

    expect(uploadService.addFormArrayItem).toHaveBeenCalledTimes(2);
    expect(uploadService.removeFormArrayItem).toHaveBeenCalledTimes(2);
  });

  it('RU-C03: sube archivos y limpia el input', async () => {
    const file = new File(['img'], 'img.jpg', { type: 'image/jpeg' });
    const event = { target: { files: [file], value: 'C:/fake/img.jpg' } };

    await component.onUploadFile(event);

    expect(uploadService.uploadFiles).toHaveBeenCalledWith([file]);
    expect(event.target.value).toBe('');
  });

  it('RU-C04: no elimina imagen si no hay imagenes', () => {
    uploadService.images = [];

    component.onDeleteCurrentImage();

    expect(Swal.fire).not.toHaveBeenCalled();
    expect(uploadService.removeImage).not.toHaveBeenCalled();
  });

  it('RU-C05: confirma y elimina la imagen actual', async () => {
    component.onDeleteCurrentImage();
    await Promise.resolve();

    expect(Swal.fire).toHaveBeenCalled();
    expect(uploadService.removeImage).toHaveBeenCalledWith(1);
  });

  it('RU-C06: navega imagenes y delega validaciones', async () => {
    const array = component.ingredients;

    component.nextImage();
    component.prevImage();
    await component.onSubmit();
    component.isFieldInvalid('name');
    component.isArrayFieldInvalid(array, 0);

    expect(uploadService.navigateImages).toHaveBeenCalledWith('next');
    expect(uploadService.navigateImages).toHaveBeenCalledWith('prev');
    expect(uploadService.submitRecipe).toHaveBeenCalledWith(component.recipeForm);
    expect(uploadService.validateField).toHaveBeenCalledWith(component.recipeForm, 'name');
    expect(uploadService.validateArrayField).toHaveBeenCalledWith(array, 0);
  });

  it('RU-C07: inicializa modo edicion cuando la ruta trae id', async () => {
    TestBed.resetTestingModule();
    await createComponent({ id: 'recipe-99' });

    expect(uploadService.initializeEditMode).toHaveBeenCalled();
  });

  it('RU-C08: redirige a home cuando no puede inicializar la edicion', async () => {
    TestBed.resetTestingModule();
    await createComponent({ id: 'recipe-404' });
    const callback = uploadService.initializeEditMode.calls.mostRecent().args[2] as (success: boolean) => void;

    callback(false);

    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  });
});
