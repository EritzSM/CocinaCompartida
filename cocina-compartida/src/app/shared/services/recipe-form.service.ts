import { Injectable, inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class RecipeFormService {
  private fb = inject(FormBuilder);

  createRecipeForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      category: ['', [Validators.required]],
      ingredients: this.fb.array([this.fb.control('', Validators.required)]),
      steps: this.fb.array([this.fb.control('', Validators.required)])
    });
  }

  clearAndLoadFormArray(formArray: FormArray, items: string[]): void {
    formArray.clear();
    items.forEach(item => formArray.push(this.fb.control(item, Validators.required)));
  }

  addFormArrayItem(formArray: FormArray): void {
    formArray.push(this.fb.control('', Validators.required));
  }

  removeFormArrayItem(formArray: FormArray, index: number, minItems: number = 1): boolean {
    if (formArray.length <= minItems) {
      return false;
    }
    formArray.removeAt(index);
    return true;
  }

  markAllFieldsAsTouched(form: FormGroup): void {
    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      if (control instanceof FormArray) {
        control.controls.forEach(arrayControl => {
          arrayControl.markAsTouched();
        });
      } else {
        control?.markAsTouched();
      }
    });
  }

  validateField(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }

  validateArrayField(formArray: FormArray, index: number): boolean {
    const control = formArray.at(index);
    return control.invalid && control.touched;
  }

  prepareFormData(form: FormGroup, images: string[]): any {
    const filteredIngredients = form.value.ingredients
      .filter((ing: string) => ing?.trim() !== '');
    const filteredSteps = form.value.steps
      .filter((step: string) => step?.trim() !== '');

    return {
      name: form.value.name.trim(),
      descripcion: form.value.descripcion.trim(),
      category: form.value.category,
      ingredients: filteredIngredients,
      steps: filteredSteps,
      images: images,
    };
  }
}