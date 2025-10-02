import { Component, inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { RecipeService } from '../../../shared/services/recipe';
import { Auth } from '../../../shared/services/auth';
@Component({
  selector: 'app-recipe-upload',
  standalone: true, // 👈 standalone component
  imports: [CommonModule, ReactiveFormsModule], // 👈 aquí importas lo necesario
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
      name: [''],
      descripcion: [''],
      ingredients: this.fb.array([this.fb.control('')]),
      steps: this.fb.array([this.fb.control('')])
    });
  }

  get ingredients() {
    return this.recipeForm.get('ingredients') as FormArray;
  }

  get steps() {
    return this.recipeForm.get('steps') as FormArray;
  }

  addIngredient() {
    this.ingredients.push(this.fb.control(''));
  }

  removeIngredient(index: number) {
    this.ingredients.removeAt(index);
  }

  addStep() {
    this.steps.push(this.fb.control(''));
  }

  removeStep(index: number) {
    this.steps.removeAt(index);
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

  onSubmit() {
    const recipe = {
      name: this.recipeForm.value.name,
      descripcion: this.recipeForm.value.descripcion,
      ingredients: this.recipeForm.value.ingredients,
      steps: this.recipeForm.value.steps,
      images: this.images,
      author: this.authService.currentUsername(),
      avatar: this.authService.currentAvatar()
    };

    this.recipeService.addRecipe(recipe); // 👈 guardar en el servicio

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
  }

