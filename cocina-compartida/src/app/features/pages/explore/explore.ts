import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecipeService } from '../../../shared/services/recipe'; // Ajusta la ruta si es necesario

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
}