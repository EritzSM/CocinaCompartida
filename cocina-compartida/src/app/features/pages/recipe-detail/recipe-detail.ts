import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { RecipeService } from '../../../shared/services/recipe'; // Ajusta la ruta si es necesario
import { Recipe } from '../../../shared/interfaces/recipe';
import { Auth } from '../../../shared/services/auth';
import { Comment } from '../../../shared/interfaces/comment';
import Swal from 'sweetalert2';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule], // Importamos CommonModule, RouterLink y FormsModule
  templateUrl: './recipe-detail.html',
  styleUrls: ['./recipe-detail.css']
})
export class RecipeDetail implements OnInit {
  recipe: Recipe | undefined;
  currentIndex: number = 0;

  // Inyección de servicios
  private route = inject(ActivatedRoute);
  private recipeService = inject(RecipeService);
  authService = inject(Auth);
  private router = inject(Router);

  newComment: string = '';

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

  submitComment() {
    if (!this.recipe) return;

    if (!this.authService.isAuthenticated()) {
      Swal.fire({
        title: '¡Necesitas iniciar sesión!',
        text: 'Para comentar, primero debes iniciar sesión.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Iniciar Sesión'
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/login']);
        }
      });
      return;
    }

    const text = (this.newComment || '').trim();
    if (!text) {
      Swal.fire({ icon: 'warning', title: 'Escribe un comentario' });
      return;
    }

    // Solo enviamos el texto al backend
    this.recipeService.addComment(this.recipe.id, { text }).then(() => {
      // refrescar la receta desde el store
      const updated = this.recipeService.recipes().find(r => r.id === this.recipe!.id);
      this.recipe = updated;
      this.newComment = '';
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Comentario agregado',
        showConfirmButton: false,
        timer: 1500
      });
    });
  }

  // Acciones: editar y eliminar
  canEdit(): boolean {
  if (!this.recipe) return false;
  const user = this.authService.getUserProfile();
    // Soporta tanto recipe.user.username como recipe.author
    if (!!user && (this.recipe as any).user && (this.recipe as any).user.username === user.username) {
      return true;
    }
    if (!!user && (this.recipe as any).author && (this.recipe as any).author === user.username) {
      return true;
    }
    return false;
  }

  goToEdit(): void {
    if (!this.recipe || !this.canEdit()) return;
    this.router.navigate(['/recipe', this.recipe.id, 'edit']);
  }

  deleteRecipe(): void {
    if (!this.recipe || !this.canEdit()) return;
    Swal.fire({
      title: 'Eliminar receta',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.recipeService.deleteRecipe(this.recipe!.id);
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Receta eliminada', showConfirmButton: false, timer: 1500 });
        this.router.navigate(['/profile']);
      }
    });
  }
}