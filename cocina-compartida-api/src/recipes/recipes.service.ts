import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { Recipe } from './entities/recipe.entity';

@Injectable()
export class RecipesService {
  // Usaremos un array en memoria para simular una base de datos.
  private recipes: Recipe[] = [
    {
      id: '1',
      name: 'Tacos al Pastor',
      descripcion: 'Un clásico de la cocina mexicana.',
      ingredients: ['Tortillas de maíz', 'Carne de cerdo', 'Piña', 'Cilantro', 'Cebolla'],
      steps: ['Marinar la carne', 'Cocer la carne en un trompo', 'Cortar y servir en tortillas con los acompañamientos'],
      images: ['https://placehold.co/600x400/E9944A/white?text=Tacos'],
      author: 'ChefMexicano',
      likes: 150,
      avatar: 'https://i.pravatar.cc/150?u=chefmexicano'
    }
  ];

  findAll(): Recipe[] {
    return this.recipes;
  }

  findOne(id: string): Recipe {
    const recipe = this.recipes.find(r => r.id === id);
    if (!recipe) {
      throw new NotFoundException(`Recipe with ID "${id}" not found`);
    }
    return recipe;
  }

  create(createRecipeDto: CreateRecipeDto): Recipe {
    const newRecipe: Recipe = {
      id: uuidv4(),
      ...createRecipeDto,
      likes: 0, // Valor inicial para los 'me gusta'
    };
    this.recipes.push(newRecipe);
    return newRecipe;
  }

  update(id: string, updateRecipeDto: UpdateRecipeDto): Recipe {
    const recipe = this.findOne(id);
    const updatedRecipe = { ...recipe, ...updateRecipeDto };
    
    this.recipes = this.recipes.map(r => (r.id === id ? updatedRecipe : r));
    
    return updatedRecipe;
  }

  remove(id: string) {
    // Verificamos que la receta exista primero. findOne arrojará error si no.
    this.findOne(id);
    this.recipes = this.recipes.filter(r => r.id !== id);
  }
}
