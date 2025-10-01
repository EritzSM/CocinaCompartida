import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecipeService } from '../../../shared/services/recipe';
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
  
  recipes = this.recipeService.recipes;

  checkAuthAndNavigate() {
    if (this.authService.isLoged()) {
      // Si está logueado, redirige a crear receta
      this.router.navigate(['/recipe-upload']);
    } else {
      // Si no está logueado, muestra mensaje con SweetAlert2
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