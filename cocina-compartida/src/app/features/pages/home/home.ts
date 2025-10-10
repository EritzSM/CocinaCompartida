import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecipeService } from '../../../shared/services/recipe';
import { Recipe } from '../../../shared/interfaces/recipe';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../../shared/services/auth';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class Home {
  authService = inject(Auth);
  private recipeService = inject(RecipeService);
  private router = inject(Router);

  // Array completo de recetas (señal)
  allRecipes = this.recipeService.recipes;

  // Mostrar solo 3 recetas inicialmente
  private initialRecipesCount = 3;
  
  // Propiedad computada para mostrar solo las primeras 3 recetas
  get featuredRecipes(): Recipe[] {
    return this.allRecipes().slice(0, this.initialRecipesCount);
  }

  trackByRecipeId(index: number, recipe: any): number {
    return recipe.id;
  }

  // Función para redirigir a la página de exploración
  navigateToExplore() {
    this.router.navigate(['/explore']);
  }

  // Lógica de autenticación original (sin cambios)
  checkAuthAndNavigate() {
    if (this.authService.isLoged()) {
      this.router.navigate(['/recipe-upload']);
    } else {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'Debes iniciar sesión para crear una receta',
        showConfirmButton: true,
        confirmButtonText: 'Iniciar Sesión',
        showCancelButton: true,
        cancelButtonText: 'Cancelar',
        timer: 5000,
        timerProgressBar: true
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/login']);
        }
      });
    }
  }
}