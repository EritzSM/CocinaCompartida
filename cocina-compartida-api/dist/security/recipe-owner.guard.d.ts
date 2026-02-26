import { CanActivate, ExecutionContext } from '@nestjs/common';
import { RecipesService } from '../recipes/recipes.service';
export declare class RecipeOwnerGuard implements CanActivate {
    private readonly recipes;
    constructor(recipes: RecipesService);
    canActivate(ctx: ExecutionContext): Promise<boolean>;
}
