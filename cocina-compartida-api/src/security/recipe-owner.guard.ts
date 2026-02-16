// src/security/recipe-owner.guard.ts
import { CanActivate, ExecutionContext, Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { RecipesService } from '../recipes/recipes.service';

@Injectable()
export class RecipeOwnerGuard implements CanActivate {
  constructor(private readonly recipes: RecipesService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const userId = req.user?.id;
    const recipeId = req.params?.id;

    if (!userId) throw new ForbiddenException('No autenticado');
    if (!recipeId) throw new NotFoundException('Receta no encontrada');

    const recipe = await this.recipes.findOne(recipeId);
    if (!recipe) throw new NotFoundException('Receta no encontrada');

    if (recipe.user?.id !== userId) {
      throw new ForbiddenException('Solo el dueño puede realizar esta acción');
    }
    return true;
  }
}
