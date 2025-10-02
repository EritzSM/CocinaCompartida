import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Recipe, RecipeService } from '../../../shared/services/recipe'; // Ajusta la ruta si es necesario

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [CommonModule, RouterLink], // Importamos CommonModule y RouterLink
  templateUrl: './recipe-detail.html',
  styleUrls: ['./recipe-detail.css']
})
export class RecipeDetail implements OnInit {
  recipe: Recipe | undefined;
  currentIndex: number = 0;

  // Inyección de servicios
  private route = inject(ActivatedRoute);
  private recipeService = inject(RecipeService);

  // En recipe-detail.component.ts

  ngOnInit() {
    this.route.params.subscribe(params => {
      // 1. Obtener el parámetro 'id' de la URL (es un string)
      const recipeId = params['id'];

      // 2. Obtener todas las recetas
      const recipesList = this.recipeService.recipes();

      // 3. Buscar la receta cuyo 'id' coincida con el parámetro
      this.recipe = recipesList.find(r => r.id === recipeId);

      // Manejo de error si la receta no se encuentra
      if (!this.recipe) {
        console.error("Receta no encontrada o ID inválido.");
      }
    });
  }

  // Lógica del Carrusel
  nextImage() {
    if (this.recipe && this.recipe.images.length > 0) {
      this.currentIndex = (this.currentIndex + 1) % this.recipe.images.length;
    }
  }

  prevImage() {
    if (this.recipe && this.recipe.images.length > 0) {
      this.currentIndex = (this.currentIndex - 1 + this.recipe.images.length) % this.recipe.images.length;
    }
  }
}