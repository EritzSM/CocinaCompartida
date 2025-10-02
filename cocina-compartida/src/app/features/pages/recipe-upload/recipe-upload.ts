import { Component, inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'; // Agregar Validators
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { RecipeService } from '../../../shared/services/recipe';
import { Auth } from '../../../shared/services/auth';
import { v4 as uuidv4 } from 'uuid';

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
  router = inject(Router);
  authService = inject(Auth);
  recipeService = inject(RecipeService)

  constructor(private fb: FormBuilder) {
    this.recipeForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      ingredients: this.fb.array([this.fb.control('', Validators.required)]),
      steps: this.fb.array([this.fb.control('', Validators.required)])
    });
  }

  get ingredients() {
    return this.recipeForm.get('ingredients') as FormArray;
  }

  get steps() {
    return this.recipeForm.get('steps') as FormArray;
  }

  addIngredient() {
    this.ingredients.push(this.fb.control('', Validators.required));
  }

  removeIngredient(index: number) {
    // No permitir eliminar si solo queda un ingrediente
    if (this.ingredients.length > 1) {
      this.ingredients.removeAt(index);
    } else {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'Debe haber al menos un ingrediente',
        showConfirmButton: false,
        timer: 3000
      });
    }
  }

  addStep() {
    this.steps.push(this.fb.control('', Validators.required));
  }

  removeStep(index: number) {
    // No permitir eliminar si solo queda un paso
    if (this.steps.length > 1) {
      this.steps.removeAt(index);
    } else {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'Debe haber al menos un paso',
        showConfirmButton: false,
        timer: 3000
      });
    }
  }

  onUploadFile(event: any) {
    const files = event.target.files;
    if (files) {
      for (let file of files) {
        const reader = new FileReader();
        reader.onload = (e: any) => this.images.push(e.target.result);
        reader.readAsDataURL(file);
      }
    }
  }

  nextImage() {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
  }

  prevImage() {
    this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
  }

  // Método para validar si un array del formulario está vacío
  private isArrayEmpty(formArray: FormArray): boolean {
    return formArray.controls.every(control => !control.value || control.value.trim() === '');
  }

  // Método para validar si hay campos vacíos en los arrays
  private validateArrays(): boolean {
    const ingredientsEmpty = this.isArrayEmpty(this.ingredients);
    const stepsEmpty = this.isArrayEmpty(this.steps);

    if (ingredientsEmpty) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Debe agregar al menos un ingrediente',
        showConfirmButton: false,
        timer: 3000
      });
      return false;
    }

    if (stepsEmpty) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Debe agregar al menos un paso',
        showConfirmButton: false,
        timer: 3000
      });
      return false;
    }

    return true;
  }

  onSubmit() {
    // Marcar todos los campos como tocados para mostrar errores
    this.markAllFieldsAsTouched();

    // Validar formulario
    if (this.recipeForm.invalid) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Por favor complete todos los campos requeridos',
        showConfirmButton: false,
        timer: 3000
      });
      return;
    }

    // Validar arrays (ingredientes y pasos)
    if (!this.validateArrays()) {
      return;
    }

    // Validar que haya al menos una imagen
    if (this.images.length === 0) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Debe subir al menos una imagen',
        showConfirmButton: false,
        timer: 3000
      });
      return;
    }

    // Filtrar ingredientes y pasos vacíos
    const filteredIngredients = this.recipeForm.value.ingredients.filter((ing: string) => ing && ing.trim() !== '');
    const filteredSteps = this.recipeForm.value.steps.filter((step: string) => step && step.trim() !== '');

    const recipe = {
      id: uuidv4(),
      name: this.recipeForm.value.name.trim(),
      descripcion: this.recipeForm.value.descripcion.trim(),
      ingredients: filteredIngredients,
      steps: filteredSteps,
      images: this.images,
      author: this.authService.currentUsername(),
      avatar: this.authService.currentAvatar()
    };

    this.recipeService.addRecipe(recipe);

    // Resetear
    this.recipeForm.reset();
    this.images = [];
    this.currentIndex = 0;

    // Redirigir al home
    this.router.navigate(['home']);

    // Notificación
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Receta cargada correctamente',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true
    });
  }

  // Método para marcar todos los campos como tocados
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

  // Métodos auxiliares para mostrar errores en el HTML
  isFieldInvalid(fieldName: string): boolean {
    const field = this.recipeForm.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }

  isArrayFieldInvalid(formArray: FormArray, index: number): boolean {
    const control = formArray.at(index);
    return control.invalid && control.touched;
  }
}