import { Component, inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
  recipeService = inject(RecipeService);

  constructor(private fb: FormBuilder) {
    this.recipeForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      ingredients: this.fb.array([this.fb.control('', Validators.required)]),
      steps: this.fb.array([this.fb.control('', Validators.required)])
    });
  }

  get ingredients(): FormArray {
    return this.recipeForm.get('ingredients') as FormArray;
  }

  get steps(): FormArray {
    return this.recipeForm.get('steps') as FormArray;
  }

  addIngredient(): void {
    this.ingredients.push(this.fb.control('', Validators.required));
  }

  removeIngredient(index: number): void {
    if (this.ingredients.length > 1) {
      this.ingredients.removeAt(index);
    }
  }

  addStep(): void {
    this.steps.push(this.fb.control('', Validators.required));
  }

  removeStep(index: number): void {
    if (this.steps.length > 1) {
      this.steps.removeAt(index);
    }
  }

  onUploadFile(event: any): void {
    const files = event.target.files;
    if (files) {
      for (let file of files) {
        const reader = new FileReader();
        reader.onload = (e: any) => this.images.push(e.target.result);
        reader.readAsDataURL(file);
      }
    }
  }

  nextImage(): void {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
  }

  prevImage(): void {
    this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
  }

  onSubmit(): void {
    this.recipeForm.markAllAsTouched();

    if (this.recipeForm.invalid || this.images.length === 0) {
      return;
    }

    const filteredIngredients = this.recipeForm.value.ingredients.filter((ing: string) => ing && ing.trim() !== '');
    const filteredSteps = this.recipeForm.value.steps.filter((step: string) => step && step.trim() !== '');

    if (filteredIngredients.length === 0 || filteredSteps.length === 0) {
      return;
    }

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
    
    this.recipeForm.reset();
    this.images = [];
    this.currentIndex = 0;

    this.router.navigate(['home']);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.recipeForm.get(fieldName);
    return !!field && field.invalid && field.touched;
  }

  isArrayFieldInvalid(formArray: FormArray, index: number): boolean {
    const control = formArray.at(index);
    return control.invalid && control.touched;
  }
}