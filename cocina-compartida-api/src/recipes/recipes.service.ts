import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recipe } from './entities/recipe.entity';
import { Comment } from './entities/comment.entity';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class RecipesService {
  constructor(
    @InjectRepository(Recipe)
    private readonly recipeRepository: Repository<Recipe>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}

  // Crear receta
  async create(createRecipeDto: CreateRecipeDto, user: User): Promise<Recipe> {
    const recipe = this.recipeRepository.create({
      ...createRecipeDto,
      user,
      likes: 0,
      likedBy: [], 
    });

    return await this.recipeRepository.save(recipe);
  }

  // Listar todas
  async findAll(): Promise<Recipe[]> {
    return await this.recipeRepository.find({
      relations: ['user', 'comments', 'comments.user'],
      order: { createdAt: 'DESC' },
    });
  }

  // Listar top recipes por likes
  async findTopLiked(limit: number = 3): Promise<Recipe[]> {
    return await this.recipeRepository.find({
      relations: ['user', 'comments', 'comments.user'],
      order: { likes: 'DESC', createdAt: 'DESC' },
      take: limit,
    });
  }

  // Buscar una
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

  // Actualizar (solo dueño)
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

  // Eliminar (solo dueño)
  async remove(id: string, user: User): Promise<void> {
    const recipe = await this.findOne(id);

    if (recipe.user.id !== user.id) {
      throw new ForbiddenException('You can only delete your own recipes');
    }

    await this.recipeRepository.remove(recipe);
  }

  // TOGGLE LIKE
  async toggleLike(
    id: string,
    user: User,
  ): Promise<{ likes: number; likedBy: string[] }> {
    const recipe = await this.findOne(id);

    if (!Array.isArray(recipe.likedBy)) {
      recipe.likedBy = [];
    }

    const hasLiked = recipe.likedBy.includes(user.id);

    if (hasLiked) {
      recipe.likedBy = recipe.likedBy.filter((u) => u !== user.id);
    } else {
      recipe.likedBy.push(user.id);
    }

    recipe.likes = recipe.likedBy.length;

    await this.recipeRepository.save(recipe);
    return { likes: recipe.likes, likedBy: recipe.likedBy };
  }

  async createComment(
    recipeId: string,
    createCommentDto: CreateCommentDto,
    user: User,
  ): Promise<Comment> {
    const recipe = await this.findOne(recipeId);

    const comment = this.commentRepository.create({
      ...createCommentDto,
      user,
      recipe,
    });

    return await this.commentRepository.save(comment);
  }

  async findCommentsByRecipe(recipeId: string): Promise<Comment[]> {
    await this.findOne(recipeId);
    return await this.commentRepository.find({
      where: { recipe: { id: recipeId } },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  async removeComment(commentId: string, user: User): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['user'],
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID "${commentId}" not found`);
    }

    if (comment.user.id !== user.id) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.commentRepository.remove(comment);
  }
}
