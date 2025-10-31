import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../services/auth';
import { SearchService, SortOption } from '../../services/search.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './header.html', // Asegúrate de tener este archivo
  styleUrls: ['./header.css']
})
export class Header {
  private router = inject(Router);
  private searchService = inject(SearchService);
  authService = inject(Auth);
  
  searchQuery = '';
  sortOption: SortOption = 'recent';
  selectedCategory = 'todas';

  readonly categories = [
    { id: 'todas', name: 'Todas las recetas' },
    { id: 'entradas', name: 'Entradas' },
    { id: 'platos-fuertes', name: 'Platos Fuertes' },
    { id: 'postres', name: 'Postres' },
    { id: 'bebidas', name: 'Bebidas' },
    { id: 'guarniciones', name: 'Guarniciones' }
  ];

  goToLogin() {
    this.router.navigate(['/login']);
  }

  onSearch() {
    this.searchService.search(this.searchQuery);
  }

  onCategoryChange(categoryId: string) {
    this.selectedCategory = categoryId;
    this.searchService.filterByCategory(categoryId);
  }

  onSortChange() {
    this.searchService.setSortOption(this.sortOption);
  }
}