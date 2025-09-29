import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecipeService } from '../../../shared/services/recipe';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class Home {
  recipes = computed(() => this.recipeService.recipes()); // señal reactiva
  currentIndex: { [key: number]: number } = {};

  constructor(private recipeService: RecipeService) {}

  nextImage(recipeIndex: number) {
    const total = this.recipes()[recipeIndex].images.length;
    this.currentIndex[recipeIndex] = ((this.currentIndex[recipeIndex] ?? 0) + 1) % total;
  }

  prevImage(recipeIndex: number) {
    const total = this.recipes()[recipeIndex].images.length;
    this.currentIndex[recipeIndex] =
      ((this.currentIndex[recipeIndex] ?? 0) - 1 + total) % total;
  }
}
