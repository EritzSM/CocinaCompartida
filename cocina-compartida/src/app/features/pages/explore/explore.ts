import { Component, inject, HostListener, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecipeService } from '../../../shared/services/recipe';
import { Recipe } from '../../../shared/interfaces/recipe';
import { Auth } from '../../../shared/services/auth';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './explore.html',
  styleUrls: ['./explore.css']
})
export class Explore {
  // --- DEPENDENCIES ---
  private recipeService = inject(RecipeService);
  authService = inject(Auth);

  // --- STATE MANAGEMENT ---
  
  // Señal con todas las recetas obtenidas del servicio.
  readonly allRecipes = this.recipeService.recipes;

  // Cantidad de recetas a cargar en cada "página" del scroll.
  private readonly recipesPerPage = 3;
  
  // Umbral (90%) para disparar la carga de más recetas antes de llegar al final.
  private readonly SCROLL_THRESHOLD = 0.9;

  // Señal para mantener el número de recetas visibles actualmente.
  visibleRecipeCount = signal<number>(this.recipesPerPage);

  // Señal computada que deriva la lista de recetas a mostrar en el DOM.
  // Se recalcula automáticamente si 'allRecipes' o 'visibleRecipeCount' cambian.
  readonly recipesToShow = computed(() => {
    return this.allRecipes().slice(0, this.visibleRecipeCount());
  });

  /**
   * Optimiza el renderizado en *ngFor al identificar cada receta por su ID único.
   */
  trackByRecipeId(index: number, recipe: Recipe): string {
    return recipe.id;
  }

  /**
   * Escucha el evento de scroll en la ventana para implementar el scroll infinito.
   */
  @HostListener('window:scroll', ['$event'])
  onScroll(event: Event): void {
    const scrollPosition = window.innerHeight + window.scrollY;
    const pageHeight = document.body.offsetHeight;

    // Si el scroll supera el umbral definido, se cargan más recetas.
    if (scrollPosition >= pageHeight * this.SCROLL_THRESHOLD) {
      this.loadMoreRecipes();
    }
  }

  /**
   * Incrementa el contador de recetas visibles para mostrar más elementos en la lista.
   */
  private loadMoreRecipes(): void {
    const totalRecipes = this.allRecipes().length;

    // Solo carga más si el número de recetas visibles es menor que el total.
    if (this.visibleRecipeCount() < totalRecipes) {
      const nextCount = this.visibleRecipeCount() + this.recipesPerPage;
      
      // Actualiza la señal, asegurando no exceder el total de recetas.
      this.visibleRecipeCount.set(Math.min(nextCount, totalRecipes));
    }
  }
}
