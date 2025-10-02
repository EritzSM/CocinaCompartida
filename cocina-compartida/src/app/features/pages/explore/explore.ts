import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecipeService, Recipe } from '../../../shared/services/recipe'; // Ajusta la ruta si es necesario
import { Auth } from '../../../shared/services/auth';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './explore.html',
  styleUrls: ['./explore.css']
})
export class Explore {
  // Inyectamos el servicio para acceder a las recetas
  private recipeService = inject(RecipeService);
  // Obtenemos la señal de solo lectura con la lista de recetas
  recipes = this.recipeService.recipes;
  authService = inject(Auth);
  
  private router = inject(Router);

  // Array completo de recetas (señal)
  allRecipes = this.recipeService.recipes;

  // NUEVA PROPIEDAD: Cantidad de recetas a mostrar inicialmente
  private recipesPerPage = 3;
  // Propiedad para controlar el número total visible
  visibleRecipeCount: number = this.recipesPerPage;

  trackByRecipeId(index: number, recipe: any): number {
    return recipe.id;
  }

  // Propiedad COMPUTADA: Solo devuelve las recetas visibles
  get recipesToShow(): Recipe[] {
    return this.allRecipes().slice(0, this.visibleRecipeCount);
  }

  // Opcional: Para mantener el featuredRecipes si lo sigues usando en otra parte
  // featuredRecipes = this.allRecipes().slice(0, 3);

  // NUEVA FUNCIÓN: Lógica de Carga al Scroll
  @HostListener('window:scroll', ['$event'])
  onScroll(event: any) {
    // 1. Calcular la posición del scroll
    const scrollPosition = window.innerHeight + window.scrollY;
    // 2. Calcular la altura total del contenido de la página (document.body.offsetHeight)
    const pageHeight = document.body.offsetHeight;

    // Si el usuario está cerca del final de la página (por ejemplo, 80% del total)
    // El 90% es un buen umbral para que la carga sea fluida antes de llegar al final.
    if (scrollPosition >= pageHeight * 0.9) {
      this.loadMoreRecipes();
    }
  }

  // NUEVA FUNCIÓN: Aumentar el contador de recetas visibles
  loadMoreRecipes() {
    const totalRecipes = this.allRecipes().length;

    // Solo carga más si aún quedan recetas por mostrar
    if (this.visibleRecipeCount < totalRecipes) {
      // Aumenta el contador en 'recipesPerPage' o hasta el total si quedan menos
      const nextCount = this.visibleRecipeCount + this.recipesPerPage;
      this.visibleRecipeCount = Math.min(nextCount, totalRecipes);

      console.log(`Cargando más recetas. Total visible: ${this.visibleRecipeCount}`);
      // Nota: Si usas una variable de estado para un spinner, este es el lugar para resetearlo.
    }
  }
}