import { Component, inject, computed, signal, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecipeService } from '../../../shared/services/recipe';
import { Recipe } from '../../../shared/interfaces/recipe';
import { Auth } from '../../../shared/services/auth';
import { Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './explore.html',
  styleUrls: ['./explore.css']
})
export class Explore implements AfterViewInit, OnDestroy {
  private recipeService = inject(RecipeService);
  authService = inject(Auth);
  private router = inject(Router);

  // Referencia al elemento disparador en el HTML
  @ViewChild('loadMoreTrigger') loadMoreTrigger!: ElementRef;
  private observer?: IntersectionObserver;

  readonly allRecipes = this.recipeService.recipes;
  private readonly recipesPerPage = 3;
  visibleRecipeCount = signal<number>(this.recipesPerPage);

  readonly recipesToShow = computed(() => {
    return this.allRecipes().slice(0, this.visibleRecipeCount());
  });

  ngAfterViewInit(): void {
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    // Limpiamos el observador para evitar fugas de memoria
    this.observer?.disconnect();
  }

  private setupIntersectionObserver(): void {
    const options = {
      root: null, // Observa intersecciones en relación con el viewport
      rootMargin: '0px',
      threshold: 0.5 // Se activa cuando el 50% del elemento es visible
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        // Si el elemento está intersectando (visible) y hay más recetas por cargar
        if (entry.isIntersecting && this.visibleRecipeCount() < this.allRecipes().length) {
          this.loadMoreRecipes();
        }
      });
    }, options);

    // Empezamos a observar el elemento disparador
    this.observer.observe(this.loadMoreTrigger.nativeElement);
  }

  private loadMoreRecipes(): void {
    const totalRecipes = this.allRecipes().length;
    if (this.visibleRecipeCount() < totalRecipes) {
      const nextCount = this.visibleRecipeCount() + this.recipesPerPage;
      this.visibleRecipeCount.set(Math.min(nextCount, totalRecipes));
    }
  }

  trackByRecipeId(index: number, recipe: Recipe): string {
    return recipe.id;
  }

  toggleLike(recipeId: string): void {
    if (!this.authService.isLoged()) {
      this.showLoginAlert("dar 'Me Gusta'");
      return;
    }
    this.recipeService.toggleLike(recipeId, this.authService.getCurrentUser()!.id);
  }

  hasLiked(recipe: Recipe): boolean {
    if (!this.authService.isLoged()) return false;
    return recipe.likedBy?.includes(this.authService.getCurrentUser()!.id) ?? false;
  }
  
  private showLoginAlert(action: string): void {
    Swal.fire({
      title: '¡Necesitas iniciar sesión!',
      text: `Para ${action}, primero debes iniciar sesión.`,
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
  }
}