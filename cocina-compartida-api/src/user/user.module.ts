// src/user/user.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './entities/user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';

import { RecipesModule } from '../recipes/recipes.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),

    // Evita ciclos User <-> Auth
    forwardRef(() => AuthModule),

    // Si UserService realmente necesita algo de Recipes (RecipeService/guard),
    // deja el forwardRef; si NO lo necesita, elimínalo para simplificar.
    forwardRef(() => RecipesModule),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [
    UserService,
    TypeOrmModule, // para que otros módulos puedan usar repos de User si hace falta
  ],
})
export class UserModule {}
