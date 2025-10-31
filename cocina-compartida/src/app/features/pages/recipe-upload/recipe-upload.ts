// recipe-upload.ts
import { Component, inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { RecipeService } from '../../../shared/services/recipe';
import { Auth } from '../../../shared/services/auth';
import { UploadService } from '../../../shared/services/upload';
import { Storage } from '../../../shared/services/storage';
import { v4 as uuidv4 } from 'uuid';
import { Recipe } from '../../../shared/interfaces/recipe';

@Component({
  selector: 'app-recipe-upload',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './recipe-upload.html',
  styleUrls: ['./recipe-upload.css']
})
export class RecipeUpload {
  recipeForm: FormGroup;
  images: string[] = [];
  currentIndex = 0;
  isUploading = false;
  isEditMode = false;
  recipeIdToEdit: string | null = null;
  // Id provisional/definitivo de la receta para crear la subcarpeta en el bucket
  private recipeId: string = uuidv4();
  
  router = inject(Router);
  route = inject(ActivatedRoute);
  authService = inject(Auth);
  recipeService = inject(RecipeService);
  uploadService = inject(UploadService);
  storage = inject(Storage);

  constructor(private fb: FormBuilder) {
    this.recipeForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      category: ['', [Validators.required]],
      ingredients: this.fb.array([this.fb.control('', Validators.required)]),
      steps: this.fb.array([this.fb.control('', Validators.required)])
    });

    // Detectar modo edición
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.isEditMode = true;
        this.recipeIdToEdit = id;
        // Si estamos en modo edición, usamos el id existente
        this.recipeId = id;
        const recipe = this.recipeService.recipes().find(r => r.id === id);
        if (!recipe) {
          this.showToast('error', 'Receta no encontrada');
          this.router.navigate(['/home']);
          return;
        }

        const currentUser = this.authService.getUserProfile();
        const username = currentUser ? currentUser.username : '';
        if (recipe.author !== username) {
          this.showToast('error', 'No tienes permiso para editar esta receta');
          this.router.navigate(['/home']);
          return;
        }

        this.loadRecipeIntoForm(recipe);
      }
    });
  }

  private loadRecipeIntoForm(recipe: Recipe) {
    this.recipeForm.patchValue({
      name: recipe.name,
      descripcion: recipe.descripcion,
    });

    // Cargar arrays
    this.ingredients.clear();
    recipe.ingredients.forEach(ing => this.ingredients.push(this.fb.control(ing, Validators.required)));

    this.steps.clear();
    recipe.steps.forEach(step => this.steps.push(this.fb.control(step, Validators.required)));

    // Cargar imágenes
    this.images = [...recipe.images];
    this.currentIndex = 0;
  }

  get ingredients() {
    return this.recipeForm.get('ingredients') as FormArray;
  }

  // Helpers para arrays
  private getArray(controlName: string): FormArray {
    return this.recipeForm.get(controlName) as FormArray;
  }

  get steps() {
    return this.recipeForm.get('steps') as FormArray;
  }

  addIngredient() {
    this.ingredients.push(this.fb.control('', Validators.required));
  }

  removeIngredient(index: number) {
    if (this.ingredients.length > 1) {
      this.ingredients.removeAt(index);
    } else {
      this.showToast('warning', 'Debe haber al menos un ingrediente');
    }
  }

  addStep() {
    this.steps.push(this.fb.control('', Validators.required));
  }

  removeStep(index: number) {
    if (this.steps.length > 1) {
      this.steps.removeAt(index);
    } else {
      this.showToast('warning', 'Debe haber al menos un paso');
    }
  }

  async onUploadFile(event: any) {
    const files: File[] = Array.from(event.target.files);
    
    if (!files.length) return;

    this.isUploading = true;

    try {
      const result = await this.uploadService.uploadMultipleFiles(files, this.recipeId);
      
      if (result.success && result.data) {
        this.images.push(...result.data as string[]);
        this.showToast('success', 'Imágenes subidas correctamente');
      } else {
        this.showToast('error', result.error || 'Error al subir imágenes');
      }
    } catch (error: any) {
      this.showToast('error', error.message || 'Error al subir imágenes');
    } finally {
      this.isUploading = false;
      event.target.value = '';
    }
  }

  async removeImage(index: number) {
    if (index < 0 || index >= this.images.length) return;

    const url = this.images[index];

    // Intentar eliminar la imagen del bucket si es una URL o ruta válida
    try {
      await this.storage.deletePhotoByPublicUrl(url);
      this.showToast('success', 'Imagen eliminada del almacenamiento');
    } catch (e) {
      // No bloqueamos la operación si falla la eliminación remota
      console.error('No se pudo eliminar la imagen del bucket:', e);
      this.showToast('warning', 'No se pudo eliminar la imagen del servidor, se eliminará localmente');
    }

    // Eliminar localmente
    this.images.splice(index, 1);
    if (this.currentIndex >= this.images.length) {
      this.currentIndex = Math.max(0, this.images.length - 1);
    }
  }

  // Handler para el botón de eliminar la imagen actualmente visible
  onDeleteCurrentImage() {
    if (this.images.length === 0) return;
    const idx = this.currentIndex;
    // Confirmación rápida
    Swal.fire({
      title: 'Eliminar imagen',
      text: '¿Estás seguro que quieres eliminar esta imagen?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.removeImage(idx);
      }
    });
  }

  nextImage() {
    if (this.images.length > 0) {
      this.currentIndex = (this.currentIndex + 1) % this.images.length;
    }
  }

  prevImage() {
    if (this.images.length > 0) {
      this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
    }
  }

  async onSubmit() {
    this.markAllFieldsAsTouched();

    if (this.recipeForm.invalid) {
      this.showToast('error', 'Por favor complete todos los campos requeridos');
      return;
    }

    if (this.images.length === 0) {
      this.showToast('error', 'Debe subir al menos una imagen');
      return;
    }

    // Filtrar ingredientes y pasos vacíos
    const filteredIngredients = this.recipeForm.value.ingredients
      .filter((ing: string) => ing && ing.trim() !== '');
    const filteredSteps = this.recipeForm.value.steps
      .filter((step: string) => step && step.trim() !== '');

    const payload = {
      name: this.recipeForm.value.name.trim(),
      descripcion: this.recipeForm.value.descripcion.trim(),
      category: this.recipeForm.value.category,
      ingredients: filteredIngredients,
      steps: filteredSteps,
      images: this.images,
      author: this.authService.currentUsername(),
      avatar: this.authService.currentAvatar(),
      userId: this.authService.getUserId()
    };

    if (this.isEditMode && this.recipeIdToEdit) {
      this.recipeService.updateRecipe(this.recipeIdToEdit, payload);
      this.showToast('success', 'Receta actualizada correctamente');
      this.router.navigate(['/recipe', this.recipeIdToEdit]);
      return;
    }

    const recipe = {
      id: this.recipeId,
      ...payload
    };

    this.recipeService.addRecipe(recipe);

    // Resetear y redirigir
    this.recipeForm.reset();
    this.images = [];
    this.currentIndex = 0;
    this.router.navigate(['home']);

    this.showToast('success', 'Receta cargada correctamente');
  }

  private markAllFieldsAsTouched() {
    Object.keys(this.recipeForm.controls).forEach(key => {
      const control = this.recipeForm.get(key);
      if (control instanceof FormArray) {
        control.controls.forEach(arrayControl => {
          arrayControl.markAsTouched();
        });
      } else {
        control?.markAsTouched();
      }
    });
  }

  private showToast(icon: 'success' | 'error' | 'warning', title: string) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon,
      title,
      showConfirmButton: false,
      timer: 3000
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.recipeForm.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }

  isArrayFieldInvalid(formArray: FormArray, index: number): boolean {
    const control = formArray.at(index);
    return control.invalid && control.touched;
  }
}