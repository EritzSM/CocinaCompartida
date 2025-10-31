// src/recipes/recipes.service.ts

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recipe } from './entities/recipe.entity';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class RecipesService {
  constructor(
    @InjectRepository(Recipe)
    private readonly recipeRepository: Repository<Recipe>,
  ) {}

  // 🔹 Crear una receta asociada a un usuario
  async create(createRecipeDto: CreateRecipeDto, user: User): Promise<Recipe> {
    const recipe = this.recipeRepository.create({
      ...createRecipeDto,
      user,
      likes: 0,
      likedBy: [],
    });

    return await this.recipeRepository.save(recipe);
  }

  // 🔹 Listar todas las recetas
  async findAll(): Promise<Recipe[]> {
    return await this.recipeRepository.find({
      relations: ['user', 'comments', 'comments.user'],
      order: { createdAt: 'DESC' },
    });
  }

  // 🔹 Buscar una receta por ID
  async findOne(id: string): Promise<Recipe> {
    const recipe = await this.recipeRepository.findOne({
      where: { id },
      relations: ['user', 'comments', 'comments.user'],
    });

    if (!recipe) {
      throw new NotFoundException(`Recipe with ID "${id}" not found`);
    }

    return recipe;
  }

  // 🔹 Actualizar una receta (solo el autor puede hacerlo)
  async update(
    id: string,
    updateRecipeDto: UpdateRecipeDto,
    user: User,
  ): Promise<Recipe> {
    const recipe = await this.findOne(id);

    if (recipe.user.id !== user.id) {
      throw new ForbiddenException('You can only update your own recipes');
    }

    Object.assign(recipe, updateRecipeDto);
    return await this.recipeRepository.save(recipe);
  }

  // 🔹 Eliminar una receta (solo el autor puede hacerlo)
  async remove(id: string, user: User): Promise<void> {
    const recipe = await this.findOne(id);

    if (recipe.user.id !== user.id) {
      throw new ForbiddenException('You can only delete your own recipes');
    }

    await this.recipeRepository.remove(recipe);
  }

  // 🔹 Dar like a una receta
  async likeRecipe(id: string, user: User): Promise<Recipe> {
    const recipe = await this.findOne(id);

    // Ensure likedBy is initialized to avoid "possibly undefined"
    if (!recipe.likedBy) {
      recipe.likedBy = [];
    }

    if (recipe.likedBy.includes(user.id)) {
      throw new ForbiddenException('You already liked this recipe');
    }

    recipe.likedBy.push(user.id);
    recipe.likes = (recipe.likes ?? 0) + 1;

    return await this.recipeRepository.save(recipe);
  }

  // 🔹 Quitar like
  async unlikeRecipe(id: string, user: User): Promise<Recipe> {
    const recipe = await this.findOne(id);

    // If likedBy is undefined or does not include the user, can't unlike
    if (!recipe.likedBy || !recipe.likedBy.includes(user.id)) {
      throw new ForbiddenException('You have not liked this recipe');
    }

    recipe.likedBy = recipe.likedBy.filter((u) => u !== user.id);
    recipe.likes = Math.max(0, (recipe.likes ?? 0) - 1);

    return await this.recipeRepository.save(recipe);
  }
}
