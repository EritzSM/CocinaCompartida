// src/recipes/recipes.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RecipesService } from './recipes.service';
import { RecipesController } from './recipes.controller';
import { Recipe } from './entities/recipe.entity';
import { Comment } from './entities/comment.entity';

import { AuthModule } from '../auth/auth.module';
import { RecipeOwnerGuard } from '../security/recipe-owner.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Recipe, Comment]),
    // Evita ciclo Recipes -> Auth -> User -> Recipes
    forwardRef(() => AuthModule),
  ],
  controllers: [RecipesController],
  providers: [RecipesService, RecipeOwnerGuard],
  exports: [RecipesService],
})
export class RecipesModule {}
