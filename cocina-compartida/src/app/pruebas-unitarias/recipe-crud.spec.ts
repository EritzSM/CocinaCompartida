/**
 * ============================================================
 * PRUEBAS UNITARIAS - FUNCIONALIDAD 3: CRUD DE RECETAS
 * ============================================================
 * Caminos independientes: 5
 * Pruebas unitarias: 5 × 2 = 10
 * Tipo: Solo Assertion (sin mocks)
 * Servicios bajo prueba: RecipeFormService, RecipeCrudService, RecipeStateService
 * Lógica: Validación de formularios, preparación de datos, estado CRUD
 * ============================================================
 */

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ReactiveFormsModule, FormArray, Validators } from '@angular/forms';
import { RecipeFormService } from '../shared/services/recipe-form.service';
import { RecipeCrudService } from '../shared/services/recipe-crud.service';
import { RecipeStateService } from '../shared/services/recipe-state.service';
import { Recipe } from '../shared/interfaces/recipe';

describe('Funcionalidad 3: CRUD de Recetas', () => {
  let formService: RecipeFormService;
  let crudService: RecipeCrudService;
  let stateService: RecipeStateService;
  let httpTesting: HttpTestingController;

  // Datos de prueba
  const testRecipes: Recipe[] = [
    {
      id: 'crud-001', name: 'Tamal Tolimense',
      descripcion: 'Tamal envuelto en hoja de plátano con masa de arroz',
      ingredients: ['arroz', 'cerdo', 'pollo', 'arvejas', 'zanahoria'],
      steps: ['Preparar masa', 'Cocinar relleno', 'Envolver en hojas', 'Cocinar al vapor'],
      images: ['tamal1.jpg'], user: { id: 'owner-1', username: 'chef_tolima' },
      category: 'Almuerzo', likes: 18, likedBy: ['u2', 'u3']
    },
    {
      id: 'crud-002', name: 'Changua',
      descripcion: 'Caldo de leche con huevo y cebolla, desayuno boyacense',
      ingredients: ['leche', 'huevo', 'cebolla', 'cilantro'],
      steps: ['Hervir leche', 'Agregar huevo', 'Servir con pan'],
      images: [], user: { id: 'owner-2', username: 'chef_boyaca' },
      category: 'Desayuno', likes: 6, likedBy: ['u1']
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    });

    httpTesting = TestBed.inject(HttpTestingController);
    formService = TestBed.inject(RecipeFormService);
    crudService = TestBed.inject(RecipeCrudService);
    stateService = TestBed.inject(RecipeStateService);

    stateService.setRecipes([...testRecipes]);
  });

  afterEach(() => {
    httpTesting.match(() => true);
  });

  // ===================================================================
  // CAMINO 1: Creación de Formulario de Receta
  // Verifica que el formulario se crea con la estructura y validadores correctos
  // ===================================================================
  describe('Camino 1: Creación de Formulario', () => {

    it('C1.1 [PASA] - createRecipeForm genera formulario con todos los campos requeridos', () => {
      // PRUEBA POSITIVA: el formulario debe tener name, descripcion, category, ingredients, steps
      const form = formService.createRecipeForm();

      expect(form.get('name')).toBeTruthy();
      expect(form.get('descripcion')).toBeTruthy();
      expect(form.get('category')).toBeTruthy();
      expect(form.get('ingredients')).toBeTruthy();
      expect(form.get('steps')).toBeTruthy();

      // Verificar que ingredients y steps son FormArrays con al menos 1 elemento
      const ingredients = form.get('ingredients') as FormArray;
      const steps = form.get('steps') as FormArray;
      expect(ingredients.length).toBe(1);
      expect(steps.length).toBe(1);

      // Verificar que el formulario inicia como inválido (campos vacíos)
      expect(form.valid).toBeFalse();
    });

    it('C1.2 [BUSCA FRAGILIDAD] - Formulario con nombre de 1 carácter no pasa minLength(2)', () => {
      // FRAGILIDAD: ¿Qué pasa con nombres de 1 carácter? El validador requiere minLength(2)
      const form = formService.createRecipeForm();
      form.patchValue({
        name: 'A', // Solo 1 carácter - debería ser inválido
        descripcion: 'Una descripción válida de más de 10 caracteres',
        category: 'Almuerzo'
      });

      const nameControl = form.get('name');
      expect(nameControl!.valid).toBeFalse();
      expect(nameControl!.errors?.['minlength']).toBeTruthy();

      // Sin embargo, un nombre de 2 caracteres SÍ debería ser válido
      form.patchValue({ name: 'AB' });
      expect(form.get('name')!.errors?.['minlength']).toBeFalsy();
    });
  });

  // ===================================================================
  // CAMINO 2: Preparación de Datos del Formulario (prepareFormData)
  // Verifica la limpieza y filtrado de datos antes de enviar al servidor
  // ===================================================================
  describe('Camino 2: Preparación de Datos', () => {

    it('C2.1 [PASA] - prepareFormData filtra ingredientes vacíos y recorta espacios', () => {
      // PRUEBA POSITIVA: ingredientes vacíos se eliminan, strings se recortan
      const form = formService.createRecipeForm();
      form.patchValue({
        name: '  Arepas  ',
        descripcion: '  Arepas de maíz con queso  ',
        category: 'Desayuno'
      });

      // Agregar ingredientes (algunos vacíos)
      const ingredients = form.get('ingredients') as FormArray;
      ingredients.at(0).setValue('maíz');
      formService.addFormArrayItem(ingredients);
      ingredients.at(1).setValue(''); // Vacío - debe filtrarse
      formService.addFormArrayItem(ingredients);
      ingredients.at(2).setValue('queso');

      const steps = form.get('steps') as FormArray;
      steps.at(0).setValue('Moler maíz');

      const data = formService.prepareFormData(form, ['img1.jpg']);

      expect(data.name).toBe('Arepas'); // Recortado
      expect(data.descripcion).toBe('Arepas de maíz con queso'); // Recortado
      expect(data.ingredients.length).toBe(2); // Solo 'maíz' y 'queso'
      expect(data.ingredients).toEqual(['maíz', 'queso']);
      expect(data.images).toEqual(['img1.jpg']);
    });

    it('C2.2 [BUSCA FRAGILIDAD] - prepareFormData con todos los ingredientes vacíos deja array vacío', () => {
      // FRAGILIDAD: Si TODOS los ingredientes son vacíos, se envía array vacío al servidor
      // ¿El backend acepta una receta sin ingredientes? No hay validación frontend para esto
      const form = formService.createRecipeForm();
      form.patchValue({
        name: 'Receta Vacía',
        descripcion: 'Una receta sin ingredientes reales',
        category: 'Cena'
      });

      const ingredients = form.get('ingredients') as FormArray;
      ingredients.at(0).setValue('   '); // Solo espacios
      formService.addFormArrayItem(ingredients);
      ingredients.at(1).setValue(''); // Vacío

      const steps = form.get('steps') as FormArray;
      steps.at(0).setValue('   '); // Solo espacios

      const data = formService.prepareFormData(form, []);
      // Ambos ingredientes deberían filtrarse
      expect(data.ingredients.length).toBe(0); // Array vacío enviado al servidor
      expect(data.steps.length).toBe(0); // Steps también vacíos
      // FRAGILIDAD: No hay validación que impida enviar receta sin ingredientes ni pasos
    });
  });

  // ===================================================================
  // CAMINO 3: Validación de Campos del Formulario
  // Verifica los métodos validateField y validateArrayField
  // ===================================================================
  describe('Camino 3: Validación de Campos', () => {

    it('C3.1 [PASA] - validateField retorna true para campo inválido y tocado', () => {
      // PRUEBA POSITIVA: campo requerido vacío + touched = inválido
      const form = formService.createRecipeForm();
      const nameControl = form.get('name');

      // El campo está vacío pero no tocado → validateField = false
      expect(formService.validateField(form, 'name')).toBeFalse();

      // Marcar como tocado
      nameControl!.markAsTouched();
      // Ahora está vacío Y tocado → validateField = true
      expect(formService.validateField(form, 'name')).toBeTrue();
    });

    it('C3.2 [BUSCA FRAGILIDAD] - validateField con nombre de campo inexistente retorna false', () => {
      // FRAGILIDAD: ¿Qué pasa si se llama validateField con un campo que no existe?
      // El código hace: const field = form.get(fieldName); return field ? field.invalid && field.touched : false;
      // Si el campo no existe, field es null → retorna false (silenciosamente)
      const form = formService.createRecipeForm();
      const result = formService.validateField(form, 'campoInexistente');
      expect(result).toBeFalse();
      // FRAGILIDAD: No lanza error ni alerta. Un typo en el nombre del campo
      // causaría que la validación nunca se muestre al usuario
    });
  });

  // ===================================================================
  // CAMINO 4: Manipulación de FormArray (agregar/eliminar items)
  // Verifica las operaciones de agregar y eliminar en arrays dinámicos
  // ===================================================================
  describe('Camino 4: Manipulación de FormArray', () => {

    it('C4.1 [PASA] - removeFormArrayItem elimina correctamente por encima del mínimo', () => {
      // PRUEBA POSITIVA: con 3 items, eliminar uno debe dejar 2
      const form = formService.createRecipeForm();
      const ingredients = form.get('ingredients') as FormArray;

      // Agregar 2 más (total 3)
      formService.addFormArrayItem(ingredients);
      formService.addFormArrayItem(ingredients);
      expect(ingredients.length).toBe(3);

      // Eliminar el segundo (index 1)
      const removed = formService.removeFormArrayItem(ingredients, 1, 1);
      expect(removed).toBeTrue();
      expect(ingredients.length).toBe(2);
    });

    it('C4.2 [BUSCA FRAGILIDAD] - removeFormArrayItem en el límite mínimo retorna false', () => {
      // FRAGILIDAD: Con solo 1 item y minItems=1, no se puede eliminar
      const form = formService.createRecipeForm();
      const ingredients = form.get('ingredients') as FormArray;
      expect(ingredients.length).toBe(1);

      // Intentar eliminar el único item
      const removed = formService.removeFormArrayItem(ingredients, 0, 1);
      expect(removed).toBeFalse();
      expect(ingredients.length).toBe(1); // No se eliminó

      // FRAGILIDAD: ¿Qué pasa si minItems = 0?
      const removedWithZeroMin = formService.removeFormArrayItem(ingredients, 0, 0);
      // length (1) <= minItems (0) es falso, así que debería permitir eliminación
      expect(removedWithZeroMin).toBeTrue();
      expect(ingredients.length).toBe(0);
      // FRAGILIDAD: Ahora el array tiene 0 items, el formulario queda sin ingredientes
    });
  });

  // ===================================================================
  // CAMINO 5: Preparación de Payload para API (prepareRecipePayload)
  // Verifica la transformación de datos antes de enviar al backend
  // ===================================================================
  describe('Camino 5: Preparación de Payload para API', () => {

    it('C5.1 [PASA] - prepareRecipePayload recorta strings y preserva arrays', () => {
      // PRUEBA POSITIVA: el payload se prepara correctamente
      const input = {
        name: '  Tamales  ',
        descripcion: '  Tamales colombianos  ',
        ingredients: ['masa', 'cerdo'],
        steps: ['Preparar', 'Envolver'],
        images: ['img.jpg'],
        category: 'Almuerzo'
      };
      const payload = (crudService as any).prepareRecipePayload(input);
      expect(payload.name).toBe('Tamales');
      expect(payload.descripcion).toBe('Tamales colombianos');
      expect(payload.ingredients).toEqual(['masa', 'cerdo']);
      expect(payload.steps).toEqual(['Preparar', 'Envolver']);
      expect(payload.images).toEqual(['img.jpg']);
    });

    it('C5.2 [BUSCA FRAGILIDAD] - prepareRecipePayload con campos undefined usa nullish coalescing', () => {
      // FRAGILIDAD: ¿Qué pasa si no se pasan ingredients, steps, o images?
      // El código usa: recipeInput.ingredients ?? [] (nullish coalescing)
      const input = {
        name: 'Receta Mínima',
        descripcion: 'Solo nombre y descripción',
        // Sin ingredients, steps, images
        category: 'Cena'
      } as any;

      const payload = (crudService as any).prepareRecipePayload(input);

      // Nullish coalescing protege contra undefined
      expect(payload.ingredients).toEqual([]);
      expect(payload.steps).toEqual([]);
      expect(payload.images).toEqual([]);

      // Pero ¿qué pasa si name es undefined?
      const inputNoName = { descripcion: 'test' } as any;
      const payloadNoName = (crudService as any).prepareRecipePayload(inputNoName);
      // undefined?.trim() → undefined (optional chaining con ?)
      expect(payloadNoName.name).toBeUndefined();
      // FRAGILIDAD: El servidor recibiría name: undefined, lo cual podría causar error
    });
  });
});
